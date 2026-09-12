import React, { useState, useRef, useEffect } from 'react';
import { X, Award, Upload, Check } from 'lucide-react';

interface CompanyStampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStamp: (pngDataUrl: string) => void;
}

const SEAL_COLORS = [
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Crimson', hex: '#991b1b' },
  { name: 'Emerald', hex: '#065f46' },
  { name: 'Charcoal', hex: '#0f172a' }
];

export const CompanyStampModal: React.FC<CompanyStampModalProps> = ({
  isOpen,
  onClose,
  onApplyStamp
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate');
  const [companyName, setCompanyName] = useState('ACME TECHNOLOGIES');
  const [subtitle, setSubtitle] = useState('OFFICIAL SEAL');
  const [yearText, setYearText] = useState('2026');
  const [selectedColor, setSelectedColor] = useState(SEAL_COLORS[0].hex);
  const [uploadedPng, setUploadedPng] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Draw procedural circular company seal
  useEffect(() => {
    if (!isOpen || activeTab !== 'generate') return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    const radius = size * 0.44;

    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;

    // Outer double circle
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center, center, radius - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Center content
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VERIFIED', center, center - 15);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`★ ${yearText} ★`, center, center + 15);

    // Draw curved text around top
    const drawCurvedText = (text: string, startAngle: number, endAngle: number, r: number) => {
      ctx.save();
      ctx.translate(center, center);
      ctx.font = 'bold 15px Inter, sans-serif';
      const angleRange = endAngle - startAngle;
      const step = text.length > 1 ? angleRange / (text.length - 1) : 0;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const angle = startAngle + i * step;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -r);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    };

    // Upper text
    drawCurvedText(companyName.toUpperCase(), -Math.PI * 0.35, Math.PI * 0.35, radius - 20);

    // Lower text
    drawCurvedText(subtitle.toUpperCase(), Math.PI * 0.7, Math.PI * 1.3, radius - 20);
  }, [isOpen, activeTab, companyName, subtitle, yearText, selectedColor]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedPng(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    let finalPng = '';
    if (activeTab === 'generate') {
      const canvas = previewCanvasRef.current;
      if (canvas) {
        finalPng = canvas.toDataURL('image/png');
      }
    } else {
      if (!uploadedPng) {
        alert('Please choose an image file first.');
        return;
      }
      finalPng = uploadedPng;
    }

    if (finalPng) {
      localStorage.setItem('signet_seal', finalPng);
      onApplyStamp(finalPng);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Company Stamp & Official Seal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1 gap-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'generate'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Generate Circular Seal
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Upload Custom Stamp (PNG)
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
          {/* Live Preview / Canvas */}
          <div className="w-44 h-44 shrink-0 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden p-2">
            {activeTab === 'generate' ? (
              <canvas ref={previewCanvasRef} className="w-full h-full object-contain" />
            ) : uploadedPng ? (
              <img src={uploadedPng} alt="Stamp" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center p-2 text-slate-400 text-xs">No stamp uploaded</div>
            )}
          </div>

          {/* Form Controls */}
          <div className="flex-1 w-full flex flex-col gap-2.5">
            {activeTab === 'generate' ? (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    Subtitle / Verification
                  </label>
                  <input
                    type="text"
                    maxLength={25}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Ink Color:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {SEAL_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-5 h-5 rounded-full border transition ${
                          selectedColor === c.hex ? 'scale-110 ring-2 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-medium text-slate-600 dark:text-slate-300 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Transparent Stamp File</span>
                </button>
                <p className="text-[10px] text-slate-400">
                  PNG with transparent background is recommended for clean document stamping.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply Stamp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
