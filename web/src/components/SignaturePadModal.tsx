import React, { useState, useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { X, RotateCcw, Check, PenTool, Type, BookmarkCheck } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pngDataUrl: string, type: 'signature' | 'initials') => void;
  title?: string;
  isInitialsMode?: boolean;
}

const INK_COLORS = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'Blue', hex: '#1d4ed8' },
  { name: 'Navy', hex: '#1e3a8a' }
];

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Create Signature',
  isInitialsMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [selectedColor, setSelectedColor] = useState<string>(INK_COLORS[0].hex);
  const [typedText, setTypedText] = useState<string>('');
  const [hasSavedSig, setHasSavedSig] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);

  // Check saved signature in localStorage
  useEffect(() => {
    const saved = localStorage.getItem(isInitialsMode ? 'signet_initials' : 'signet_signature');
    setHasSavedSig(!!saved);
  }, [isOpen, isInitialsMode]);

  // Initialize SignaturePad
  useEffect(() => {
    if (!isOpen || activeTab !== 'draw') return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Adjust canvas size to parent container
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (padRef.current) {
        padRef.current.off();
      }

      const pad = new SignaturePad(canvas, {
        penColor: selectedColor,
        minWidth: 1.5,
        maxWidth: 3.5,
        velocityFilterWeight: 0.7
      });

      padRef.current = pad;
    }, 50);

    return () => {
      clearTimeout(timer);
      if (padRef.current) {
        padRef.current.off();
        padRef.current = null;
      }
    };
  }, [isOpen, activeTab, selectedColor]);

  // Update pen color
  useEffect(() => {
    if (padRef.current) {
      padRef.current.penColor = selectedColor;
    }
  }, [selectedColor]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
    }
    setTypedText('');
  };

  const handleUseSaved = () => {
    const saved = localStorage.getItem(isInitialsMode ? 'signet_initials' : 'signet_signature');
    if (saved) {
      onSave(saved, isInitialsMode ? 'initials' : 'signature');
      onClose();
    }
  };

  const handleApply = () => {
    let finalPng = '';

    if (activeTab === 'draw') {
      if (!padRef.current || padRef.current.isEmpty()) {
        alert('Please draw your signature first.');
        return;
      }
      finalPng = padRef.current.toDataURL('image/png');
    } else {
      if (!typedText.trim()) {
        alert('Please enter your name or initials.');
        return;
      }

      // Render typed text to off-screen canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = 400;
      offscreen.height = 140;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 400, 140);
        ctx.fillStyle = selectedColor;
        ctx.font = 'bold 54px Caveat, cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedText.trim(), 200, 70);
        finalPng = offscreen.toDataURL('image/png');
      }
    }

    if (finalPng) {
      // Persist for quick re-use
      localStorage.setItem(isInitialsMode ? 'signet_initials' : 'signet_signature', finalPng);
      onSave(finalPng, isInitialsMode ? 'initials' : 'signature');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
              {isInitialsMode ? 'Add Initials' : title}
            </h2>
            {hasSavedSig && (
              <button
                onClick={handleUseSaved}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Use Saved</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1 gap-1">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'type'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-4 flex-1 flex flex-col">
          {activeTab === 'draw' ? (
            <div className="relative w-full h-52 sm:h-60 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden touch-none flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
              <div className="absolute bottom-2 left-3 pointer-events-none text-[11px] text-slate-400">
                Draw with finger or stylus
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 h-52 sm:h-60 justify-center">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isInitialsMode ? 'Enter Initials' : 'Type Your Full Name'}
                </label>
                <input
                  type="text"
                  maxLength={isInitialsMode ? 5 : 40}
                  placeholder={isInitialsMode ? 'e.g. AM' : 'e.g. Alex Motologa'}
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Handwritten Preview */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[90px]">
                {typedText.trim() ? (
                  <span
                    className="font-handwriting text-3xl sm:text-4xl select-none"
                    style={{ color: selectedColor }}
                  >
                    {typedText.trim()}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Handwritten preview appears here</span>
                )}
              </div>
            </div>
          )}

          {/* Color Chooser & Clear Button */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Ink:</span>
              {INK_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    selectedColor === color.hex
                      ? 'border-blue-500 scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>

            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition px-2 py-1 rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
