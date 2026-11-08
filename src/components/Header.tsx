import React, { useRef } from 'react';
import { 
  Camera, 
  FolderOpen, 
  Download, 
  Printer, 
  RotateCcw, 
  RotateCw, 
  Languages, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import type { Language, PassportStandard } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeStandard: PassportStandard;
  onOpenImage: (file: File) => void;
  onOpenCameraCapture?: () => void;
  onLoadSample: () => void;
  onExportPNG: () => void;
  onExportJPEG: () => void;
  onOpenPrintModal: () => void;
  onOpenSaveAsModal: () => void;
  onResetAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenHelp: () => void;
  imageDimensions: { width: number; height: number } | null;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  activeStandard,
  onOpenImage,
  onOpenCameraCapture,
  onLoadSample,
  onExportPNG,
  onExportJPEG,
  onOpenPrintModal,
  onOpenSaveAsModal,
  onResetAll,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenHelp,
  imageDimensions,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenImage(e.target.files[0]);
    }
  };

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 px-3 flex items-center justify-between text-zinc-200 select-none z-30">
      {/* Brand, Logo & Undo/Redo Buttons (Replaced the standard badge area) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">
                Nadir<span className="text-cyan-400">PhotoLab</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-cyan-500/20">
                Studio Pro
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden md:block leading-tight">
              {language === 'ar' ? 'معالجة الصور البيومترية وجوازات السفر' : 'Biometric & Passport Studio'}
            </p>
          </div>
        </div>

        {/* Undo / Redo Buttons (Moved to the red circled position) */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shadow-sm">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer flex items-center gap-1 ${
              canUndo ? 'text-zinc-200 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title={`${t.undo} (Ctrl+Z)`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer flex items-center gap-1 ${
              canRedo ? 'text-zinc-200 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'
            }`}
            title={`${t.redo} (Ctrl+Y)`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
          className="hidden" 
          onChange={handleFileInputChange} 
        />
        
        {/* Open File Button (Placed in the green circled position) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition border border-zinc-700 cursor-pointer shadow-sm hover:border-cyan-500/50"
          title={language === 'ar' ? 'فتح ملف صورة من الكمبيوتر' : 'Open Image File'}
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'ar' ? 'فتح ملف' : 'Open File'}</span>
        </button>

        {/* Save As... Button (Placed in the green circled position) */}
        <button
          onClick={onOpenSaveAsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition shadow-md shadow-emerald-900/30 cursor-pointer"
          title={language === 'ar' ? 'حفظ الصورة المعدلة باسم وتحديد الصيغة' : 'Save As...'}
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>{language === 'ar' ? 'حفظ باسم...' : 'Save As...'}</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block"></div>

        {/* Camera Capture Button */}
        {onOpenCameraCapture && (
          <button
            onClick={onOpenCameraCapture}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition border border-zinc-700 cursor-pointer shadow-sm"
            title={t.cameraCapture}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{t.cameraCapture}</span>
          </button>
        )}

        {/* Load Sample Button */}
        <button
          onClick={onLoadSample}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition border border-zinc-800 cursor-pointer"
          title={t.samplePhoto}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{t.samplePhoto}</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block"></div>

        {/* Export Dropdown / Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onExportPNG}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition border border-zinc-700 cursor-pointer"
            title={t.exportPNG}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">PNG HD</span>
          </button>

          <button
            onClick={onExportJPEG}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 text-xs font-medium text-white transition border border-emerald-600 cursor-pointer shadow-sm shadow-emerald-900/30"
            title={t.exportJPEG}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DV JPG</span>
          </button>

          {/* Print Sheet Studio Button */}
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition shadow-sm shadow-blue-500/20 cursor-pointer"
            title={t.printDirect}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'طباعة مجمعة' : 'Print Grid'}</span>
          </button>
        </div>
      </div>

      {/* Language Switcher & Help */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-cyan-400 border border-zinc-800 transition cursor-pointer"
          title="Switch Language / تغيير اللغة"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{t.switchLanguage}</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          title={t.help}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
