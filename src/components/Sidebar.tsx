import React, { useRef, useState } from 'react';
import { 
  Crop, 
  CheckCircle2, 
  Sparkles, 
  Shirt, 
  Sliders, 
  Type, 
  Printer, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Upload,
  Info,
  Trash2,
  RotateCw,
  Palette
} from 'lucide-react';
import type { 
  Language, 
  PassportStandard, 
  CropRect, 
  ImageAdjustments, 
  ChromaKeySettings, 
  BackgroundSettings, 
  SuitLayerState, 
  TextOverlaySettings, 
  DVLotteryValidation,
  SuitTemplate,
  LayerTransform,
  ActiveLayerType
} from '../types';
import { translations } from '../i18n/translations';
import { PASSPORT_STANDARDS, QUICK_COUNTRY_PRESETS, type QuickCountryPreset } from '../constants/standards';
import { SUIT_TEMPLATES } from '../assets/suits';
import { BACKGROUND_PRESETS } from '../assets/presets';
import { ARABIC_FONTS, LATIN_FONTS, STUDIO_SWATCH_PALETTE } from '../constants/textAssets';

interface SidebarProps {
  language: Language;
  activeStandard: PassportStandard;
  onSelectStandard: (standard: PassportStandard) => void;
  onQuickApplyCountry?: (preset: QuickCountryPreset) => void;
  cropRect: CropRect;
  onCropChange: (crop: CropRect) => void;
  onResetCrop: () => void;
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (adj: ImageAdjustments) => void;
  onResetAdjustments: () => void;
  chromaKey: ChromaKeySettings;
  onChromaKeyChange: (chroma: ChromaKeySettings) => void;
  background: BackgroundSettings;
  onBackgroundChange: (bg: BackgroundSettings) => void;
  suit: SuitLayerState;
  onSuitChange: (suit: SuitLayerState) => void;
  customSuits?: SuitTemplate[];
  onUploadCustomSuit?: (suitTpl: SuitTemplate) => void;
  textOverlay: TextOverlaySettings;
  onTextOverlayChange: (text: TextOverlaySettings) => void;
  dvValidation: DVLotteryValidation | null;
  onAutoFixDV: () => void;
  onOpenPrintModal: () => void;
  imageDimensions: { width: number; height: number } | null;
  bgTransform?: LayerTransform;
  onBgTransformChange?: (trans: LayerTransform) => void;
  activeLayer?: ActiveLayerType;
  onActiveLayerChange?: (layer: ActiveLayerType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  language,
  activeStandard,
  onSelectStandard,
  onQuickApplyCountry,
  cropRect,
  onResetCrop,
  adjustments,
  onAdjustmentsChange,
  onResetAdjustments,
  chromaKey,
  onChromaKeyChange,
  background,
  onBackgroundChange,
  suit,
  onSuitChange,
  customSuits = [],
  onUploadCustomSuit,
  textOverlay,
  onTextOverlayChange,
  dvValidation,
  onAutoFixDV,
  onOpenPrintModal,
  bgTransform = { x: 0, y: 0, scale: 1.0, rotation: 0 },
  onBgTransformChange,
  activeLayer = 'none',
  onActiveLayerChange,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'standards' | 'dv' | 'chroma' | 'suits' | 'adjust' | 'text' | 'print'>('standards');
  const [fontCategory, setFontCategory] = useState<'arabic' | 'latin'>('arabic');
  const customSuitInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'standards', icon: Crop, label: t.tabStandards },
    { id: 'dv', icon: CheckCircle2, label: t.tabDVLottery, badge: dvValidation?.overallPass ? '100%' : 'DV' },
    { id: 'chroma', icon: Sparkles, label: t.tabChromaKey },
    { id: 'suits', icon: Shirt, label: t.tabSuits },
    { id: 'adjust', icon: Sliders, label: t.tabAdjustments },
    { id: 'text', icon: Type, label: t.tabText },
    { id: 'print', icon: Printer, label: t.tabPrintSheet },
  ];

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onBackgroundChange({
            ...background,
            type: 'custom',
            customImageDataUri: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCustomSuitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadCustomSuit) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newSuit: SuitTemplate = {
            id: `custom-suit-${Date.now()}`,
            nameEn: file.name.replace(/\.[^/.]+$/, ''),
            nameAr: file.name.replace(/\.[^/.]+$/, ''),
            category: 'men-suit',
            svgDataUri: event.target.result as string,
            aspectRatio: 600 / 500,
          };
          onUploadCustomSuit(newSuit);
          onSuitChange({
            ...suit,
            enabled: true,
            templateId: newSuit.id,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const allSuits = [...SUIT_TEMPLATES, ...customSuits];

  return (
    <aside className="w-80 md:w-96 bg-zinc-900 border-l rtl:border-l-0 rtl:border-r border-zinc-800 flex flex-col h-full text-zinc-200 select-none overflow-hidden z-20">
      {/* Category Tabs Header */}
      <div className="flex border-b border-zinc-800 bg-zinc-950 overflow-x-auto no-scrollbar py-1 px-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (onActiveLayerChange) {
                  if (tab.id === 'suits') onActiveLayerChange('suit');
                  else if (tab.id === 'text') onActiveLayerChange('text');
                  else if (tab.id === 'chroma') onActiveLayerChange('background');
                  else if (tab.id === 'standards') onActiveLayerChange('crop');
                }
              }}
              className={`flex-1 min-w-[48px] py-2 px-1 flex flex-col items-center justify-center rounded-md text-[11px] font-medium transition cursor-pointer relative ${
                isActive
                  ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title={tab.label}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
              <span className="truncate max-w-[55px] text-[10px] hidden sm:block">
                {tab.id === 'standards' ? (language === 'ar' ? 'المقاييس' : 'Standards') :
                 tab.id === 'dv' ? 'DV 2x2' :
                 tab.id === 'chroma' ? (language === 'ar' ? 'الخلفية' : 'Backdrop') :
                 tab.id === 'suits' ? (language === 'ar' ? 'البدلات' : 'Suits') :
                 tab.id === 'adjust' ? (language === 'ar' ? 'الألوان' : 'Adjust') :
                 tab.id === 'text' ? (language === 'ar' ? 'النص' : 'Text') :
                 (language === 'ar' ? 'الطباعة' : 'Print')}
              </span>
              {tab.badge && (
                <span className={`absolute top-1 right-1 text-[9px] px-1 py-0.2 rounded font-bold leading-none ${
                  dvValidation?.overallPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* ================= TAB 1: PASSPORT STANDARDS ================= */}
        {activeTab === 'standards' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Crop className="w-4 h-4 text-cyan-400" />
                {t.standardsTitle}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">{t.standardsDesc}</p>
            </div>

            {/* 1-Click Instant Biometric Standards Section (USA, Turkey, UK, Canada, Schengen) */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-cyan-500/30 space-y-2.5 shadow-lg shadow-black/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.quick1ClickTitle}</span>
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  1-Click ⚡
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {t.quick1ClickDesc}
              </p>

              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {QUICK_COUNTRY_PRESETS.map((qp) => {
                  const isSelected = activeStandard.id === qp.standardId;
                  return (
                    <button
                      key={qp.id}
                      onClick={() => onQuickApplyCountry && onQuickApplyCountry(qp)}
                      className={`w-full p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between group ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-md ring-1 ring-cyan-500/50'
                          : 'border-zinc-800 bg-zinc-950/80 hover:border-cyan-500/40 hover:bg-zinc-900 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-start">
                        <span className="text-2xl leading-none shrink-0">{qp.flag}</span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{language === 'ar' ? qp.nameAr : qp.nameEn}</span>
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-300 font-bold">
                                {language === 'ar' ? 'مفعل' : 'Active'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {qp.sizeLabel}
                          </div>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded text-[10px] font-bold transition shrink-0 ${
                        isSelected 
                          ? 'bg-cyan-500 text-zinc-950' 
                          : 'bg-zinc-800 text-cyan-300 group-hover:bg-cyan-600 group-hover:text-white'
                      }`}>
                        {language === 'ar' ? 'تطبيق فوري ⚡' : 'Auto 1-Click ⚡'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Standards Presets List */}
            <div className="space-y-2 pt-1 border-t border-zinc-800/80">
              <label className="text-xs font-semibold text-zinc-300 block">
                {t.countryPreset}
              </label>
              <div className="space-y-1.5 max-h-[42vh] overflow-y-auto pr-1">
                {PASSPORT_STANDARDS.map((std) => {
                  const isSelected = activeStandard.id === std.id;
                  return (
                    <div
                      key={std.id}
                      onClick={() => onSelectStandard(std)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/20 text-white'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{language === 'ar' ? std.nameAr : std.nameEn}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono">
                          {std.widthMm}×{std.heightMm}mm
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                        {language === 'ar' ? std.descriptionAr : std.descriptionEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standard Details Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>{t.biometricHeadRange}:</span>
                <span className="text-white font-medium">{activeStandard.headMinPercent}% - {activeStandard.headMaxPercent}%</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t.aspectRatio}:</span>
                <span className="text-white font-mono">{activeStandard.aspectRatio.toFixed(3)}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2">
                <span className="text-amber-400 font-medium block mb-1">
                  {t.biometricBgRule}:
                </span>
                <p className="text-[11px] text-zinc-300">
                  {language === 'ar' ? activeStandard.bgRequirementAr : activeStandard.bgRequirementEn}
                </p>
              </div>
            </div>

            {/* Reset Crop Action */}
            <button
              onClick={onResetCrop}
              className="w-full py-2 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.resetCrop}</span>
            </button>
          </div>
        )}

        {/* ================= TAB 2: DV LOTTERY CHECKER ================= */}
        {activeTab === 'dv' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {t.dvTitle}
                </h3>
                {dvValidation && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    dvValidation.overallPass 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {dvValidation.overallScore}%
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">{t.dvSubtitle}</p>
            </div>

            {/* Auto Fix Button */}
            <button
              onClick={onAutoFixDV}
              className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.dvAutoFix}</span>
            </button>

            {/* Validation Criteria Status List */}
            {dvValidation && (
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  {dvValidation.aspectRatioValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">{t.dvAspectRatio}</div>
                    <div className="text-[11px] text-zinc-400">
                      {dvValidation.aspectRatioValid 
                        ? (language === 'ar' ? 'مربعة 1:1 تماماً' : 'Perfect 1:1 Square')
                        : (language === 'ar' ? 'ليست مربعة، يرجى قفل النسبة' : 'Not 1:1 square')}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  {dvValidation.resolutionValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">{t.dvDimensions}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {cropRect.width} × {cropRect.height} px
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  {dvValidation.fileSizeValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">{t.dvFileSize}</div>
                    <div className="text-[11px] text-zinc-400">
                      ~{dvValidation.fileSizeKB} KB (Limit: ≤ 240 KB)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  {dvValidation.headHeightValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-zinc-200">{t.dvHeadHeight}</div>
                    <div className="text-[11px] text-zinc-400">
                      ~{dvValidation.headHeightPercent}% ({language === 'ar' ? 'المعيار: 50% - 69%' : 'Standard: 50% - 69%'})
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1.5 text-zinc-300">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'تعليمات رسمية للتقديم' : 'Official Guidelines'}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {t.dvGuideTips}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: 1-CLICK GREEN SCREEN & BACKGROUND ================= */}
        {activeTab === 'chroma' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {t.chromaTitle}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">{t.chromaDesc}</p>
            </div>

            {/* ONE-CLICK GREEN SCREEN REMOVAL BUTTON */}
            {!chromaKey.enabled ? (
              <button
                onClick={() => onChromaKeyChange({ enabled: true, autoRemoved: true })}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer transition transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{t.autoGreenRemoveBtn}</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'ar' ? 'تم حذف الخلفية الخضراء تلقائياً' : 'Green Screen Removed'}</span>
                </span>
                <button
                  onClick={() => onChromaKeyChange({ enabled: false, autoRemoved: false })}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-md text-xs font-medium cursor-pointer border border-zinc-700 transition"
                >
                  {t.restoreGreenBgBtn}
                </button>
              </div>
            )}

            {/* BACKGROUND REPLACEMENT OPTIONS */}
            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <label className="text-xs font-semibold text-white block">{t.bgType}</label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onBackgroundChange({ ...background, type: 'solid' })}
                  className={`p-2.5 rounded-lg border text-xs text-center cursor-pointer transition ${
                    background.type === 'solid'
                      ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.bgSolid}
                </button>
                <button
                  onClick={() => onBackgroundChange({ ...background, type: 'transparent' })}
                  className={`p-2.5 rounded-lg border text-xs text-center cursor-pointer transition ${
                    background.type === 'transparent'
                      ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.bgTransparent}
                </button>
                <button
                  onClick={() => onBackgroundChange({ ...background, type: 'preset' })}
                  className={`p-2.5 rounded-lg border text-xs text-center cursor-pointer transition ${
                    background.type === 'preset'
                      ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.bgPresets}
                </button>
                <label className={`p-2.5 rounded-lg border text-xs text-center cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  background.type === 'custom'
                    ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}>
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'ar' ? 'رفع خلفية خاصة' : 'Custom Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleCustomBgUpload} className="hidden" />
                </label>
              </div>

              {/* Solid Color Palette */}
              {background.type === 'solid' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={background.color}
                      onChange={(e) => onBackgroundChange({ ...background, color: e.target.value })}
                      className="w-8 h-8 rounded border-0 p-0 cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-xs text-zinc-300">{background.color.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BACKGROUND_PRESETS.filter(p => p.category === 'solid').map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onBackgroundChange({ ...background, color: p.color || '#FFFFFF' })}
                        className={`p-2 rounded border text-left flex items-center gap-2 text-[11px] cursor-pointer transition ${
                          background.color.toLowerCase() === p.color?.toLowerCase()
                            ? 'border-cyan-500 bg-cyan-950/30 text-white font-semibold'
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <span 
                          className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" 
                          style={{ backgroundColor: p.color }} 
                        />
                        <span className="truncate">{language === 'ar' ? p.nameAr : p.nameEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Studio Backdrops */}
              {background.type === 'preset' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {BACKGROUND_PRESETS.filter(p => p.category === 'studio').map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onBackgroundChange({ ...background, presetId: p.id })}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                        background.presetId === p.id
                          ? 'border-cyan-500 bg-cyan-950/20 text-white font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="h-12 rounded mb-1.5 overflow-hidden border border-zinc-700">
                        {p.dataUri && <img src={p.dataUri} alt={p.nameEn} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[11px] truncate block">
                        {language === 'ar' ? p.nameAr : p.nameEn}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Direct Background Transform Controls (Scale, Width, Height, Rotate, Position) */}
              {(background.type === 'custom' || background.type === 'preset') && onBgTransformChange && (
                <div className="space-y-3 bg-zinc-950 p-3 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{language === 'ar' ? 'التحكم المباشر بالخلفية' : 'Background Transform'}</span>
                    </span>
                    <button
                      onClick={() => onBgTransformChange({ x: 0, y: 0, scale: 1.0, scaleX: 1.0, scaleY: 1.0, rotation: 0 })}
                      className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 transition cursor-pointer"
                    >
                      {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    {language === 'ar'
                      ? '💡 يمكنك سحب الخلفية بالفأرة مباشرة، واستخدام نقاط الزوايا للتكبير ونقاط الأطراف الأربعة لتعريضها أو تطويلها كالإطار الحر تماماً.'
                      : '💡 Drag background directly, use 4 corner handles to scale, and 4 edge handles to stretch width/height like free crop.'}
                  </p>

                  {/* Width Stretch (تعريض الخلفية) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{language === 'ar' ? 'عرض الخلفية (تعريض)' : 'Width Stretch'}</span>
                      <span className="font-mono text-purple-400">
                        {Math.round((bgTransform?.scaleX ?? bgTransform?.scale ?? 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={Math.round((bgTransform?.scaleX ?? bgTransform?.scale ?? 1.0) * 100)}
                      onChange={(e) => onBgTransformChange({
                        ...(bgTransform || { x: 0, y: 0, scale: 1, rotation: 0 }),
                        scaleX: Number((Number(e.target.value) / 100).toFixed(2)),
                      })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Height Stretch (تطويل الخلفية) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{language === 'ar' ? 'طول الخلفية (تطويل)' : 'Height Stretch'}</span>
                      <span className="font-mono text-purple-400">
                        {Math.round((bgTransform?.scaleY ?? bgTransform?.scale ?? 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={Math.round((bgTransform?.scaleY ?? bgTransform?.scale ?? 1.0) * 100)}
                      onChange={(e) => onBgTransformChange({
                        ...(bgTransform || { x: 0, y: 0, scale: 1, rotation: 0 }),
                        scaleY: Number((Number(e.target.value) / 100).toFixed(2)),
                      })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Overall Scale Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{language === 'ar' ? 'الحجم الإجمالي' : 'Overall Scale'}</span>
                      <span className="font-mono text-purple-400">{Math.round((bgTransform?.scale || 1.0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={Math.round((bgTransform?.scale || 1.0) * 100)}
                      onChange={(e) => onBgTransformChange({
                        ...(bgTransform || { x: 0, y: 0, scale: 1, rotation: 0 }),
                        scale: Number((Number(e.target.value) / 100).toFixed(2)),
                        scaleX: Number((Number(e.target.value) / 100).toFixed(2)),
                        scaleY: Number((Number(e.target.value) / 100).toFixed(2)),
                      })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Rotation Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{language === 'ar' ? 'زاوية الدوران' : 'Rotation Angle'}</span>
                      <span className="font-mono text-purple-400">{bgTransform?.rotation || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={bgTransform?.rotation || 0}
                      onChange={(e) => onBgTransformChange({
                        ...(bgTransform || { x: 0, y: 0, scale: 1, rotation: 0 }),
                        rotation: Number(e.target.value),
                      })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: REALISTIC SUITS & ATTIRE ================= */}
        {activeTab === 'suits' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shirt className="w-4 h-4 text-cyan-400" />
                {t.suitTitle}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">{t.suitDesc}</p>
            </div>

            {/* Suit Toggle & Actions */}
            <div className="flex gap-2">
              <input 
                ref={customSuitInputRef} 
                type="file" 
                accept="image/png,image/webp" 
                className="hidden" 
                onChange={handleCustomSuitUpload} 
              />
              <button
                onClick={() => customSuitInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 border border-zinc-700 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.uploadSuitBtn}</span>
              </button>

              {suit.enabled && (
                <button
                  onClick={() => onSuitChange({ ...suit, enabled: false })}
                  className="py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center gap-1 cursor-pointer transition"
                  title={t.deleteSuitBtn}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
                </button>
              )}
            </div>

            {/* On-Canvas Direct Transform Guide Banner */}
            {suit.enabled && (
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  {t.suitCanvasTip}
                </p>
              </div>
            )}

            {/* Suit Model Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">{t.suitSelect}</label>
              <div className="grid grid-cols-2 gap-2">
                {allSuits.map((tpl) => {
                  const isSelected = suit.enabled && suit.templateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => onSuitChange({ ...suit, enabled: true, templateId: tpl.id })}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/30 text-white font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="h-20 rounded bg-zinc-900 border border-zinc-800 mb-1.5 flex items-center justify-center overflow-hidden p-1">
                        <img src={tpl.svgDataUri} alt={tpl.nameEn} className="h-full object-contain" />
                      </div>
                      <span className="text-[11px] truncate block text-center">
                        {language === 'ar' ? tpl.nameAr : tpl.nameEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suit Quick Controls (Flip & Tone Match) */}
            {suit.enabled && (
              <div className="space-y-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 font-medium">{t.suitFlip}</span>
                  <button
                    onClick={() => onSuitChange({ ...suit, flipH: !suit.flipH })}
                    className={`px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1 ${
                      suit.flipH ? 'bg-cyan-600 text-white font-semibold' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>{suit.flipH ? (language === 'ar' ? 'معكوس' : 'Flipped') : (language === 'ar' ? 'عادي' : 'Normal')}</span>
                  </button>
                </div>

                <div className="space-y-1 border-t border-zinc-800 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">{t.suitBrightness}</span>
                    <span className="font-mono text-cyan-400">{suit.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={suit.brightness}
                    onChange={(e) => onSuitChange({ ...suit, brightness: Number(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: ADJUSTMENTS ================= */}
        {activeTab === 'adjust' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  {t.adjustTitle}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{t.adjustDesc}</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.brightness}</span>
                  <span className="font-mono text-cyan-400">{adjustments.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.brightness}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, brightness: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.contrast}</span>
                  <span className="font-mono text-cyan-400">{adjustments.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.contrast}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, contrast: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.saturation}</span>
                  <span className="font-mono text-cyan-400">{adjustments.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.saturation}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, saturation: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Exposure */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.exposure}</span>
                  <span className="font-mono text-cyan-400">{adjustments.exposure}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.exposure}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, exposure: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.temperature}</span>
                  <span className="font-mono text-amber-400">{adjustments.temperature}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.temperature}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, temperature: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Tint */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.tint}</span>
                  <span className="font-mono text-pink-400">{adjustments.tint}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={adjustments.tint}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, tint: Number(e.target.value) })}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* Straighten / Head Tilt */}
              <div className="space-y-1 border-t border-zinc-800 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.straighten}</span>
                  <span className="font-mono text-cyan-400">{adjustments.straighten > 0 ? `+${adjustments.straighten}` : adjustments.straighten}°</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.5"
                  value={adjustments.straighten}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, straighten: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Skin Smoothing / Airbrush */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.skinSmoothing}</span>
                  <span className="font-mono text-emerald-400">{adjustments.skinSmoothing}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.skinSmoothing}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, skinSmoothing: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Sharpness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300">{t.sharpness}</span>
                  <span className="font-mono text-cyan-400">{adjustments.sharpness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.sharpness}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, sharpness: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <button
                onClick={onResetAdjustments}
                className="w-full py-2 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.resetAdjustments}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 6: TEXT & WATERMARK ================= */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-cyan-400" />
                {t.textTitle}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">{t.textDesc}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-xs font-semibold text-white">{t.textEnable}</span>
              <input
                type="checkbox"
                checked={textOverlay.enabled}
                onChange={(e) => onTextOverlayChange({ ...textOverlay, enabled: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {textOverlay.enabled && (
              <div className="space-y-3.5">
                {/* On-Canvas Direct Transform Guide Banner */}
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    {language === 'ar'
                      ? '💡 يمكنك سحب النص بالفأرة مباشرة إلى أي مكان، وتكبيره أو تصغيره عبر زوايا الإطار، وتدويره عبر المقبض العلوي، أو حذفه بالزر الأحمر [X].'
                      : '💡 Drag text anywhere on the canvas, scale using corner handles, rotate via the top knob, or click [X] to delete.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 block">{t.textContent}</label>
                  <input
                    type="text"
                    value={textOverlay.text}
                    onChange={(e) => onTextOverlayChange({ ...textOverlay, text: e.target.value })}
                    placeholder={t.studioNamePlaceholder}
                    className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                {/* Font Family Selector: 12 Arabic Fonts + 12 Latin Fonts */}
                <div className="space-y-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{language === 'ar' ? 'نوع الخط (Fonts):' : 'Font Family:'}</span>
                    </span>
                    <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setFontCategory('arabic')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          fontCategory === 'arabic' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {language === 'ar' ? 'عربي (12)' : 'Arabic (12)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontCategory('latin')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          fontCategory === 'latin' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {language === 'ar' ? 'لاتيني (12)' : 'Latin (12)'}
                      </button>
                    </div>
                  </div>

                  {/* Fonts Select Dropdown */}
                  <select
                    value={textOverlay.fontFamily || (language === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif")}
                    onChange={(e) => onTextOverlayChange({ ...textOverlay, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
                  >
                    {(fontCategory === 'arabic' ? ARABIC_FONTS : LATIN_FONTS).map((f) => (
                      <option key={f.id} value={f.family} style={{ fontFamily: f.family }}>
                        {language === 'ar' ? f.nameAr : f.nameEn} — {f.sampleText}
                      </option>
                    ))}
                  </select>

                  {/* Quick Font Chips for Instant 1-Click Change */}
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {(fontCategory === 'arabic' ? ARABIC_FONTS.slice(0, 6) : LATIN_FONTS.slice(0, 6)).map((f) => {
                      const isSelected = textOverlay.fontFamily === f.family;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onTextOverlayChange({ ...textOverlay, fontFamily: f.family })}
                          className={`py-1 px-1.5 rounded border text-[11px] truncate text-center cursor-pointer transition ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-950/30 text-white font-bold'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                          }`}
                          style={{ fontFamily: f.family }}
                        >
                          {f.nameEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Text Scale & Rotation Sliders */}
                <div className="space-y-3 bg-zinc-950 p-3 rounded-lg border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'ar' ? 'التحكم بحجم وزاوية النص' : 'Text Size & Angle'}</span>
                    </span>
                    <button
                      onClick={() => onTextOverlayChange({
                        ...textOverlay,
                        xPercent: 50,
                        yPercent: 88,
                        scale: 1.0,
                        rotation: 0
                      })}
                      className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 transition cursor-pointer"
                    >
                      {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
                    </button>
                  </div>

                  {/* Text Scale Multiplier */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{language === 'ar' ? 'تكبير وتصغير النص' : 'Scale Multiplier'}</span>
                      <span className="font-mono text-amber-400">{Math.round((textOverlay.scale || 1.0) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={Math.round((textOverlay.scale || 1.0) * 100)}
                      onChange={(e) => onTextOverlayChange({
                        ...textOverlay,
                        scale: Number((Number(e.target.value) / 100).toFixed(2)),
                      })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Text Rotation Angle */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{language === 'ar' ? 'زاوية الدوران' : 'Rotation Angle'}</span>
                      <span className="font-mono text-amber-400">{textOverlay.rotation || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={textOverlay.rotation || 0}
                      onChange={(e) => onTextOverlayChange({
                        ...textOverlay,
                        rotation: Number(e.target.value),
                      })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">{t.textFontSize}</span>
                    <span className="font-mono text-cyan-400">{textOverlay.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={textOverlay.fontSize}
                    onChange={(e) => onTextOverlayChange({ ...textOverlay, fontSize: Number(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Classic Desktop Swatch Palette (Matching User's Attached Screenshot) */}
                <div className="space-y-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-300">
                        {language === 'ar' ? 'لون النص:' : 'Text Color:'}
                      </span>
                      {/* Active Swatch Preview Box */}
                      <div 
                        className="w-6 h-6 rounded border-2 border-white/90 shadow-md flex items-center justify-center shrink-0" 
                        style={{ backgroundColor: textOverlay.color || '#FFFFFF' }}
                      />
                      <span className="font-mono text-[11px] text-zinc-400 font-bold uppercase">
                        {textOverlay.color || '#FFFFFF'}
                      </span>
                    </div>

                    {/* Custom Hex / Eyedropper Input */}
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] cursor-pointer border border-zinc-700 transition">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{language === 'ar' ? 'لون مخصص' : 'Custom'}</span>
                      <input
                        type="color"
                        value={textOverlay.color || '#FFFFFF'}
                        onChange={(e) => onTextOverlayChange({ ...textOverlay, color: e.target.value })}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* 8 Columns x 5 Rows Swatch Palette Grid (Exact from PhotoFiltre/Photoshop) */}
                  <div className="p-1.5 bg-zinc-900/90 rounded-lg border border-zinc-800 shadow-inner">
                    <div className="grid grid-cols-8 gap-1">
                      {STUDIO_SWATCH_PALETTE.map((row, rIdx) => (
                        <React.Fragment key={rIdx}>
                          {row.map((colorHex, cIdx) => {
                            const isSelected = (textOverlay.color || '#FFFFFF').toLowerCase() === colorHex.toLowerCase();
                            return (
                              <button
                                key={`${rIdx}-${cIdx}`}
                                type="button"
                                onClick={() => onTextOverlayChange({ ...textOverlay, color: colorHex })}
                                className={`w-full aspect-square rounded-sm transition transform active:scale-90 cursor-pointer ${
                                  isSelected 
                                    ? 'scale-110 shadow-lg ring-2 ring-cyan-400 border border-white z-10' 
                                    : 'border border-zinc-700/60 hover:scale-105 hover:border-zinc-200'
                                }`}
                                style={{ backgroundColor: colorHex }}
                                title={colorHex}
                              />
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">{t.includeDate}</span>
                  <input
                    type="checkbox"
                    checked={textOverlay.includeDate}
                    onChange={(e) => onTextOverlayChange({ ...textOverlay, includeDate: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">{t.includeBorder}</span>
                  <input
                    type="checkbox"
                    checked={textOverlay.includeBorder}
                    onChange={(e) => onTextOverlayChange({ ...textOverlay, includeBorder: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 7: PRINT SHEET LAUNCHER ================= */}
        {activeTab === 'print' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-400" />
                {t.printTitle}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">{t.printSubtitle}</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-zinc-900 to-indigo-950/40 border border-blue-500/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {language === 'ar' ? 'طباعة صور مجمعة (حتى 8 صور في الورقة)' : 'Print Multi-Photo Grid (Up to 8 photos)'}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {language === 'ar' 
                    ? 'تجهيز ورقة 10x15 سم أو A4 تحتوي على 2 أو 4 أو 6 أو 8 صور بدقة 300 DPI جاهزة للقص والطباعة.' 
                    : 'Auto-tile 2, 4, 6, or 8 photos per sheet with precision crop marks and 300 DPI export.'}
                </p>
              </div>

              <button
                onClick={onOpenPrintModal}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'ar' ? 'فتح استوديو الطباعة' : 'Open Print Grid Studio'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};
