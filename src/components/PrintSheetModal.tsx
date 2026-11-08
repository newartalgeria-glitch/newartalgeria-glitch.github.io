import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText
} from 'lucide-react';
import type { Language, PassportStandard, PrintSettings } from '../types';
import { translations } from '../i18n/translations';
import { PAPER_SIZES } from '../constants/standards';
import { renderPrintSheetCanvas, generatePrintPDF } from '../utils/printSheetGenerator';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  photoCanvas: HTMLCanvasElement | null;
  activeStandard: PassportStandard;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  language,
  photoCanvas,
  activeStandard,
}) => {
  const t = translations[language];
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<PrintSettings>({
    paperSizeId: '4x6-inches', // 10x15cm default photo studio size
    gridCount: 6, // 6 photos default for 35x45 on 4x6
    orientation: 'landscape',
    showCutLines: true,
    cutLineStyle: 'dashed',
    cutLineColor: '#94a3b8',
    photoBorder: true,
    borderColor: '#e2e8f0',
    borderWidthMm: 0.3,
    spacingMm: 3,
    marginMm: 5,
    showStudioInfo: true,
    studioInfoText: 'NadirPhotoLab • Passport Biometric Studio',
  });

  // Re-render sheet preview when settings change
  useEffect(() => {
    if (!isOpen || !photoCanvas || !previewCanvasRef.current) return;

    // Fast preview render (150 DPI for snappy UI preview)
    const sheet = renderPrintSheetCanvas({
      photoCanvas,
      photoWidthMm: activeStandard.widthMm,
      photoHeightMm: activeStandard.heightMm,
      settings,
      dpi: 150,
    });

    const displayCanvas = previewCanvasRef.current;
    displayCanvas.width = sheet.width;
    displayCanvas.height = sheet.height;
    const ctx = displayCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(sheet, 0, 0);
    }
  }, [isOpen, photoCanvas, activeStandard, settings]);

  if (!isOpen || !photoCanvas) return null;

  // Download 300 DPI High-Res Image
  const handleDownloadPNG = () => {
    const fullResSheet = renderPrintSheetCanvas({
      photoCanvas,
      photoWidthMm: activeStandard.widthMm,
      photoHeightMm: activeStandard.heightMm,
      settings,
      dpi: 300,
    });

    const link = document.createElement('a');
    link.download = `NadirPhotoLab_GridSheet_${activeStandard.id}_300DPI.png`;
    link.href = fullResSheet.toDataURL('image/png');
    link.click();
  };

  // Download Print-Ready PDF
  const handleDownloadPDF = () => {
    const pdf = generatePrintPDF({
      photoCanvas,
      photoWidthMm: activeStandard.widthMm,
      photoHeightMm: activeStandard.heightMm,
      settings,
    });

    pdf.save(`NadirPhotoLab_PrintSheet_${activeStandard.id}.pdf`);
  };

  // Direct Browser Print
  const handleDirectPrint = () => {
    const fullResSheet = renderPrintSheetCanvas({
      photoCanvas,
      photoWidthMm: activeStandard.widthMm,
      photoHeightMm: activeStandard.heightMm,
      settings,
      dpi: 300,
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const imgData = fullResSheet.toDataURL('image/png');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print - NadirPhotoLab</title>
          <style>
            @page {
              margin: 0;
              size: ${settings.orientation};
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.printTitle}</h2>
              <p className="text-[11px] text-zinc-400">
                {language === 'ar' ? 'معاينة ورقة الطباعة قبل التصدير' : 'Live Print Sheet Layout Preview'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Live Sheet Preview (Single crisp sheet, full margins visible, no ghost duplicate) */}
          <div className="flex-1 bg-zinc-950 p-8 md:p-10 flex items-center justify-center overflow-auto checkerboard-pattern">
            <canvas
              ref={previewCanvasRef}
              className="max-h-[50vh] md:max-h-[52vh] max-w-full object-contain block shadow-[0_12px_45px_rgba(0,0,0,0.85)] rounded-sm border border-zinc-700/60 ring-1 ring-white/10"
            />
          </div>

          {/* Right Side: Print Settings Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l rtl:md:border-l-0 rtl:md:border-r border-zinc-800 bg-zinc-900 p-4 space-y-4 overflow-y-auto">
            
            {/* Paper Size */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">{t.paperSize}</label>
              <select
                value={settings.paperSizeId}
                onChange={(e) => setSettings({ ...settings, paperSizeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {PAPER_SIZES.map((paper) => (
                  <option key={paper.id} value={paper.id}>
                    {language === 'ar' ? paper.nameAr : paper.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid Count (Max 8 photos) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">{t.photosCount}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 4, 6, 8].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setSettings({ ...settings, gridCount: cnt })}
                    className={`py-1.5 rounded border text-xs font-medium cursor-pointer transition ${
                      settings.gridCount === cnt
                        ? 'bg-blue-600 border-blue-500 text-white font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Orientation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">{t.orientation}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
                  className={`py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                    settings.orientation === 'landscape'
                      ? 'border-blue-500 bg-blue-950/20 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.landscape}
                </button>
                <button
                  onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
                  className={`py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                    settings.orientation === 'portrait'
                      ? 'border-blue-500 bg-blue-950/20 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.portrait}
                </button>
              </div>
            </div>

            {/* Cut Lines & Marks */}
            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-medium">{t.showCutLines}</span>
                <input
                  type="checkbox"
                  checked={settings.showCutLines}
                  onChange={(e) => setSettings({ ...settings, showCutLines: e.target.checked })}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>

              {settings.showCutLines && (
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <button
                    onClick={() => setSettings({ ...settings, cutLineStyle: 'dashed' })}
                    className={`py-1 px-1.5 rounded border text-[11px] cursor-pointer transition ${
                      settings.cutLineStyle === 'dashed'
                        ? 'border-blue-500 bg-blue-950/20 text-white font-semibold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {t.cutLineDashed}
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, cutLineStyle: 'solid' })}
                    className={`py-1 px-1.5 rounded border text-[11px] cursor-pointer transition ${
                      settings.cutLineStyle === 'solid'
                        ? 'border-blue-500 bg-blue-950/20 text-white font-semibold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {t.cutLineSolid}
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, cutLineStyle: 'crop-marks' })}
                    className={`py-1 px-1.5 rounded border text-[11px] cursor-pointer transition ${
                      settings.cutLineStyle === 'crop-marks'
                        ? 'border-blue-500 bg-blue-950/20 text-white font-semibold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {t.cutLineMarks}
                  </button>
                </div>
              )}
            </div>

            {/* Spacing & Margins */}
            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-medium">{t.spacing}</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {settings.spacingMm <= 0.05
                    ? (language === 'ar' ? '0 مم (ملتصقة تماماً)' : '0 mm (Seamless / Touching)')
                    : `${settings.spacingMm.toFixed(1)} mm`}
                </span>
              </div>

              {/* Quick Spacing Presets (Including 0 mm and < 1 mm) */}
              <div className="grid grid-cols-5 gap-1 pt-0.5">
                {[
                  { val: 0, label: language === 'ar' ? '0 ملتصقة' : '0 mm' },
                  { val: 0.5, label: '0.5' },
                  { val: 1, label: '1.0' },
                  { val: 2, label: '2.0' },
                  { val: 3, label: '3.0' },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setSettings({ ...settings, spacingMm: item.val })}
                    className={`py-1 rounded border text-[10px] font-mono font-medium cursor-pointer transition ${
                      Math.abs(settings.spacingMm - item.val) < 0.05
                        ? 'bg-cyan-600 border-cyan-500 text-white font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={settings.spacingMm}
                onChange={(e) => setSettings({ ...settings, spacingMm: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="flex justify-between text-xs pt-1">
                <span className="text-zinc-300">{t.margins}</span>
                <span className="font-mono text-cyan-400">{settings.marginMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.marginMm}
                onChange={(e) => setSettings({ ...settings, marginMm: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Studio Margin Text */}
            <div className="space-y-1.5 border-t border-zinc-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">{t.studioWatermarkOnSheet}</span>
                <input
                  type="checkbox"
                  checked={settings.showStudioInfo}
                  onChange={(e) => setSettings({ ...settings, showStudioInfo: e.target.checked })}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>
              {settings.showStudioInfo && (
                <input
                  type="text"
                  value={settings.studioInfoText}
                  onChange={(e) => setSettings({ ...settings, studioInfoText: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="h-16 border-t border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <span className="text-xs text-zinc-400 hidden sm:block">
            {t.readyToPrint} • 300 DPI
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPNG}
              className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>PNG (300 DPI)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>PDF (jsPDF)</span>
            </button>

            <button
              onClick={handleDirectPrint}
              className="py-2 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.printNow}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
