import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, Clock, User, Hash, ArrowLeft } from 'lucide-react';

interface VerificationData {
  isVerified: boolean;
  filename?: string;
  originalSha256?: string;
  signedSha256?: string;
  pageCount?: number;
  placementsCount?: number;
  signer?: {
    telegramId?: number;
    name?: string;
    username?: string;
  };
  timestamp?: string;
  hasAuditCertificate?: boolean;
  error?: string;
}

interface VerificationViewProps {
  hash: string;
  onBackToApp: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({ hash, onBackToApp }) => {
  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${hash}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setData({ isVerified: false, error: err?.message || 'Could not contact verification server' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerification();
  }, [hash]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center p-4 sm:p-8">
      {/* Top Brand */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Signet</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">
            Signet Notary
          </span>
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Verifying cryptographic signatures and document hashes...
          </div>
        ) : data?.isVerified ? (
          <>
            {/* Verified Header Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  Document Authenticity Verified
                </h1>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Cryptographic SHA-256 checksums match the digital execution record.
                </p>
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Filename & Pages */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Document File</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {data.filename} ({data.pageCount} pages)
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Execution Timestamp</span>
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {data.timestamp ? new Date(data.timestamp).toUTCString() : 'N/A'}
                </span>
              </div>

              {/* Signer */}
              {data.signer && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Verified Signer</span>
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {data.signer.name || 'Telegram User'}
                    </span>
                    {data.signer.username && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400">
                        @{data.signer.username}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Original SHA-256 */}
              <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Original Document Digest (SHA-256)</span>
                </span>
                <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                  {data.originalSha256}
                </p>
              </div>

              {/* Signed SHA-256 */}
              <div className="py-2">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Signed Composite Digest (SHA-256)</span>
                </span>
                <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                  {data.signedSha256}
                </p>
              </div>

              {/* Audit Badge */}
              <div className="mt-4 p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300">
                This document was executed via Signet standalone infrastructure. Zero external signing services had access to document contents.
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Notarization Record Not Found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              The cryptographic hash provided does not match any active execution record in this Signet node. Ephemeral records expire after 60 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
