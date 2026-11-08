import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  FileImage, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import type { Language, PassportStandard } from '../types';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  photoCanvas: HTMLCanvasElement | null;
  activeStandard: PassportStandard;
}

type ExportFormat = 'png' | 'jpeg' | 'webp' | 'pdf';

export const SaveAsModal: React.FC<SaveAsModalProps> = ({
  isOpen,
  onClose,
  language,
  photoCanvas,
  activeStandard,
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [fileName, setFileName] = useState<string>('');
  const [quality, setQuality] = useState<number>(92); // 50 to 100 for JPEG/WebP
  const [resolutionMode, setResolutionMode] = useState<'standard' | 'original' | 'custom'>('standard');
  const [customWidth, setCustomWidth] = useState<number>(600);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [estimatedSizeKB, setEstimatedSizeKB] = useState<number>(0);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize file name when opened
  useEffect(() => {
    if (isOpen) {
      const dateStr = new Date().toISOString().split('T')[0];
      const cleanStd = activeStandard.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      setFileName(`NadirPhotoLab_${cleanStd}_${dateStr}`);

      if (activeStandard.id === 'us-dv-lottery-2x2') {
        setFormat('jpeg');
        setResolutionMode('standard');
      } else {
        setFormat('png');
        setResolutionMode('standard');
      }
    }
  }, [isOpen, activeStandard]);

  // Target output dimensions
  const getTargetDimensions = (): { w: number; h: number } => {
    if (!photoCanvas) return { w: 600, h: 600 };

    if (resolutionMode === 'original') {
      return { w: photoCanvas.width, h: photoCanvas.height };
    }

    if (resolutionMode === 'custom') {
      return { w: Math.max(50, customWidth), h: Math.max(50, customHeight) };
    }

    // Standard mode:
    if (activeStandard.id === 'us-dv-lottery-2x2') {
      return { w: 600, h: 600 };
    }

    // For mm standards, compute at 300 DPI
    if (activeStandard.widthMm && activeStandard.heightMm) {
      const mmTo300Dpi = (mm: number) => Math.round((mm / 25.4) * 300);
      return {
        w: mmTo300Dpi(activeStandard.widthMm),
        h: mmTo300Dpi(activeStandard.heightMm),
      };
    }

    return { w: photoCanvas.width, h: photoCanvas.height };
  };

  // Re-render thumbnail & compute estimated file size
  useEffect(() => {
    if (!isOpen || !photoCanvas) return;

    const { w, h } = getTargetDimensions();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Fill white background for JPEG
    if (format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(photoCanvas, 0, 0, w, h);

    // Update thumbnail canvas
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      previewCanvas.width = w;
      previewCanvas.height = h;
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(tempCanvas, 0, 0);
      }
    }

    // Estimate file size
    if (format === 'png') {
      const dataUri = tempCanvas.toDataURL('image/png');
      const kb = Math.round((dataUri.length * 3) / 4 / 1024);
      setEstimatedSizeKB(kb);
    } else if (format === 'jpeg') {
      const dataUri = tempCanvas.toDataURL('image/jpeg', quality / 100);
      const kb = Math.round((dataUri.length * 3) / 4 / 1024);
      setEstimatedSizeKB(kb);
    } else if (format === 'webp') {
      const dataUri = tempCanvas.toDataURL('image/webp', quality / 100);
      const kb = Math.round((dataUri.length * 3) / 4 / 1024);
      setEstimatedSizeKB(kb);
    } else if (format === 'pdf') {
      setEstimatedSizeKB(Math.round(w * h * 0.0003));
    }
  }, [isOpen, photoCanvas, format, quality, resolutionMode, customWidth, customHeight, activeStandard]);

  if (!isOpen || !photoCanvas) return null;

  const handleCustomWidthChange = (val: number) => {
    setCustomWidth(val);
    if (lockAspect && photoCanvas && photoCanvas.width > 0) {
      const ratio = photoCanvas.height / photoCanvas.width;
      setCustomHeight(Math.round(val * ratio));
    }
  };

  const handleCustomHeightChange = (val: number) => {
    setCustomHeight(val);
    if (lockAspect && photoCanvas && photoCanvas.height > 0) {
      const ratio = photoCanvas.width / photoCanvas.height;
      setCustomWidth(Math.round(val * ratio));
    }
  };

  const handleSaveFile = async () => {
    if (!photoCanvas) return;

    const { w, h } = getTargetDimensions();
    const finalName = (fileName.trim() || 'Photo_Export') + '.' + (format === 'jpeg' ? 'jpg' : format);

    if (format === 'pdf') {
      // PDF Export
      const pdf = new jsPDF({
        orientation: w >= h ? 'l' : 'p',
        unit: 'mm',
        format: activeStandard.widthMm && activeStandard.heightMm 
          ? [activeStandard.widthMm + 20, activeStandard.heightMm + 20]
          : [100, 100],
      });

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(photoCanvas, 0, 0, w, h);
        const imgData = tempCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 10, 10, activeStandard.widthMm || 50, activeStandard.heightMm || 50);
      }
      pdf.save(finalName);
      onClose();
      return;
    }

    // Raster Image Export (PNG / JPEG / WebP)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(photoCanvas, 0, 0, w, h);

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const qualityParam = format === 'png' ? undefined : quality / 100;

    // Try modern File System Access API if available (Save As file dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const pickerOptions: any = {
          suggestedName: finalName,
          types: [{
            description: `${format.toUpperCase()} Image`,
            accept: { [mimeType]: [`.${format === 'jpeg' ? 'jpg' : format}`] }
          }]
        };
        const handle = await (window as any).showSaveFilePicker(pickerOptions);
        const writable = await handle.createWritable();
        
        exportCanvas.toBlob(async (blob) => {
          if (blob) {
            await writable.write(blob);
            await writable.close();
            onClose();
          }
        }, mimeType, qualityParam);
        return;
      } catch (err: any) {
        // User aborted picker, fallback to normal download if not user abort
        if (err.name === 'AbortError') return;
      }
    }

    // Standard Browser Download fallback
    const dataUrl = exportCanvas.toDataURL(mimeType, qualityParam);
    const link = document.createElement('a');
    link.download = finalName;
    link.href = dataUrl;
    link.click();
    onClose();
  };

  const isDvLottery = activeStandard.id === 'us-dv-lottery-2x2';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {language === 'ar' ? 'حفظ الصورة باسم... (Save As)' : 'Save Photo As...'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {language === 'ar' ? 'تحديد صيغة الملف، الجودة، ودقة الحفظ' : 'Select export format, quality, and dimensions'}
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

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* File Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              {language === 'ar' ? 'اسم الملف المحفوظ:' : 'File Name:'}
            </label>
            <div className="flex rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden focus-within:border-cyan-500">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="NadirPhotoLab_Export"
                className="flex-1 px-3 py-2 bg-transparent text-xs text-white focus:outline-none font-mono"
              />
              <span className="px-3 py-2 bg-zinc-900 text-zinc-400 text-xs font-mono border-l rtl:border-l-0 rtl:border-r border-zinc-800">
                .{format === 'jpeg' ? 'jpg' : format}
              </span>
            </div>
          </div>

          {/* Format Selection Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              {language === 'ar' ? 'صيغة الحفظ:' : 'Export Format:'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'png', title: 'PNG (HD)', desc: language === 'ar' ? 'عالي الدقة غير مضغوط' : 'Lossless HD', icon: FileImage },
                { id: 'jpeg', title: 'JPG / JPEG', desc: language === 'ar' ? 'قياسي للاستوديوهات' : 'Standard Photo', icon: FileImage },
                { id: 'webp', title: 'WebP', desc: language === 'ar' ? 'حجم مضغوط فائق' : 'Modern Compact', icon: FileImage },
                { id: 'pdf', title: 'PDF', desc: language === 'ar' ? 'مستند طباعة جاهز' : 'Document Print', icon: FileText },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id as ExportFormat)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/20 text-white shadow-md shadow-emerald-950/30 font-bold'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="text-xs font-mono">{fmt.title}</span>
                    <span className="text-[10px] text-zinc-500 truncate w-full">{fmt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {(format === 'jpeg' || format === 'webp') && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'ar' ? 'جودة وضغط الصورة:' : 'Compression Quality:'}</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>{language === 'ar' ? 'حجم ملف أصغر' : 'Smaller File'}</span>
                <span>{language === 'ar' ? 'أعلى جودة ممكنة' : 'Maximum Quality'}</span>
              </div>
            </div>
          )}

          {/* Resolution / Dimensions Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              {language === 'ar' ? 'أبعاد ودقة الصورة:' : 'Output Dimensions:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setResolutionMode('standard')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                  resolutionMode === 'standard'
                    ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'ar' ? 'المعيار الرسمي (300DPI)' : 'Official Standard'}
              </button>

              <button
                onClick={() => setResolutionMode('original')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                  resolutionMode === 'original'
                    ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'ar' ? 'الدقة الأصلية للقص' : 'Current Crop Size'}
              </button>

              <button
                onClick={() => setResolutionMode('custom')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                  resolutionMode === 'custom'
                    ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'ar' ? 'مقاس مخصص (Custom)' : 'Custom Dimensions'}
              </button>
            </div>

            {/* Custom Dimensions Input */}
            {resolutionMode === 'custom' && (
              <div className="pt-2 flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-zinc-400 block">{language === 'ar' ? 'العرض (px)' : 'Width (px)'}</span>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => handleCustomWidthChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                  />
                </div>
                <div className="pt-4 text-zinc-500">×</div>
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-zinc-400 block">{language === 'ar' ? 'الارتفاع (px)' : 'Height (px)'}</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => handleCustomHeightChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                  />
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`px-2.5 py-1.5 rounded text-xs border cursor-pointer transition ${
                      lockAspect ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                    title={language === 'ar' ? 'قفل نسبة الأبعاد' : 'Lock Aspect Ratio'}
                  >
                    🔒 {lockAspect ? (language === 'ar' ? 'مقفل' : 'Locked') : (language === 'ar' ? 'حر' : 'Free')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Export Preview & Stats Bar */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-700/60 overflow-hidden flex items-center justify-center shrink-0">
                <canvas ref={previewCanvasRef} className="w-full h-full object-contain" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-white">
                  {getTargetDimensions().w} × {getTargetDimensions().h} px
                </div>
                <div className="text-[11px] text-zinc-400">
                  {language === 'ar' ? 'الحجم التقديري:' : 'Estimated Size:'}{' '}
                  <span className="font-mono text-emerald-400 font-bold">~{estimatedSizeKB} KB</span>
                </div>
                {isDvLottery && (
                  <div className="flex items-center gap-1 text-[10px]">
                    {estimatedSizeKB <= 240 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {language === 'ar' ? 'متوافق مع اللوتري (≤ 240 KB)' : 'DV Lottery Compliant (≤ 240 KB)'}
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {language === 'ar' ? 'تجاوز 240 KB، يرجى خفض الجودة قليلاً' : 'Exceeds 240 KB, lower quality'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 font-mono text-[11px] border border-zinc-800">
                {format.toUpperCase()}
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="h-16 border-t border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            onClick={handleSaveFile}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ الصورة الآن' : 'Save Image Now'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
