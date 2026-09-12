import React, { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram.js';
import { usePdfEngine } from './hooks/usePdfEngine.js';
import { TopBar } from './components/TopBar.js';
import { PdfViewer } from './components/PdfViewer.js';
import { ActionDock } from './components/ActionDock.js';
import { SignaturePadModal } from './components/SignaturePadModal.js';
import { ThumbnailsDrawer } from './components/ThumbnailsDrawer.js';
import { TextBadgeModal } from './components/TextBadgeModal.js';
import { CompanyStampModal } from './components/CompanyStampModal.js';
import { SignatureVaultModal } from './components/SignatureVaultModal.js';
import { VerificationView } from './components/VerificationView.js';
import { MockTelegramContainer } from './components/MockTelegramContainer.js';
import type { PlacementState } from './components/DraggableItem.js';
import { CheckCircle2, AlertCircle, Users } from 'lucide-react';

interface DocumentMeta {
  docId: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  sha256: string;
}

interface MultiPartySessionInfo {
  sessionId: string;
  status: string;
  signers: { name: string; username?: string; status: string }[];
}

export const App: React.FC = () => {
  // Check if current URL is a verification link (/verify/:hash)
  const pathname = window.location.pathname;
  const isVerifyRoute = pathname.startsWith('/verify/');
  const verifyHash = isVerifyRoute ? pathname.replace(/^\/verify\//, '') : '';

  if (isVerifyRoute && verifyHash) {
    return (
      <VerificationView
        hash={verifyHash}
        onBackToApp={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  const {
    isTelegramEnv,
    user,
    initData,
    colorScheme,
    setColorScheme,
    triggerHaptic,
    closeApp
  } = useTelegram();

  // Document and session state
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [currentSampleId, setCurrentSampleId] = useState<string>('nda');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<MultiPartySessionInfo | null>(null);
  const [docMeta, setDocMeta] = useState<DocumentMeta | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Placements and UI State
  const [placements, setPlacements] = useState<PlacementState[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.2);

  // Modals & Drawers
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isInitialsModalOpen, setIsInitialsModalOpen] = useState(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const [includeAudit, setIncludeAudit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dark Mode detection
  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setColorScheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // PDF Engine Hook
  const {
    isLoading,
    pageCount,
    currentPageIndex,
    error: pdfError,
    canvasRef,
    renderPage,
    goToPage,
    nextPage,
    prevPage
  } = usePdfEngine(pdfUrl);

  // Rerender page on index or zoom change
  useEffect(() => {
    if (pdfUrl && pageCount > 0) {
      renderPage(currentPageIndex, zoom);
    }
  }, [pdfUrl, pageCount, currentPageIndex, zoom, renderPage]);

  // Load document based on URL params or default sample
  const loadDocumentSession = useCallback(async (docIdParam: string | null, sampleParam: string | null, sessIdParam: string | null) => {
    try {
      if (sessIdParam) {
        setSessionId(sessIdParam);
        const sessRes = await fetch(`/api/sessions/${sessIdParam}`);
        if (sessRes.ok) {
          const sessData: MultiPartySessionInfo & { currentDocId: string; filename: string } = await sessRes.json();
          setSessionInfo(sessData);
          docIdParam = sessData.currentDocId;
        }
      }

      if (docIdParam) {
        const metaRes = await fetch(`/api/document/${docIdParam}/meta`);
        if (metaRes.ok) {
          const meta: DocumentMeta = await metaRes.json();
          setDocMeta(meta);
          setActiveDocId(meta.docId);
          setPdfUrl(`/api/document/${meta.docId}`);
          return;
        }
      }

      // Default to sample document
      const sample = sampleParam || 'nda';
      setCurrentSampleId(sample);
      const sampleRes = await fetch(`/api/samples/${sample}`);
      if (!sampleRes.ok) {
        throw new Error('Failed to load sample document');
      }

      const sampleMeta: DocumentMeta = await sampleRes.json();
      setDocMeta(sampleMeta);
      setActiveDocId(sampleMeta.docId);
      setPdfUrl(`/api/document/${sampleMeta.docId}`);
    } catch (err: any) {
      console.error('Failed to initialize document:', err);
      setToastMessage({ type: 'error', text: 'Could not load document.' });
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('docId');
    const sample = params.get('sample');
    const sessId = params.get('sessionId');
    loadDocumentSession(docId, sample, sessId);
  }, [loadDocumentSession]);

  // Toast notification auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Add signature / initials
  const handleSaveSignature = (pngDataUrl: string, type: 'signature' | 'initials') => {
    triggerHaptic('success');
    const newItem: PlacementState = {
      id: crypto.randomUUID(),
      pageIndex: currentPageIndex,
      normalizedX: 0.35,
      normalizedY: 0.65,
      normalizedWidth: type === 'initials' ? 0.15 : 0.28,
      normalizedHeight: type === 'initials' ? 0.06 : 0.08,
      type,
      data: pngDataUrl
    };

    setPlacements((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Add Checkmark (✓)
  const handleAddCheckmark = () => {
    triggerHaptic('light');
    const newItem: PlacementState = {
      id: crypto.randomUUID(),
      pageIndex: currentPageIndex,
      normalizedX: 0.45,
      normalizedY: 0.5,
      normalizedWidth: 0.05,
      normalizedHeight: 0.035,
      type: 'checkmark'
    };
    setPlacements((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Add Crossmark (✗)
  const handleAddCrossmark = () => {
    triggerHaptic('light');
    const newItem: PlacementState = {
      id: crypto.randomUUID(),
      pageIndex: currentPageIndex,
      normalizedX: 0.45,
      normalizedY: 0.5,
      normalizedWidth: 0.05,
      normalizedHeight: 0.035,
      type: 'crossmark'
    };
    setPlacements((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Add date stamp
  const handleAddDate = () => {
    triggerHaptic('light');
    const today = new Date().toISOString().split('T')[0];
    const newItem: PlacementState = {
      id: crypto.randomUUID(),
      pageIndex: currentPageIndex,
      normalizedX: 0.38,
      normalizedY: 0.76,
      normalizedWidth: 0.22,
      normalizedHeight: 0.04,
      type: 'date',
      text: today
    };

    setPlacements((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Add custom text badge
  const handleAddTextBadge = (text: string, fontSize: number) => {
    triggerHaptic('light');
    const newItem: PlacementState = {
      id: crypto.randomUUID(),
      pageIndex: currentPageIndex,
      normalizedX: 0.35,
      normalizedY: 0.55,
      normalizedWidth: 0.3,
      normalizedHeight: 0.045,
      type: 'text',
      text,
      fontSize
    };
    setPlacements((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Add company seal / stamp
  const handleAddCompanyStamp = (pngDataUrl: string) => {
    triggerHaptic('success');
    const newItem: PlacementState = {
      id: crypto.randomUUID(),
      pageIndex: currentPageIndex,
      normalizedX: 0.15,
      normalizedY: 0.65,
      normalizedWidth: 0.2,
      normalizedHeight: 0.14,
      type: 'stamp',
      data: pngDataUrl
    };
    setPlacements((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Insert from vault
  const handleInsertFromVault = (data: string, type: 'signature' | 'initials' | 'stamp') => {
    triggerHaptic('success');
    const newItem: PlacementState = {
      id: crypto.randomUUID(),
      pageIndex: currentPageIndex,
      normalizedX: 0.35,
      normalizedY: 0.65,
      normalizedWidth: type === 'initials' ? 0.15 : type === 'stamp' ? 0.2 : 0.28,
      normalizedHeight: type === 'initials' ? 0.06 : type === 'stamp' ? 0.14 : 0.08,
      type,
      data
    };
    setPlacements((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Update placement
  const handleUpdatePlacement = (id: string, updated: Partial<PlacementState>) => {
    setPlacements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  // Delete placement
  const handleDeletePlacement = (id: string) => {
    triggerHaptic('medium');
    setPlacements((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  // Upload Custom PDF
  const handleUploadCustomPdf = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const meta: DocumentMeta = await res.json();
      setDocMeta(meta);
      setActiveDocId(meta.docId);
      setPdfUrl(`/api/document/${meta.docId}`);
      setPlacements([]);
      triggerHaptic('success');
      setToastMessage({ type: 'success', text: `Uploaded ${meta.filename}` });
    } catch (err) {
      console.error(err);
      triggerHaptic('error');
      setToastMessage({ type: 'error', text: 'Failed to upload PDF.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Complete and Sign
  const handleCompleteAndSign = async (forceDownload = false) => {
    if (!activeDocId || placements.length === 0) return;

    setIsSaving(true);
    triggerHaptic('medium');

    try {
      // 1. Send sign request
      const signRes = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: activeDocId,
          placements,
          includeAuditCertificate: includeAudit,
          initData,
          signer: user
            ? {
                telegramId: user.id,
                name: `${user.first_name} ${user.last_name || ''}`.trim(),
                username: user.username
              }
            : undefined
        })
      });

      if (!signRes.ok) {
        throw new Error('Failed to stamp document');
      }

      const signData = await signRes.json();
      const signedDocId = signData.signedDocId;
      const downloadPath = `/api/document/${signedDocId}`;

      // 2. If multi-party session, advance it
      if (sessionId) {
        await fetch(`/api/sessions/${sessionId}/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedDocId,
            signerIdentifier: user?.username || user?.id || 'Signer'
          })
        }).catch(() => {});
      }

      // 3. Dispatch to Telegram Chat or Direct Browser Download
      if (isTelegramEnv && user?.id && !forceDownload) {
        const exportRes = await fetch('/api/export-to-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedDocId,
            chatId: user.id,
            caption: `Completed and signed ${signData.filename}`
          })
        });

        if (exportRes.ok) {
          triggerHaptic('success');
          setToastMessage({
            type: 'success',
            text: 'Signed document sent to your Telegram chat!'
          });
          setTimeout(() => {
            closeApp();
          }, 2000);
          return;
        }
      }

      // Browser direct download fallback or force download
      const link = document.createElement('a');
      link.href = downloadPath;
      link.download = signData.filename || 'signed_document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerHaptic('success');
      setToastMessage({
        type: 'success',
        text: 'Document signed and downloaded successfully!'
      });
    } catch (err: any) {
      console.error(err);
      triggerHaptic('error');
      setToastMessage({
        type: 'error',
        text: err?.message || 'Failed to complete signing process.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Dev Mode Banner (outside Telegram) */}
      {!isTelegramEnv && (
        <MockTelegramContainer
          currentSampleId={currentSampleId}
          onSelectSample={(id) => {
            loadDocumentSession(null, id, null);
            setPlacements([]);
          }}
          onUploadCustomPdf={handleUploadCustomPdf}
          isUploading={isUploading}
        />
      )}

      {/* Collaborative Session Banner */}
      {sessionInfo && (
        <div className="bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-900 px-3 py-1.5 text-xs flex items-center justify-between text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>Co-Signing Session:</span>
            {sessionInfo.signers.map((s, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  s.status === 'signed'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}
              >
                {s.name} ({s.status})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Header */}
      <TopBar
        filename={docMeta?.filename || 'document.pdf'}
        currentPage={currentPageIndex}
        pageCount={pageCount}
        zoom={zoom}
        isDark={isDark}
        onPrevPage={prevPage}
        onNextPage={nextPage}
        onZoomIn={() => setZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
        onZoomOut={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
        onToggleTheme={toggleTheme}
      />

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium shadow-lg backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <main className="flex-1 flex flex-col items-center justify-start overflow-hidden relative">
        <PdfViewer
          canvasRef={canvasRef}
          isLoading={isLoading}
          error={pdfError}
          currentPageIndex={currentPageIndex}
          placements={placements}
          selectedItemId={selectedItemId}
          onSelectPlacement={setSelectedItemId}
          onUpdatePlacement={handleUpdatePlacement}
          onDeletePlacement={handleDeletePlacement}
          onPinchZoom={(delta) => setZoom((z) => Math.max(0.8, Math.min(2.5, +(z + delta).toFixed(1))))}
        />
      </main>

      {/* Floating Action Dock */}
      <ActionDock
        onAddSignature={() => setIsSignatureModalOpen(true)}
        onAddDate={handleAddDate}
        onAddInitials={() => setIsInitialsModalOpen(true)}
        onAddCheckmark={handleAddCheckmark}
        onAddCrossmark={handleAddCrossmark}
        onOpenTextModal={() => setIsTextModalOpen(true)}
        onOpenStampModal={() => setIsStampModalOpen(true)}
        onOpenThumbnails={() => setIsThumbnailsOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        includeAudit={includeAudit}
        onToggleAudit={() => {
          triggerHaptic('light');
          setIncludeAudit((v) => !v);
        }}
        onCompleteAndSend={() => handleCompleteAndSign(false)}
        onDirectDownload={() => handleCompleteAndSign(true)}
        isSaving={isSaving}
        placementsCount={placements.length}
        isTelegramEnv={isTelegramEnv}
      />

      {/* Modals & Drawers */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(data) => handleSaveSignature(data, 'signature')}
        title="Add Signature"
        isInitialsMode={false}
      />

      <SignaturePadModal
        isOpen={isInitialsModalOpen}
        onClose={() => setIsInitialsModalOpen(false)}
        onSave={(data) => handleSaveSignature(data, 'initials')}
        title="Add Initials"
        isInitialsMode={true}
      />

      <ThumbnailsDrawer
        isOpen={isThumbnailsOpen}
        onClose={() => setIsThumbnailsOpen(false)}
        pageCount={pageCount}
        currentPageIndex={currentPageIndex}
        placements={placements}
        onSelectPage={goToPage}
      />

      <TextBadgeModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onApplyText={handleAddTextBadge}
      />

      <CompanyStampModal
        isOpen={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        onApplyStamp={handleAddCompanyStamp}
      />

      <SignatureVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onInsertItem={handleInsertFromVault}
      />
    </div>
  );
};
