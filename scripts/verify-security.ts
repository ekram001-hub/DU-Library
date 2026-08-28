/**
 * Executable verification of the security changes.
 *
 *   npm run verify:security
 *
 * This imports the REAL modules the browser ships (`src/lib/crypto.ts`) and
 * exercises them on Node's WebCrypto implementation, so a green run means the
 * code that ships actually behaves as documented — not a re-implementation of
 * it. It also greps the source tree for the patterns that used to leak PINs.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  sha256Hex,
  hashPin,
  verifyPin,
  generatePinSalt,
  isHashedPin,
  needsHashUpgrade,
  parseStoredPinHash,
  pinHashFingerprint,
  describePinHash,
  normalizePin,
  isValidPin,
  pinValidationError,
  PIN_HASH_ALGORITHM,
  PIN_HASH_ITERATIONS,
} from '../src/lib/crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    failed += 1;
    console.log(`  \u2717 ${name}${detail ? `\n      ${detail}` : ''}`);
  }
}

async function main() {
  console.log('\n1. SHA-256 primitive (known-answer test)');
  const digest = await sha256Hex('1234');
  check(
    "sha256('1234') matches the published NIST/RFC digest",
    digest === '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    `got ${digest}`
  );

  console.log('\n2. PBKDF2-SHA256 credential');
  const pin = '482913';
  const credential = await hashPin(pin);
  check(
    `credential has the documented shape (${PIN_HASH_ALGORITHM}$<iter>$<salt>$<hash>)`,
    new RegExp(`^${PIN_HASH_ALGORITHM.replace('$', '\\$')}\\$${PIN_HASH_ITERATIONS}\\$[0-9a-f]{32}\\$[0-9a-f]{64}$`).test(
      credential
    ),
    credential
  );
  check('isHashedPin() recognises it', isHashedPin(credential));
  check('it needs no upgrade', needsHashUpgrade(credential) === false);
  check('correct PIN verifies', (await verifyPin(pin, credential)) === true);
  check('wrong PIN is rejected', (await verifyPin('482914', credential)) === false);
  check('empty PIN is rejected', (await verifyPin('', credential)) === false);
  check(
    'the plaintext never appears inside the stored credential',
    !credential.includes(pin)
  );

  console.log('\n3. Salting');
  const a = await hashPin(pin);
  const b = await hashPin(pin);
  check('the same PIN hashed twice yields different credentials', a !== b);
  check('both still verify', (await verifyPin(pin, a)) && (await verifyPin(pin, b)));
  const saltA = parseStoredPinHash(a)?.saltHex;
  const saltB = parseStoredPinHash(b)?.saltHex;
  check('salts are 16 random bytes, hex encoded', /^[0-9a-f]{32}$/.test(saltA || ''));
  check('salts differ per credential', saltA !== saltB);
  check('generatePinSalt() produces fresh entropy', generatePinSalt() !== generatePinSalt());

  console.log('\n4. Legacy credential handling (pre-migration rows)');
  const legacySha = `sha256$${await sha256Hex(pin)}`;
  check('legacy unsalted digest still verifies', (await verifyPin(pin, legacySha)) === true);
  check('legacy unsalted digest rejects a wrong PIN', (await verifyPin('000000', legacySha)) === false);
  check('legacy unsalted digest is flagged for upgrade', needsHashUpgrade(legacySha) === true);

  const legacyPlain = pin; // exactly what the old code stored
  check('legacy plaintext still verifies', (await verifyPin(pin, legacyPlain)) === true);
  check('legacy plaintext is flagged for upgrade', needsHashUpgrade(legacyPlain) === true);
  check('legacy plaintext is not reported as hashed', isHashedPin(legacyPlain) === false);

  console.log('\n5. Upgrade path');
  const upgraded = await hashPin(pin);
  check('re-hashing a verified legacy PIN produces a PBKDF2 credential', isHashedPin(upgraded));
  check('the upgraded credential still verifies', (await verifyPin(pin, upgraded)) === true);
  check('the upgraded credential needs no further upgrade', needsHashUpgrade(upgraded) === false);

  console.log('\n6. UI helpers never expose the PIN');
  const fingerprint = pinHashFingerprint(credential);
  check('fingerprint is 8 hex chars', /^[0-9a-f]{8}$/.test(fingerprint), fingerprint);
  check('fingerprint is a slice of the hash, not of the PIN', credential.includes(fingerprint));
  check('describePinHash names the algorithm', describePinHash(credential).includes('PBKDF2-SHA256'));
  check('describePinHash flags legacy rows', describePinHash(legacyPlain).includes('plaintext'));
  check('describePinHash handles "no PIN"', describePinHash(undefined) === 'none');

  console.log('\n7. PIN input rules');
  check('normalizePin strips non-digits', normalizePin(' 48-29 13 ') === '482913');
  check('4 digits is the minimum', isValidPin('4829') === true);
  check('3 digits is rejected', isValidPin('482') === false);
  check('9 digits is truncated to 8', normalizePin('123456789') === '12345678');
  check('1234 is rejected as too guessable', isValidPin('1234') === false);
  check('0000 is rejected', isValidPin('0000') === false);
  check('pinValidationError explains a short PIN', pinValidationError('12')?.includes('at least') === true);
  check('pinValidationError accepts a strong PIN', pinValidationError('482913') === null);

  console.log('\n8. Cost sanity (PBKDF2 must stay usable in a browser)');
  const started = Date.now();
  await hashPin('730419');
  const elapsed = Date.now() - started;
  check(
    `one hash takes under 2s (measured ${elapsed} ms)`,
    elapsed < 2000,
    `${elapsed} ms`
  );

  console.log('\n9. Source tree no longer stores or renders plaintext PINs');
  const context = readFileSync(resolve(root, 'src/context/LibraryContext.tsx'), 'utf8');
  const adminPage = readFileSync(resolve(root, 'src/components/AdminPage.tsx'), 'utf8');
  const supabase = readFileSync(resolve(root, 'src/lib/supabase.ts'), 'utf8');

  check("LibraryContext has no `pass === '...'` password list", !/pass\s*===\s*'/.test(context));
  check('LibraryContext hashes before storing', context.includes('await hashPin('));
  check("LibraryContext never assigns `pin:`", !/\bpin:\s/.test(context));
  check('AdminPage does not render the PIN value', !/PIN:\s*\$\{student\.pin\}/.test(adminPage));
  check('AdminPage renders the hash fingerprint instead', adminPage.includes('pinHashFingerprint('));
  check("AdminPage no longer pre-fills the PIN box with '1234'", !/setNewPinValue\(student\.pin/.test(adminPage));
  check('supabase.ts writes pin_hash, not pin', supabase.includes('PIN_HASH_COLUMN') && !/pin:\s*student\.pin/.test(supabase));

  const sql = readFileSync(resolve(root, 'supabase/01_security_core.sql'), 'utf8');
  check('SQL drops the plaintext column', /drop column if exists pin;/i.test(sql));
  check('SQL creates the admins allow-list', /create table if not exists public\.admins/i.test(sql));
  check('SQL defines is_admin() from the JWT', /auth\.jwt\(\) ->> 'email'/.test(sql));
  check('SQL no longer grants `USING (true)` on students', !/ON public\.students[\s\S]{0,120}USING \(true\)/i.test(sql));
  check('SQL removes students from the realtime publication', /drop table public\.students/i.test(sql));

  console.log(`\n${failed === 0 ? 'PASS' : 'FAIL'} — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

void main();
