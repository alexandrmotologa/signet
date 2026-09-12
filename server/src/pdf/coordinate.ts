export interface NormalizedBounds {
  normalizedX: number;
  normalizedY: number;
  normalizedWidth: number;
  normalizedHeight: number;
}

export interface PdfPointBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageDimensions {
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Converts normalized canvas coordinates (0.0 to 1.0, top-left origin)
 * into native PDF point bounds (72 DPI, bottom-left origin).
 */
export function normalizedToPdfPoints(
  bounds: NormalizedBounds,
  pageSize: PageDimensions
): PdfPointBounds {
  const { width: pageWidth, height: pageHeight, rotation = 0 } = pageSize;

  // Clamp normalized bounds within 0.0 and 1.0
  const normX = Math.max(0, Math.min(1, bounds.normalizedX));
  const normY = Math.max(0, Math.min(1, bounds.normalizedY));
  const normW = Math.max(0, Math.min(1 - normX, bounds.normalizedWidth));
  const normH = Math.max(0, Math.min(1 - normY, bounds.normalizedHeight));

  const rawWidth = normW * pageWidth;
  const rawHeight = normH * pageHeight;
  const rawX = normX * pageWidth;

  // Invert y-axis: browser canvas is top-left, PDF is bottom-left
  const rawY = pageHeight - (normY * pageHeight) - rawHeight;

  // Standard orientation
  if (rotation === 0 || rotation === 360) {
    return {
      x: rawX,
      y: Math.max(0, rawY),
      width: rawWidth,
      height: rawHeight
    };
  }

  // Handle 90, 180, 270 degree rotation if needed
  const normalizedAngle = ((rotation % 360) + 360) % 360;
  switch (normalizedAngle) {
    case 90:
      return {
        x: normY * pageWidth,
        y: normX * pageHeight,
        width: rawHeight,
        height: rawWidth
      };
    case 180:
      return {
        x: pageWidth - rawX - rawWidth,
        y: normY * pageHeight,
        width: rawWidth,
        height: rawHeight
      };
    case 270:
      return {
        x: pageWidth - (normY * pageWidth) - rawHeight,
        y: pageHeight - (normX * pageHeight) - rawWidth,
        width: rawHeight,
        height: rawWidth
      };
    default:
      return {
        x: rawX,
        y: Math.max(0, rawY),
        width: rawWidth,
        height: rawHeight
      };
  }
}
