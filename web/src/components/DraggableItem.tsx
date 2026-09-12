import React, { useRef, useState } from 'react';
import { X, Move, Scaling } from 'lucide-react';

export interface PlacementState {
  id: string;
  pageIndex: number;
  normalizedX: number; // 0.0 to 1.0
  normalizedY: number; // 0.0 to 1.0
  normalizedWidth: number; // 0.0 to 1.0
  normalizedHeight: number; // 0.0 to 1.0
  type: 'signature' | 'date' | 'initials' | 'text';
  data?: string; // base64 PNG
  text?: string;
  isSelected?: boolean;
}

interface DraggableItemProps {
  item: PlacementState;
  containerWidth: number;
  containerHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: Partial<PlacementState>) => void;
  onDelete: () => void;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  containerWidth,
  containerHeight,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialNormX: number;
    initialNormY: number;
  } | null>(null);

  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  // Compute CSS pixel bounds
  const leftPx = item.normalizedX * containerWidth;
  const topPx = item.normalizedY * containerHeight;
  const widthPx = Math.max(30, item.normalizedWidth * containerWidth);
  const heightPx = Math.max(20, item.normalizedHeight * containerHeight);

  // Pointer drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialNormX: item.normalizedX,
      initialNormY: item.normalizedY
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || containerWidth === 0 || containerHeight === 0) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const deltaNormX = deltaX / containerWidth;
    const deltaNormY = deltaY / containerHeight;

    let newNormX = dragStartRef.current.initialNormX + deltaNormX;
    let newNormY = dragStartRef.current.initialNormY + deltaNormY;

    // Clamp within canvas boundaries
    newNormX = Math.max(0, Math.min(1 - item.normalizedWidth, newNormX));
    newNormY = Math.max(0, Math.min(1 - item.normalizedHeight, newNormY));

    onUpdate({
      normalizedX: newNormX,
      normalizedY: newNormY
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  // Resize handle
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsResizing(true);

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: item.normalizedWidth,
      initialHeight: item.normalizedHeight
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing || !resizeStartRef.current || containerWidth === 0 || containerHeight === 0) return;

    const deltaX = e.clientX - resizeStartRef.current.startX;
    const deltaY = e.clientY - resizeStartRef.current.startY;

    const deltaNormW = deltaX / containerWidth;
    const deltaNormH = deltaY / containerHeight;

    const minNormW = 40 / containerWidth;
    const minNormH = 20 / containerHeight;

    const newNormW = Math.max(minNormW, Math.min(1 - item.normalizedX, resizeStartRef.current.initialWidth + deltaNormW));
    const newNormH = Math.max(minNormH, Math.min(1 - item.normalizedY, resizeStartRef.current.initialHeight + deltaNormH));

    onUpdate({
      normalizedWidth: newNormW,
      normalizedHeight: newNormH
    });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (isResizing) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setIsResizing(false);
      resizeStartRef.current = null;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        touchAction: 'none'
      }}
      className={`group select-none cursor-move transition-shadow ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg bg-blue-500/10'
          : 'hover:ring-1 hover:ring-blue-400/50'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Visual Content */}
      <div className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden p-0.5">
        {item.type === 'signature' || item.type === 'initials' ? (
          item.data ? (
            <img
              src={item.data}
              alt="Signature"
              className="w-full h-full object-contain filter drop-shadow-sm"
              draggable={false}
            />
          ) : (
            <span className="text-xs text-slate-400 italic">Signature</span>
          )
        ) : item.type === 'date' ? (
          <div className="w-full h-full flex items-center justify-center bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-medium text-slate-800 dark:text-slate-100 shadow-sm">
            {item.text || 'YYYY-MM-DD'}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-sm">
            {item.text || 'Text'}
          </div>
        )}
      </div>

      {/* Action Overlay Controls (Visible When Selected) */}
      {isSelected && (
        <>
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-3 -right-3 z-10 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition"
            title="Remove item"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Drag Indicator Icon */}
          <div className="absolute -top-3 -left-3 z-10 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md pointer-events-none">
            <Move className="w-3 h-3" />
          </div>

          {/* Resize Corner Handle */}
          <div
            className="absolute -bottom-2 -right-2 z-10 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md cursor-se-resize touch-none"
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            title="Resize"
          >
            <Scaling className="w-3 h-3" />
          </div>
        </>
      )}
    </div>
  );
};
