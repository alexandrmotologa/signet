import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  filename: string;
  currentPage: number;
  pageCount: number;
  zoom: number;
  isDark: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  filename,
  currentPage,
  pageCount,
  zoom,
  isDark,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      {/* File Info */}
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-xs">
            {filename}
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Page {currentPage + 1} of {Math.max(1, pageCount)}
          </p>
        </div>
      </div>

      {/* Page Navigation & Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Page Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 0}
            className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            {currentPage + 1}/{Math.max(1, pageCount)}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= pageCount - 1}
            className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.8}
            className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 2.5}
            className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
