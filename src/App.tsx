import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CanvasViewport } from './components/CanvasViewport';
import { Sidebar } from './components/Sidebar';
import { PrintSheetModal } from './components/PrintSheetModal';
import { SaveAsModal } from './components/SaveAsModal';
import { HelpModal } from './components/HelpModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
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
} from './types';
import { PASSPORT_STANDARDS, QUICK_COUNTRY_PRESETS, type QuickCountryPreset } from './constants/standards';
import { SAMPLE_PORTRAIT_DATA_URI } from './assets/sampleImage';
import { validateDVLottery } from './utils/dvLotteryValidator';
import { translations } from './i18n/translations';
import { Check, Eye } from 'lucide-react';

interface AppSnapshot {
  cropRect: CropRect;
  adjustments: ImageAdjustments;
  chromaKey: ChromaKeySettings;
  background: BackgroundSettings;
  suit: SuitLayerState;
  textOverlay: TextOverlaySettings;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  subjectTransform: LayerTransform;
  bgTransform: LayerTransform;
}

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('ar'); // Default to Arabic as requested
  const t = translations[language];

  // Set document dir & lang for RTL/LTR
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Main Image state
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Standard & Crop (Default to US DV Lottery or Algerian standard)
  const [activeStandard, setActiveStandard] = useState<PassportStandard>(PASSPORT_STANDARDS[1]);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 50, y: 30, width: 500, height: 500 });

  // Adjustments (Clean, standard curves)
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    exposure: 0,
    sharpness: 10,
    straighten: 0,
    skinSmoothing: 0,
  });

  // 1-Click Intelligent Green Screen Removal
  const [chromaKey, setChromaKey] = useState<ChromaKeySettings>({
    enabled: true, // enabled for sample portrait
    autoRemoved: true,
  });

  // Background
  const [background, setBackground] = useState<BackgroundSettings>({
    type: 'solid',
    color: '#FFFFFF', // Default clean white
    presetId: 'solid-white',
    customImageDataUri: null,
  });

  // Dual-Layer Transform Control (Subject vs Uploaded Background)
  const [subjectTransform, setSubjectTransform] = useState<LayerTransform>({ x: 0, y: 0, scale: 1.0, rotation: 0 });
  const [bgTransform, setBgTransform] = useState<LayerTransform>({ x: 0, y: 0, scale: 1.0, rotation: 0 });
  const [activeLayer, setActiveLayer] = useState<ActiveLayerType>('none');

  // Suit Attire
  const [suit, setSuit] = useState<SuitLayerState>({
    enabled: false,
    templateId: 'men-black-classic',
    xPercent: 50,
    yPercent: 88,
    scale: 0.95,
    rotation: 0,
    flipH: false,
    brightness: 0,
    contrast: 0,
  });

  // Custom User Uploaded Suits
  const [customSuits, setCustomSuits] = useState<SuitTemplate[]>([]);

  // Text / Stamp
  const [textOverlay, setTextOverlay] = useState<TextOverlaySettings>({
    enabled: false,
    text: 'Studio Nadir',
    position: 'bottom-right',
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'sans-serif',
    includeDate: true,
    includeBorder: true,
  });

  // Orientation
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Overlays
  const [showDVGuides, setShowDVGuides] = useState<boolean>(true);
  const [showBiometricGuides, setShowBiometricGuides] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active rendered canvas reference for export / print
  const renderedOffscreenRef = useRef<HTMLCanvasElement | null>(null);

  // DV Lottery Validation Result
  const [dvValidation, setDvValidation] = useState<DVLotteryValidation | null>(null);

  // Visitor Counter State (Persistent in localStorage, tiny subtle footer)
  const [visitorCount] = useState<number>(() => {
    const BASE_VISITS = 15248;
    try {
      const saved = localStorage.getItem('nadir_photolab_visitor_count');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          const next = parsed + 1;
          localStorage.setItem('nadir_photolab_visitor_count', next.toString());
          return next;
        }
      }
      const initial = BASE_VISITS + Math.floor(Math.random() * 45) + 1;
      localStorage.setItem('nadir_photolab_visitor_count', initial.toString());
      return initial;
    } catch {
      return BASE_VISITS + 12;
    }
  });

  // Undo / Redo History Stack (up to 30 steps)
  const [history, setHistory] = useState<AppSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  const pushSnapshot = (
    cRect = cropRect,
    adj = adjustments,
    ck = chromaKey,
    bg = background,
    st = suit,
    txt = textOverlay,
    rot = rotation,
    fH = flipH,
    fV = flipV,
    subTrans = subjectTransform,
    bgTrans = bgTransform
  ) => {
    if (isUndoRedoAction.current) return;

    const snap: AppSnapshot = {
      cropRect: { ...cRect },
      adjustments: { ...adj },
      chromaKey: { ...ck },
      background: { ...bg },
      suit: { ...st },
      textOverlay: { ...txt },
      rotation: rot,
      flipH: fH,
      flipV: fV,
      subjectTransform: { ...subTrans },
      bgTransform: { ...bgTrans },
    };

    setHistory(prev => {
      const upTo = prev.slice(0, historyIndex + 1);
      const updated = [...upTo, snap];
      if (updated.length > 30) updated.shift();
      return updated;
    });
    setHistoryIndex(prev => Math.min(29, prev + 1));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex - 1];
      setCropRect(target.cropRect);
      setAdjustments(target.adjustments);
      setChromaKey(target.chromaKey);
      setBackground(target.background);
      setSuit(target.suit);
      setTextOverlay(target.textOverlay);
      setRotation(target.rotation);
      setFlipH(target.flipH);
      setFlipV(target.flipV);
      if (target.subjectTransform) setSubjectTransform(target.subjectTransform);
      if (target.bgTransform) setBgTransform(target.bgTransform);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 50);
      showToast(language === 'ar' ? 'تم التراجع عن خطوة واحدة' : 'Undo 1 step');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex + 1];
      setCropRect(target.cropRect);
      setAdjustments(target.adjustments);
      setChromaKey(target.chromaKey);
      setBackground(target.background);
      setSuit(target.suit);
      setTextOverlay(target.textOverlay);
      setRotation(target.rotation);
      setFlipH(target.flipH);
      setFlipV(target.flipV);
      if (target.subjectTransform) setSubjectTransform(target.subjectTransform);
      if (target.bgTransform) setBgTransform(target.bgTransform);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 50);
      showToast(language === 'ar' ? 'تمت الإعادة خطوة واحدة' : 'Redo 1 step');
    }
  };

  // Global Keyboard Shortcuts (Ctrl+Z for Undo, Ctrl+Y for Redo)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [historyIndex, history]);

  // Load sample image on initial boot
  useEffect(() => {
    loadSampleImage();
  }, []);

  const loadSampleImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = SAMPLE_PORTRAIT_DATA_URI;
    img.onload = () => {
      setImage(img);
      setImageDimensions({ width: img.width, height: img.height });
      initCropForImage(img.width, img.height, activeStandard);
      setHistory([]);
      setHistoryIndex(-1);
    };
  };

  const handleOpenImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.src = e.target.result as string;
        img.onload = () => {
          setImage(img);
          setImageDimensions({ width: img.width, height: img.height });
          initCropForImage(img.width, img.height, activeStandard);
          setChromaKey({ enabled: false, autoRemoved: false });
          setHistory([]);
          setHistoryIndex(-1);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const initCropForImage = (w: number, h: number, std: PassportStandard) => {
    const targetRatio = std.aspectRatio > 0 ? std.aspectRatio : 1.0;
    let cropW = w * 0.8;
    let cropH = cropW / targetRatio;

    if (cropH > h * 0.95) {
      cropH = h * 0.95;
      cropW = cropH * targetRatio;
    }

    const cropX = Math.round((w - cropW) / 2);
    const cropY = Math.round((h - cropH) / 2);

    const newCrop = {
      x: cropX,
      y: cropY,
      width: Math.round(cropW),
      height: Math.round(cropH),
    };
    setCropRect(newCrop);
  };

  const handleSelectStandard = (std: PassportStandard) => {
    setActiveStandard(std);
    if (imageDimensions) {
      initCropForImage(imageDimensions.width, imageDimensions.height, std);
    }
    if (std.id === 'us-dv-lottery-2x2') {
      setShowDVGuides(true);
      setShowBiometricGuides(false);
      setBackground(prev => ({ ...prev, color: '#FFFFFF', type: 'solid' }));
    } else {
      setShowDVGuides(false);
      setShowBiometricGuides(std.id !== 'free-custom');
      if (std.id === 'turkey-50x60' || std.id === 'canada-50x70') {
        setBackground(prev => ({ ...prev, color: '#FFFFFF', type: 'solid' }));
      } else if (std.id === 'algeria-35x45' || std.id === 'schengen-eu-35x45' || std.id === 'uk-passport-35x45') {
        setBackground(prev => ({ ...prev, color: '#E5E7EB', type: 'solid' }));
      }
    }
    pushSnapshot();
  };

  /**
   * 1-Click Biometric Auto Framing for USA (DV), Turkey, UK, Canada, Schengen
   */
  const handleQuickApplyCountry = (preset: QuickCountryPreset) => {
    const std = PASSPORT_STANDARDS.find(s => s.id === preset.standardId) || PASSPORT_STANDARDS[0];
    setActiveStandard(std);

    // Toggle Guides
    if (preset.guideType === 'dv') {
      setShowDVGuides(true);
      setShowBiometricGuides(false);
    } else {
      setShowDVGuides(false);
      setShowBiometricGuides(true);
    }

    // Set Recommended Background Color
    const updatedBg: BackgroundSettings = {
      ...background,
      type: 'solid',
      color: preset.defaultBgColor,
    };
    setBackground(updatedBg);

    // Auto-calculate exact precision biometric crop box
    let newCrop = { ...cropRect };
    if (imageDimensions) {
      const W = imageDimensions.width;
      const H = imageDimensions.height;
      const ratio = std.aspectRatio > 0 ? std.aspectRatio : 1.0;

      if (preset.id === 'quick-us') {
        // US 2x2" (1:1 square): head strictly 50% to 69% (ideal 59%), eye zone 56%-69% from bottom
        const size = Math.round(Math.min(W, H) * 0.78);
        const cropX = Math.round((W - size) / 2);
        const cropY = Math.max(0, Math.round(H * 0.40 - size * 0.38));
        newCrop = { x: cropX, y: cropY, width: size, height: size };
      } else {
        // Biometric standards: Turkey (50x60), UK (35x45), Canada (50x70), Schengen (35x45)
        const maxH = Math.round(H * 0.85);
        let targetH = maxH;
        let targetW = Math.round(targetH * ratio);
        if (targetW > W * 0.94) {
          targetW = Math.round(W * 0.94);
          targetH = Math.round(targetW / ratio);
        }
        const cropX = Math.round((W - targetW) / 2);
        const cropY = Math.max(0, Math.round(H * 0.38 - targetH * 0.33));
        newCrop = { x: cropX, y: cropY, width: targetW, height: targetH };
      }
      setCropRect(newCrop);
    }

    pushSnapshot(newCrop, undefined, undefined, updatedBg);

    const countryName = language === 'ar' ? preset.nameAr : preset.nameEn;
    showToast(
      language === 'ar'
        ? `تم ضبط وتأطير صورة ${countryName} (${preset.sizeLabel}) بضغطة زر واحدة بنجاح! ${preset.flag}`
        : `Auto-framed for ${countryName} (${preset.sizeLabel}) in 1 click! ${preset.flag}`
    );
  };

  const handleAutoFixDV = () => {
    const usPreset = QUICK_COUNTRY_PRESETS.find(p => p.id === 'quick-us') || QUICK_COUNTRY_PRESETS[0];
    handleQuickApplyCountry(usPreset);
  };

  // Re-calculate DV Lottery compliance whenever crop changes
  useEffect(() => {
    if (!cropRect) return;

    const estimatedKB = Math.round((cropRect.width * cropRect.height * 3) / 1024 * 0.08);
    const validation = validateDVLottery(
      Math.round(cropRect.width),
      Math.round(cropRect.height),
      Math.min(220, Math.max(65, estimatedKB)),
      60,
      61
    );
    setDvValidation(validation);
  }, [cropRect]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Generates final cropped canvas with text watermark included on export
   */
  const getCroppedFinalCanvas = (targetW?: number, targetH?: number): HTMLCanvasElement | null => {
    const offCanvas = renderedOffscreenRef.current;
    if (!offCanvas) return null;

    const outW = targetW || Math.round(cropRect.width);
    const outH = targetH || Math.round(cropRect.height);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = outW;
    croppedCanvas.height = outH;
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      offCanvas,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      outW,
      outH
    );

    // Draw Text Overlay on exported image
    if (textOverlay.enabled && textOverlay.text) {
      ctx.save();
      const textScale = textOverlay.scale || 1.0;
      const baseFontSize = textOverlay.fontSize || 18;
      const effectiveFontSize = Math.max(10, Math.round((outW / 600) * baseFontSize * textScale));
      ctx.font = `600 ${effectiveFontSize}px ${textOverlay.fontFamily || 'sans-serif'}`;

      let fullText = textOverlay.text;
      if (textOverlay.includeDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        fullText += ` • ${todayStr}`;
      }

      const textMetrics = ctx.measureText(fullText);
      const textW = textMetrics.width + 24;
      const textH = effectiveFontSize * 1.4;

      const textXPercent = textOverlay.xPercent !== undefined ? textOverlay.xPercent : 50;
      const textYPercent = textOverlay.yPercent !== undefined ? textOverlay.yPercent : 88;
      const textCenterX = (outW * textXPercent) / 100;
      const textCenterY = (outH * textYPercent) / 100;
      const textRotation = textOverlay.rotation || 0;

      ctx.translate(textCenterX, textCenterY);
      ctx.rotate((textRotation * Math.PI) / 180);

      if (textOverlay.includeBorder) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(-textW / 2, -textH / 2, textW, textH);
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = textOverlay.color || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fullText, 0, 0);
      ctx.restore();
    }

    return croppedCanvas;
  };

  const handleExportPNG = () => {
    const canvas = getCroppedFinalCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `NadirPhotoLab_${activeStandard.id}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast(t.successExport);
  };

  const handleExportJPEG = () => {
    const canvas = getCroppedFinalCanvas(600, 600);
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const link = document.createElement('a');
    link.download = `DV_Lottery_Photo_600x600_${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
    showToast(language === 'ar' ? 'تم تصدير صورة اللوتري بمقاس 600x600 وحجم أقل من 240KB' : 'Exported DV Lottery 600x600 JPEG (≤ 240 KB)');
  };

  const handleResetAdjustments = () => {
    const cleanAdj: ImageAdjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      exposure: 0,
      sharpness: 0,
      straighten: 0,
      skinSmoothing: 0,
    };
    setAdjustments(cleanAdj);
    pushSnapshot(undefined, cleanAdj);
  };

  const handleResetCrop = () => {
    if (imageDimensions) {
      initCropForImage(imageDimensions.width, imageDimensions.height, activeStandard);
      pushSnapshot();
    }
  };

  const handleResetAll = () => {
    handleResetAdjustments();
    handleResetCrop();
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setSubjectTransform({ x: 0, y: 0, scale: 1.0, rotation: 0 });
    setBgTransform({ x: 0, y: 0, scale: 1.0, scaleX: 1.0, scaleY: 1.0, rotation: 0 });
    setActiveLayer('none');
    setSuit(prev => ({ ...prev, enabled: false }));
    setTextOverlay(prev => ({ ...prev, enabled: false }));
    pushSnapshot();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* Top Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        activeStandard={activeStandard}
        onOpenImage={handleOpenImage}
        onOpenCameraCapture={() => setIsCameraModalOpen(true)}
        onLoadSample={loadSampleImage}
        onExportPNG={handleExportPNG}
        onExportJPEG={handleExportJPEG}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenSaveAsModal={() => setIsSaveAsModalOpen(true)}
        onResetAll={handleResetAll}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        imageDimensions={imageDimensions}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Interactive Viewport Canvas */}
        <CanvasViewport
          language={language}
          image={image}
          activeStandard={activeStandard}
          cropRect={cropRect}
          onCropChange={(newCrop) => {
            setCropRect(newCrop);
            pushSnapshot(newCrop);
          }}
          adjustments={adjustments}
          chromaKey={chromaKey}
          background={background}
          suit={suit}
          onSuitChange={(newSuit) => {
            setSuit(newSuit);
            pushSnapshot(undefined, undefined, undefined, undefined, newSuit);
          }}
          customSuits={customSuits}
          textOverlay={textOverlay}
          onTextOverlayChange={(newText) => {
            setTextOverlay(newText);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, newText);
          }}
          rotation={rotation}
          flipH={flipH}
          flipV={flipV}
          onRotationChange={(newRot) => {
            setRotation(newRot);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, undefined, newRot);
          }}
          onFlipHChange={(newFlipH) => {
            setFlipH(newFlipH);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, undefined, undefined, newFlipH);
          }}
          onFlipVChange={(newFlipV) => {
            setFlipV(newFlipV);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, newFlipV);
          }}
          showDVGuides={showDVGuides}
          setShowDVGuides={setShowDVGuides}
          showBiometricGuides={showBiometricGuides}
          setShowBiometricGuides={setShowBiometricGuides}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          onCanvasRendered={(canvas) => {
            renderedOffscreenRef.current = canvas;
          }}
          onResetCrop={handleResetCrop}
          onDropFile={handleOpenImage}
          subjectTransform={subjectTransform}
          onSubjectTransformChange={(st) => {
            setSubjectTransform(st);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, st);
          }}
          bgTransform={bgTransform}
          onBgTransformChange={(bt) => {
            setBgTransform(bt);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, bt);
          }}
          activeLayer={activeLayer}
          onActiveLayerChange={setActiveLayer}
        />

        {/* Right Studio Tools Sidebar */}
        <Sidebar
          language={language}
          activeStandard={activeStandard}
          onSelectStandard={handleSelectStandard}
          onQuickApplyCountry={handleQuickApplyCountry}
          cropRect={cropRect}
          onCropChange={(newCrop) => {
            setCropRect(newCrop);
            pushSnapshot(newCrop);
          }}
          onResetCrop={handleResetCrop}
          adjustments={adjustments}
          onAdjustmentsChange={(newAdj) => {
            setAdjustments(newAdj);
            pushSnapshot(undefined, newAdj);
          }}
          onResetAdjustments={handleResetAdjustments}
          chromaKey={chromaKey}
          onChromaKeyChange={(newChroma) => {
            setChromaKey(newChroma);
            pushSnapshot(undefined, undefined, newChroma);
          }}
          background={background}
          onBackgroundChange={(newBg) => {
            setBackground(newBg);
            pushSnapshot(undefined, undefined, undefined, newBg);
          }}
          suit={suit}
          onSuitChange={(newSuit) => {
            setSuit(newSuit);
            pushSnapshot(undefined, undefined, undefined, undefined, newSuit);
          }}
          customSuits={customSuits}
          onUploadCustomSuit={(newSuit) => {
            setCustomSuits(prev => [newSuit, ...prev]);
            showToast(language === 'ar' ? 'تمت إضافة البدلة بنجاح!' : 'Custom suit added successfully!');
          }}
          textOverlay={textOverlay}
          onTextOverlayChange={(newText) => {
            setTextOverlay(newText);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, newText);
          }}
          dvValidation={dvValidation}
          onAutoFixDV={handleAutoFixDV}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
          imageDimensions={imageDimensions}
          bgTransform={bgTransform}
          onBgTransformChange={(newBgTrans) => {
            setBgTransform(newBgTrans);
            pushSnapshot(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, newBgTrans);
          }}
          activeLayer={activeLayer}
          onActiveLayerChange={setActiveLayer}
        />

      </div>

      {/* Footer Bar with Visitor Counter (Tiny subtle font as requested: بخط صغير جدا) */}
      <footer className="h-5 bg-zinc-950 border-t border-zinc-900 px-3 flex items-center justify-between text-[9px] text-zinc-500 font-mono select-none z-20">
        <div className="flex items-center gap-2">
          <span>NadirPhotoLab Studio Pro</span>
          <span>•</span>
          <span>100% Client-Side Private</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500">
          <Eye className="w-2.5 h-2.5 text-zinc-600" />
          <span>{t.visitorCountLabel}</span>
          <span className="font-bold text-zinc-400">{visitorCount.toLocaleString()}</span>
        </div>
      </footer>

      {/* Print Sheet Studio Modal (Max 8 photos) */}
      <PrintSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        language={language}
        photoCanvas={getCroppedFinalCanvas()}
        activeStandard={activeStandard}
      />

      {/* Save As... Modal (PNG, JPEG, WebP, PDF) */}
      <SaveAsModal
        isOpen={isSaveAsModalOpen}
        onClose={() => setIsSaveAsModalOpen(false)}
        language={language}
        photoCanvas={getCroppedFinalCanvas()}
        activeStandard={activeStandard}
      />

      {/* Help & Standards Guide Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        language={language}
      />

      {/* Live Camera Studio Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(capturedImg) => {
          setImage(capturedImg);
          setImageDimensions({ width: capturedImg.width, height: capturedImg.height });
          initCropForImage(capturedImg.width, capturedImg.height, activeStandard);
          setChromaKey({ enabled: false, autoRemoved: false });
          setHistory([]);
          setHistoryIndex(-1);
          showToast(language === 'ar' ? 'تم التقاط الصورة بنجاح!' : 'Photo captured successfully!');
        }}
        language={language}
        activeStandard={activeStandard}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default App;
