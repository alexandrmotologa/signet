import React, { useRef, useState, useEffect } from 'react';
import { DraggableItem, type PlacementState } from './DraggableItem.js';
import { Loader2, AlertCircle } from 'lucide-react';

interface PdfViewerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  error: string | null;
  currentPageIndex: number;
  placements: PlacementState[];
  selectedItemId: string | null;
  onSelectPlacement: (id: string | null) => void;
  onUpdatePlacement: (id: string, updated: Partial<PlacementState>) => void;
  onDeletePlacement: (id: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  canvasRef,
  isLoading,
  error,
  currentPageIndex,
  placements,
  selectedItemId,
  onSelectPlacement,
  onUpdatePlacement,
  onDeletePlacement
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Update overlay dimension whenever canvas rendered or resized
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [canvasRef, isLoading, currentPageIndex]);

  const currentPagePlacements = placements.filter((p) => p.pageIndex === currentPageIndex);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full flex items-center justify-center p-3 sm:p-6 overflow-auto"
      onClick={() => onSelectPlacement(null)}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Rendering PDF page...</p>
        </div>
      )}

      {/* Error Display */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-2 p-6 max-w-md text-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400">
          <AlertCircle className="w-8 h-8" />
          <p className="text-xs font-semibold">Document Error</p>
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}

      {/* PDF Canvas & Interactive Overlay */}
      <div
        className={`relative transition-opacity duration-200 ${
          isLoading || error ? 'hidden' : 'inline-block'
        }`}
        style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg bg-white border border-slate-200 dark:border-slate-800 block shadow-sm"
        />

        {/* Overlay for Placements */}
        <div
          className="absolute inset-0 pointer-events-auto rounded-lg overflow-hidden"
          style={{
            width: dimensions.width > 0 ? `${dimensions.width}px` : '100%',
            height: dimensions.height > 0 ? `${dimensions.height}px` : '100%'
          }}
          onClick={(e) => {
            // Click on document background deselects active item
            if (e.target === e.currentTarget) {
              onSelectPlacement(null);
            }
          }}
        >
          {currentPagePlacements.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              containerWidth={dimensions.width}
              containerHeight={dimensions.height}
              isSelected={selectedItemId === item.id}
              onSelect={() => onSelectPlacement(item.id)}
              onUpdate={(updated) => onUpdatePlacement(item.id, updated)}
              onDelete={() => onDeletePlacement(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
