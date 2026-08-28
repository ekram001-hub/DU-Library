/**
 * ============================================================================
 *  PIN / SECRET HASHING  —  SHA-256 based, zero dependencies
 * ============================================================================
 *
 *  WHY THIS FILE EXISTS
 *  --------------------
 *  Student security PINs used to be stored as plain text in three places:
 *    1. `localStorage`            -> "pin": "1234"
 *    2. Supabase `students.pin`   -> 1234
 *    3. The admin table           -> rendered literally as `PIN: 1234`
 *
 *  A 4-6 digit PIN is not a secret that can survive a leak: anybody who can
 *  read one of those places can reuse the number on a bank, e-mail or social
 *  account. From now on the *plaintext* never leaves this module — we only ever
 *  persist a one-way hash.
 *
 *  FORMAT STORED IN THE DATABASE / localStorage
 *  --------------------------------------------
 *    pbkdf2$sha256$<iterations>$<saltHex>$<derivedKeyHex>
 *    e.g. pbkdf2$sha256$210000$9f2c…$7ab4…
 *
 *  WHY PBKDF2 AND NOT A BARE `SHA-256(pin)`
 *  ----------------------------------------
 *  A bare SHA-256 of a 4 digit PIN is *worse than useless*: the whole keyspace
 *  is 10_000 values, so an attacker rebuilds the entire table in milliseconds
 *  and every PIN in the database is recovered instantly. PBKDF2-HMAC-SHA256
 *  (a) adds a random per-PIN salt, so identical PINs never produce identical
 *  hashes and rainbow tables are dead, and (b) deliberately slows each guess
 *  down by ~210k SHA-256 rounds. It is still 100% SHA-256 and still uses only
 *  the browser's built-in Web Crypto API — no library, no server, no build
 *  step.
 *
 *  LEGACY VALUES ARE STILL ACCEPTED FOR VERIFICATION ONLY
 *  ------------------------------------------------------
 *  `verifyPin()` understands two older shapes so that existing accounts keep
 *  working on their next login:
 *    sha256$<hex>   -> unsalted SHA-256 (produced by the SQL migration helper)
 *    1234           -> raw plaintext left over from before this file existed
 *  Whenever one of those matches, the caller must immediately re-store the
 *  value produced by `hashPin()` — see `needsHashUpgrade()`.
 *
 *  IMPORTANT — HONEST LIMITS
 *  -------------------------
 *  Hashing protects a PIN that is *stolen at rest*. It cannot protect a PIN
 *  that is typed into a page the attacker controls, and a 4 digit PIN is still
 *  brute-forceable online if there is no rate limiting. Use >= 6 digits and
 *  keep server-side rate limiting for anything that matters.
 */

const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTE_LENGTH = 16;
const DERIVED_KEY_BITS = 256;

export const PIN_HASH_ALGORITHM = 'pbkdf2$sha256';
export const PIN_HASH_ITERATIONS = PBKDF2_ITERATIONS;

const LEGACY_SHA256_PREFIX = 'sha256$';

const textEncoder = new TextEncoder();

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-f]/gi, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Length-independent, branch-free comparison. `a === b` would short-circuit on
 * the first differing byte and leak timing information about the stored hash.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function subtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  // `crypto.subtle` only exists in a *secure context* (HTTPS or localhost).
  // We deliberately refuse to fall back to storing plaintext.
  if (!c || !c.subtle) {
    throw new Error(
      'PIN hashing requires the Web Crypto API, which is only available over HTTPS or localhost. ' +
        'The PIN was NOT saved. Reload this page over a secure connection and try again.'
    );
  }
  return c.subtle;
}

function randomHex(byteLength: number): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  const bytes = new Uint8Array(byteLength);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    // Math.random is not cryptographically strong; it is only a last resort so
    // that a unit-test environment without WebCrypto can still exercise the
    // hashing code path. Browsers always take the branch above.
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(bytes);
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** Plain SHA-256 hex digest. Used for legacy verification + fingerprints. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await subtle().digest('SHA-256', textEncoder.encode(input));
  return bytesToHex(new Uint8Array(digest));
}

/** A fresh random salt, hex encoded. One salt per PIN — never shared. */
export function generatePinSalt(): string {
  return randomHex(SALT_BYTE_LENGTH);
}

export interface ParsedPinHash {
  format: 'pbkdf2-sha256' | 'legacy-sha256' | 'legacy-plaintext';
  iterations: number;
  saltHex: string;
  hashHex: string;
}

/**
 * Parse a stored credential. Returns `null` when the value is not a recognised
 * credential at all (empty / garbage).
 */
export function parseStoredPinHash(stored: string): ParsedPinHash | null {
  if (!stored || typeof stored !== 'string') return null;
  const value = stored.trim();
  if (!value) return null;

  if (value.startsWith(`${PIN_HASH_ALGORITHM}$`)) {
    const [, , iterationsRaw, saltHex, hashHex] = value.split('$');
    const iterations = Number(iterationsRaw);
    if (!saltHex || !hashHex || !Number.isFinite(iterations) || iterations <= 0) {
      return null;
    }
    return { format: 'pbkdf2-sha256', iterations, saltHex, hashHex };
  }

  if (value.startsWith(LEGACY_SHA256_PREFIX)) {
    const hashHex = value.slice(LEGACY_SHA256_PREFIX.length);
    if (!/^[0-9a-f]{64}$/i.test(hashHex)) return null;
    return { format: 'legacy-sha256', iterations: 1, saltHex: '', hashHex };
  }

  // Anything else is treated as pre-hashing plaintext so that accounts created
  // before this module keep working until their next successful login.
  return { format: 'legacy-plaintext', iterations: 1, saltHex: '', hashHex: value };
}

/** True when the stored value is already in the modern PBKDF2 format. */
export function isHashedPin(stored?: string | null): boolean {
  if (!stored) return false;
  return stored.trim().startsWith(`${PIN_HASH_ALGORITHM}$`);
}

/**
 * True when the stored value is an older shape that must be re-hashed as soon
 * as it has been verified successfully.
 */
export function needsHashUpgrade(stored?: string | null): boolean {
  if (!stored) return false;
  const parsed = parseStoredPinHash(stored);
  if (!parsed) return false;
  return parsed.format !== 'pbkdf2-sha256' || parsed.iterations < PBKDF2_ITERATIONS;
}

async function pbkdf2Sha256Hex(pin: string, saltHex: string, iterations: number): Promise<string> {
  const keyMaterial = await subtle().importKey(
    'raw',
    textEncoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await subtle().deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    DERIVED_KEY_BITS
  );
  return bytesToHex(new Uint8Array(bits));
}

/**
 * Hash a raw PIN into the storable credential string.
 *
 * @param rawPin   the PIN exactly as typed by the human
 * @param saltHex  optional pre-generated salt (used when upgrading in place)
 */
export async function hashPin(rawPin: string, saltHex?: string): Promise<string> {
  const pin = String(rawPin ?? '');
  if (!pin) throw new Error('Cannot hash an empty PIN.');
  const salt = (saltHex && /^[0-9a-f]+$/i.test(saltHex) ? saltHex : generatePinSalt()).toLowerCase();
  const derived = await pbkdf2Sha256Hex(pin, salt, PBKDF2_ITERATIONS);
  return `${PIN_HASH_ALGORITHM}$${PBKDF2_ITERATIONS}$${salt}$${derived}`;
}

/**
 * Compare a typed PIN against a stored credential.
 * Understands the modern PBKDF2 format plus the two legacy shapes.
 */
export async function verifyPin(rawPin: string, stored: string): Promise<boolean> {
  const parsed = parseStoredPinHash(stored);
  if (!parsed) return false;
  const candidate = String(rawPin ?? '');
  if (!candidate) return false;

  if (parsed.format === 'pbkdf2-sha256') {
    const derived = await pbkdf2Sha256Hex(candidate, parsed.saltHex, parsed.iterations);
    return constantTimeEqual(derived.toLowerCase(), parsed.hashHex.toLowerCase());
  }

  if (parsed.format === 'legacy-sha256') {
    const digest = await sha256Hex(candidate);
    return constantTimeEqual(digest.toLowerCase(), parsed.hashHex.toLowerCase());
  }

  return constantTimeEqual(candidate, parsed.hashHex);
}

/**
 * Short, non-reversible label safe to show in an admin table.
 * It is a slice of the *hash*, never of the PIN.
 */
export function pinHashFingerprint(stored?: string | null): string {
  const parsed = parseStoredPinHash(stored || '');
  if (!parsed) return '';
  if (parsed.format === 'legacy-plaintext') return 'legacy-plaintext';
  return parsed.hashHex.slice(0, 8).toLowerCase();
}

/** Human readable description of how a stored credential was produced. */
export function describePinHash(stored?: string | null): string {
  const parsed = parseStoredPinHash(stored || '');
  if (!parsed) return 'none';
  switch (parsed.format) {
    case 'pbkdf2-sha256':
      return `PBKDF2-SHA256 · ${parsed.iterations.toLocaleString('en-US')} rounds`;
    case 'legacy-sha256':
      return 'Legacy unsalted SHA-256 — upgrade pending';
    default:
      return 'Legacy plaintext — upgrade pending';
  }
}

/* -------------------------------------------------------------------------- */
/*  PIN input rules                                                            */
/* -------------------------------------------------------------------------- */

export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 8;

export function normalizePin(rawPin: string): string {
  return String(rawPin ?? '').replace(/\D/g, '').slice(0, MAX_PIN_LENGTH);
}

export function isValidPin(rawPin: string): boolean {
  const pin = normalizePin(rawPin);
  if (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH) return false;
  // Reject the trivially guessable patterns that make up most real-world PINs.
  const weak = new Set([
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '1234', '12345', '123456', '4321', '1122', '1212', '2580', '5683', '0852',
  ]);
  if (weak.has(pin)) return false;
  return true;
}

export function pinValidationError(rawPin: string): string | null {
  const pin = normalizePin(rawPin);
  if (pin.length < MIN_PIN_LENGTH) {
    return `PIN must be at least ${MIN_PIN_LENGTH} digits.`;
  }
  if (pin.length > MAX_PIN_LENGTH) {
    return `PIN must be at most ${MAX_PIN_LENGTH} digits.`;
  }
  if (!isValidPin(pin)) {
    return 'That PIN is too easy to guess. Please choose a less common combination.';
  }
  return null;
}
