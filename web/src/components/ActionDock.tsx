import React from 'react';
import { PenTool, Calendar, ShieldCheck, Send, Download, Type } from 'lucide-react';

interface ActionDockProps {
  onAddSignature: () => void;
  onAddDate: () => void;
  onAddInitials: () => void;
  includeAudit: boolean;
  onToggleAudit: () => void;
  onCompleteAndSend: () => void;
  onDirectDownload: () => void;
  isSaving: boolean;
  placementsCount: number;
  isTelegramEnv: boolean;
}

export const ActionDock: React.FC<ActionDockProps> = ({
  onAddSignature,
  onAddDate,
  onAddInitials,
  includeAudit,
  onToggleAudit,
  onCompleteAndSend,
  onDirectDownload,
  isSaving,
  placementsCount,
  isTelegramEnv
}) => {
  return (
    <div className="sticky bottom-0 z-30 w-full p-2.5 sm:p-4 pointer-events-none flex justify-center">
      <div className="w-full max-w-lg glass-dock rounded-2xl shadow-xl p-2 sm:p-2.5 pointer-events-auto flex flex-col gap-2">
        {/* Secondary Tool Bar */}
        <div className="flex items-center justify-between gap-1 px-1">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            {/* Add Signature */}
            <button
              onClick={onAddSignature}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 text-xs font-medium transition active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Sign</span>
            </button>

            {/* Add Date Stamp */}
            <button
              onClick={onAddDate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 text-xs font-medium transition active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Date</span>
            </button>

            {/* Add Initials */}
            <button
              onClick={onAddInitials}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 text-xs font-medium transition active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Initials</span>
            </button>
          </div>

          {/* Audit Trail Toggle */}
          <button
            onClick={onToggleAudit}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
              includeAudit
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Append tamper-evident audit certificate page to document"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit Trail</span>
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          {/* Main Button: Send to Telegram or Download */}
          <button
            onClick={onCompleteAndSend}
            disabled={isSaving || placementsCount === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/25 transition active:scale-[0.98]"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Baking & Saving...</span>
              </span>
            ) : isTelegramEnv ? (
              <>
                <Send className="w-4 h-4" />
                <span>Save & Send to Chat ({placementsCount})</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Save & Download PDF ({placementsCount})</span>
              </>
            )}
          </button>

          {/* Direct Download button if in Telegram */}
          {isTelegramEnv && (
            <button
              onClick={onDirectDownload}
              disabled={isSaving || placementsCount === 0}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 border border-slate-200 dark:border-slate-700 transition"
              title="Download copy to browser"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
