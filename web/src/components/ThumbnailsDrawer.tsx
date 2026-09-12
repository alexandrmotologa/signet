import React from 'react';
import { X, Layers, FileText, CheckCircle } from 'lucide-react';
import type { PlacementState } from './DraggableItem.js';

interface ThumbnailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pageCount: number;
  currentPageIndex: number;
  placements: PlacementState[];
  onSelectPage: (pageIndex: number) => void;
}

export const ThumbnailsDrawer: React.FC<ThumbnailsDrawerProps> = ({
  isOpen,
  onClose,
  pageCount,
  currentPageIndex,
  placements,
  onSelectPage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Document Pages
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {pageCount} total pages in this document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnails Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4 overflow-y-auto">
          {Array.from({ length: pageCount }).map((_, idx) => {
            const pagePlacements = placements.filter((p) => p.pageIndex === idx);
            const isCurrent = idx === currentPageIndex;

            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectPage(idx);
                  onClose();
                }}
                className={`flex flex-col items-center p-2.5 rounded-xl border-2 transition relative text-left group ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50 dark:bg-slate-950/40'
                }`}
              >
                {/* Page Mock Card */}
                <div className="w-full aspect-[3/4] bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 p-2 flex flex-col justify-between shadow-xs mb-1.5">
                  <div className="space-y-1">
                    <div className="w-3/4 h-1 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700/60 rounded" />
                    <div className="w-5/6 h-0.5 bg-slate-100 dark:bg-slate-700/60 rounded" />
                    <div className="w-2/3 h-0.5 bg-slate-100 dark:bg-slate-700/60 rounded" />
                  </div>

                  {pagePlacements.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>{pagePlacements.length} items</span>
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Page {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
