import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to reliable CDN or bundled worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface PdfEngineState {
  isLoading: boolean;
  pageCount: number;
  currentPageIndex: number;
  error: string | null;
  pageWidth: number;
  pageHeight: number;
}

export function usePdfEngine(pdfUrl: string | null) {
  const [state, setState] = useState<PdfEngineState>({
    isLoading: false,
    pageCount: 0,
    currentPageIndex: 0,
    error: null,
    pageWidth: 595.28,
    pageHeight: 841.89
  });

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document
  useEffect(() => {
    if (!pdfUrl) {
      pdfDocRef.current = null;
      setState((prev) => ({ ...prev, pageCount: 0, currentPageIndex: 0 }));
      return;
    }

    let isMounted = true;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const loadDoc = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = doc;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          pageCount: doc.numPages,
          currentPageIndex: 0
        }));
      } catch (err: any) {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err?.message || 'Failed to load PDF document'
        }));
      }
    };

    loadDoc();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
    };
  }, [pdfUrl]);

  // Render current page to canvas
  const renderPage = useCallback(
    async (pageIndex: number, scale = 1.5) => {
      const doc = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas || pageIndex < 0 || pageIndex >= doc.numPages) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await doc.getPage(pageIndex + 1); // pdfjs is 1-indexed
        const viewport = page.getViewport({ scale });

        // Match canvas physical resolution with DPR for razor-sharp text
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        // Native PDF dimensions at scale 1.0
        const nativeViewport = page.getViewport({ scale: 1.0 });
        setState((prev) => ({
          ...prev,
          pageWidth: nativeViewport.width,
          pageHeight: nativeViewport.height
        }));
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('[PdfEngine] Render error:', err);
        }
      }
    },
    []
  );

  const goToPage = useCallback((index: number) => {
    setState((prev) => {
      const target = Math.max(0, Math.min(index, prev.pageCount - 1));
      return { ...prev, currentPageIndex: target };
    });
  }, []);

  const nextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPageIndex: Math.min(prev.currentPageIndex + 1, prev.pageCount - 1)
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPageIndex: Math.max(prev.currentPageIndex - 1, 0)
    }));
  }, []);

  return {
    ...state,
    canvasRef,
    renderPage,
    goToPage,
    nextPage,
    prevPage
  };
}
