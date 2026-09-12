import React, { useState } from 'react';
import { X, Type, Check } from 'lucide-react';

interface TextBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (text: string, fontSize: number) => void;
}

const PRESET_CHIPS = [
  'Full Name',
  'CEO & Co-Founder',
  'Managing Director',
  'Authorized Representative',
  'Approved & Accepted',
  'Independent Contractor'
];

export const TextBadgeModal: React.FC<TextBadgeModalProps> = ({
  isOpen,
  onClose,
  onApplyText
}) => {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState<number>(12);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!text.trim()) {
      alert('Please enter text content for the badge.');
      return;
    }
    onApplyText(text.trim(), fontSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Type className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Add Text Badge
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Badge Text Content
            </label>
            <input
              type="text"
              maxLength={60}
              placeholder="e.g. Director General or ACME Corp"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setText(chip)}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Font Size:</span>
            <div className="flex items-center gap-1">
              {[10, 12, 14, 16].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    fontSize === size
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {size}pt
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Place Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
