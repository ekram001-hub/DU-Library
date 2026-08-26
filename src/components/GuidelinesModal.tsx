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
  const { branchConfig, notices, currentBranchId, rules, wifiFacilities } = useLibrary();
  const [activeTab, setActiveTab] = useState<'rules' | 'notices' | 'wifi'>('rules');

  if (!isOpen) return null;

  const branchNotices = notices.filter(
    (n) => n.targetBranch === 'all' || n.targetBranch === currentBranchId
  );

  const branchRules = (rules || []).filter(
    (r) => r.branchId === 'all' || r.branchId === currentBranchId
  );

  const wifiConfig = wifiFacilities?.[currentBranchId] || {
    branchId: currentBranchId,
    ssid: currentBranchId === 'science_library' ? 'SCIENCE_LIB_5G_FAST' : 'CENTRAL_LIB_5G_PLUS',
    password: 'study@2026#pass',
    notes: 'Optimized for online video lectures and research. High-volume torrents and unapproved downloads are restricted.',
    amenities: [
      'Individual desk LED lamps and power sockets',
      'Filtered hot, cold, and ambient drinking water',
      'Quiet prayer room with ablution facility',
      'Coffee and tea refreshment lounge',
      '24/7 IPS and generator power backup',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Guidelines, Notices & Amenities
              </h3>
              <p className="text-xs text-slate-500">
                {branchConfig.name} • Rules & Facilities
              </p>
            </div>
          </div>


          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Code of Conduct</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'notices'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notice Board ({branchNotices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'wifi'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi & Facilities</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-600">
          {/* Tab 1: Rules & Guidelines */}
          {activeTab === 'rules' && (
            <div className="space-y-2.5">
              {branchRules.length > 0 ? (
                branchRules.map((rule, idx) => (
                  <div key={rule.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="text-base">{rule.icon || '📌'}</span>
                      <span>{idx + 1}. {rule.title}</span>
                      {rule.category && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded ml-auto">
                          {rule.category}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 pl-6 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400">
                  No guidelines published for this branch yet.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Notice Board */}
          {activeTab === 'notices' && (
            <div className="space-y-2.5">
              {branchNotices.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-lg border space-y-1.5 ${
                    n.priority === 'urgent'
                      ? 'bg-rose-50/70 border-rose-200'
                      : n.priority === 'info'
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                      {n.priority === 'urgent' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      {n.priority === 'info' && <Info className="w-3.5 h-3.5 text-blue-500" />}
                      <span>{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {n.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {n.content}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span>By: {n.author}</span>
                    <span className="uppercase font-semibold text-slate-500">
                      {n.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Wi-Fi & Amenities */}
          {activeTab === 'wifi' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-blue-800 font-semibold text-xs">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span>High-Speed Optical Fiber Wi-Fi</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-blue-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Wi-Fi Network (SSID)</span>
                    <span className="font-semibold text-slate-900 font-mono text-xs">
                      {wifiConfig.ssid}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Password</span>
                    <span className="font-semibold text-emerald-600 font-mono text-xs">
                      {wifiConfig.password}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  {wifiConfig.notes}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="font-semibold text-slate-800 text-xs">Center Amenities:</div>
                <ul className="space-y-1 text-slate-600 list-disc list-inside text-xs">
                  {wifiConfig.amenities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Helpdesk / Librarian:</span>
                </div>
                <span className="font-mono text-slate-900 font-semibold">
                  {branchConfig.phone}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

