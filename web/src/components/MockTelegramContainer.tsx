import React from 'react';
import { Bot, UploadCloud, FileCheck2, ExternalLink } from 'lucide-react';

interface MockTelegramContainerProps {
  currentSampleId: string;
  onSelectSample: (sampleId: string) => void;
  onUploadCustomPdf: (file: File) => void;
  isUploading: boolean;
}

export const MockTelegramContainer: React.FC<MockTelegramContainerProps> = ({
  currentSampleId,
  onSelectSample,
  onUploadCustomPdf,
  isUploading
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onUploadCustomPdf(file);
    } else if (file) {
      alert('Please select a valid PDF file.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-3 py-2 text-xs border-b border-blue-800 shadow-sm">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-300">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-blue-100">Telegram Dev Mode</span>
            <span className="text-blue-300 ml-1.5 hidden sm:inline">
              Simulating active session for @alex_dev
            </span>
          </div>
        </div>

        {/* Sample Switcher & Upload */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onSelectSample('nda')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              currentSampleId === 'nda'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'bg-blue-800/60 hover:bg-blue-800 text-blue-200'
            }`}
          >
            Sample NDA
          </button>

          <button
            onClick={() => onSelectSample('consulting')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              currentSampleId === 'consulting'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'bg-blue-800/60 hover:bg-blue-800 text-blue-200'
            }`}
          >
            Sample Consulting
          </button>

          {/* Upload Custom PDF */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition active:scale-95 disabled:opacity-50"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
