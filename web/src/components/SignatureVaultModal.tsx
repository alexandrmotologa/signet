import React, { useState, useEffect } from 'react';
import { X, BookmarkCheck, Trash2, Plus, PenTool, Type, Award } from 'lucide-react';

interface SignatureVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertItem: (data: string, type: 'signature' | 'initials' | 'stamp') => void;
}

export const SignatureVaultModal: React.FC<SignatureVaultModalProps> = ({
  isOpen,
  onClose,
  onInsertItem
}) => {
  const [sig, setSig] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [seal, setSeal] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSig(localStorage.getItem('signet_signature'));
      setInitials(localStorage.getItem('signet_initials'));
      setSeal(localStorage.getItem('signet_seal'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (key: string) => {
    localStorage.removeItem(key);
    if (key === 'signet_signature') setSig(null);
    if (key === 'signet_initials') setInitials(null);
    if (key === 'signet_seal') setSeal(null);
  };

  const hasAny = !!(sig || initials || seal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Signature & Stamp Vault
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {!hasAny ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Your vault is empty. Signatures and company seals you create or upload are automatically saved here for quick re-use.
            </div>
          ) : (
            <>
              {/* Primary Signature */}
              {sig && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PenTool className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                        Primary Signature
                      </span>
                      <div className="h-8 max-w-[120px] overflow-hidden mt-0.5">
                        <img src={sig} alt="Saved Sig" className="h-full object-contain" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onInsertItem(sig, 'signature');
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                    >
                      Insert
                    </button>
                    <button
                      onClick={() => handleDelete('signet_signature')}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Initials */}
              {initials && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Type className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                        Saved Initials
                      </span>
                      <div className="h-8 max-w-[120px] overflow-hidden mt-0.5">
                        <img src={initials} alt="Saved Initials" className="h-full object-contain" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onInsertItem(initials, 'initials');
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                    >
                      Insert
                    </button>
                    <button
                      onClick={() => handleDelete('signet_initials')}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Company Seal */}
              {seal && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                        Official Company Seal
                      </span>
                      <div className="h-8 max-w-[120px] overflow-hidden mt-0.5">
                        <img src={seal} alt="Saved Seal" className="h-full object-contain" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onInsertItem(seal, 'stamp');
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                    >
                      Insert
                    </button>
                    <button
                      onClick={() => handleDelete('signet_seal')}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
