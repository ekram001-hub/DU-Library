import React, { useState } from 'react';
import {
  X,
  BookOpen,
  VolumeX,
  Wifi,
  Lock,
  Heart,
  Clock,
  Bell,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  const { branchConfig, notices, currentBranchId } = useLibrary();
  const [activeTab, setActiveTab] = useState<'rules' | 'notices' | 'wifi'>('rules');

  if (!isOpen) return null;

  const branchNotices = notices.filter(
    (n) => n.targetBranch === 'all' || n.targetBranch === currentBranchId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                নিয়মাবলী, নোটিশ বোর্ড ও ওয়াইফাই গাইডলাইন
              </h3>
              <p className="text-xs text-slate-400">
                {branchConfig.bengaliName} • Guidelines & Rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>লাইব্রেরি আচরণবিধি (Rules)</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'notices'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>নোটিশ বোর্ড ({branchNotices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'wifi'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>ওয়াইফাই ও সুবিধাসমূহ</span>
          </button>
        </div>

        {/* Tab Content Container (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 scrollbar-thin">
          {/* Tab 1: Rules & Guidelines */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              {/* Rule Card 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>১. সম্পূর্ণ নীরবতা ও মোবাইল সাইলেন্ট পলিসি</span>
                </div>
                <p className="text-slate-400 pl-6 leading-relaxed">
                  স্টাডি রুমে প্রবেশের সাথে সাথে মোবাইল ফোন বাধ্যতামূলকভাবে সাইলেন্ট বা ভাইব্রেশন মোডে রাখতে হবে। রুমে কোনো প্রকার ফিসফিস করে কথা বলা বা ফোনে রিংটোন বাজানো সম্পূর্ণ নিষিদ্ধ। জরুরি ফোন রিসিভের জন্য লাউঞ্জ বা করিডোর ব্যবহার করুন।
                </p>
              </div>

              {/* Rule Card 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>২. বিরতি টাইমার ও সিট বুকিং নিয়মাবলী</span>
                </div>
                <p className="text-slate-400 pl-6 leading-relaxed">
                  নামায, খাবার বা চা পানের জন্য বাইরে যাওয়ার সময় অ্যাপের "বিরতি নিন (Away Timer)" ব্যবহার করুন। বিরতির নির্ধারিত সময় (১৫-৬০ মিনিট) অতিক্রম হলে সিটটি স্বয়ংক্রিয়ভাবে ফাঁকা হয়ে যেতে পারে। স্টাডি সেশন সমাপ্ত হলে অবশ্যই "সিট ত্যাগ করুন" বাটনে ক্লিক করুন।
                </p>
              </div>

              {/* Rule Card 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>৩. মহিলা সংরক্ষিত কর্নার (Female-Only Area)</span>
                </div>
                <p className="text-slate-400 pl-6 leading-relaxed">
                  মহিলা সংরক্ষিত কক্ষ বা কর্নারগুলোতে শুধুমাত্র নারী শিক্ষার্থীরাই আসন গ্রহণ করতে পারবেন। এই জোনের পূর্ণ নিরাপত্তা ও শালীনতা নিশ্চিত করা সকলের দায়িত্ব।
                </p>
              </div>

              {/* Rule Card 4 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-400" />
                  <span>৪. ব্যক্তিগত মালামাল ও পরিচ্ছন্নতা</span>
                </div>
                <p className="text-slate-400 pl-6 leading-relaxed">
                  আপনার ল্যাপটপ, বইপত্র ও মূল্যবান জিনিসপত্রের দায়িত্ব আপনার নিজের। ডেস্কে কোনো খাবারের উচ্ছিষ্ট বা ময়লা ফেলা যাবে না। প্রতিটি রুম সিসিটিভি ক্যামেরা দ্বারা সার্বক্ষণিক পর্যবেক্ষণে থাকে।
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Notice Board */}
          {activeTab === 'notices' && (
            <div className="space-y-3">
              {branchNotices.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    n.priority === 'urgent'
                      ? 'bg-rose-950/30 border-rose-500/40'
                      : n.priority === 'info'
                      ? 'bg-sky-950/30 border-sky-500/40'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                      {n.priority === 'urgent' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                      {n.priority === 'info' && <Info className="w-4 h-4 text-sky-400" />}
                      <span>{n.bengaliTitle}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {n.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {n.bengaliContent}
                  </p>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>প্রণেতা: {n.author}</span>
                    <span className="uppercase font-semibold text-slate-400">
                      {n.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Wi-Fi & Amenities */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/40 space-y-3">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-sm">
                  <Wifi className="w-5 h-5 text-sky-400" />
                  <span>হাই-স্পিড অপটিক্যাল ফাইবার ওয়াইফাই তথ্য</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Wi-Fi Network (SSID):</span>
                    <span className="font-bold text-slate-100 font-mono">
                      {currentBranchId === 'bcs_study' ? 'BCS_STUDY_5G_FAST' : 'FRESH_STUDY_5G_PLUS'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">পাসওয়ার্ড (Password):</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      study@2026#bcs
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  ⚡ আনলিমিটেড ব্যান্ডউইথ ও ভিডিও লেকচার স্পিড অপ্টিমাইজড। অননুমোদিত বড় ফাইল টরেন্ট ডাউনলোড নিষিদ্ধ।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200">লাইব্রেরির অন্যান্য সুবিধাসমূহ:</div>
                <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                  <li>প্রতিটি ডেস্কে আলাদা এলইডি রিডিং ল্যাম্প ও চার্জিং সকেট</li>
                  <li>ঠান্ডা ও স্বাভাবিক ফিল্টার্ড খাওয়ার পানি</li>
                  <li>নামাযের জন্য আলাদা নিরিবিলি অজুর স্থান ও জায়নামায</li>
                  <li>চা ও কফি ভেন্ডিং কর্নার (লাউঞ্জে)</li>
                  <li>২৪ ঘণ্টা আইপিএস ও জেনারেটর বিদ্যুৎ ব্যাকআপ</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>অফিসিয়াল হেল্পডেস্ক / লাইব্রেরিয়ান:</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  {branchConfig.phone}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            বুঝেছি (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
