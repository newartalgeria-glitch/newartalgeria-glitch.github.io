import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Eye, 
  Grid3X3,
  Trash2,
  User,
  Image as ImageIcon,
  RotateCcw as ResetIcon,
  Shirt,
  Type,
  Crop
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
  SuitTemplate,
  LayerTransform,
  ActiveLayerType
} from '../types';
import { translations } from '../i18n/translations';
import { autoRemoveGreenScreen, applyAdjustments, applySharpness, applySkinSmoothing } from '../utils/colorUtils';
import { SUIT_TEMPLATES } from '../assets/suits';
import { BACKGROUND_PRESETS } from '../assets/presets';

interface CanvasViewportProps {
  language: Language;
  image: HTMLImageElement | null;
  activeStandard: PassportStandard;
  cropRect: CropRect;
  onCropChange: (crop: CropRect) => void;
  adjustments: ImageAdjustments;
  chromaKey: ChromaKeySettings;
  background: BackgroundSettings;
  suit: SuitLayerState;
  onSuitChange: (suit: SuitLayerState) => void;
  customSuits?: SuitTemplate[];
  textOverlay: TextOverlaySettings;
  onTextOverlayChange?: (text: TextOverlaySettings) => void;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  onRotationChange: (rot: number) => void;
  onFlipHChange: (flip: boolean) => void;
  onFlipVChange: (flip: boolean) => void;
  showDVGuides: boolean;
  setShowDVGuides: (show: boolean) => void;
  showBiometricGuides: boolean;
  setShowBiometricGuides: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  onCanvasRendered?: (canvas: HTMLCanvasElement) => void;
  onResetCrop: () => void;
  onDropFile?: (file: File) => void;

  // Layer Controls (Subject, Background, Suit, Text)
  subjectTransform?: LayerTransform;
  onSubjectTransformChange?: (trans: LayerTransform) => void;
  bgTransform?: LayerTransform;
  onBgTransformChange?: (trans: LayerTransform) => void;
  activeLayer?: ActiveLayerType;
  onActiveLayerChange?: (layer: ActiveLayerType) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  language,
  image,
  activeStandard,
  cropRect,
  onCropChange,
  adjustments,
  chromaKey,
  background,
  suit,
  onSuitChange,
  customSuits = [],
  textOverlay,
  onTextOverlayChange,
  rotation,
  flipH,
  flipV,
  onRotationChange,
  onFlipHChange,
  onFlipVChange,
  showDVGuides,
  setShowDVGuides,
  showBiometricGuides,
  setShowBiometricGuides,
  showGrid,
  setShowGrid,
  onCanvasRendered,
  onDropFile,
  subjectTransform = { x: 0, y: 0, scale: 1.0, rotation: 0 },
  onSubjectTransformChange,
  bgTransform = { x: 0, y: 0, scale: 1.0, rotation: 0 },
  onBgTransformChange,
  activeLayer = 'none',
  onActiveLayerChange,
}) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drag over file state
  const [isDragOverFile, setIsDragOverFile] = useState(false);

  // Cached assets
  const suitImgCache = useRef<{ [id: string]: HTMLImageElement }>({});
  const bgPresetImgCache = useRef<{ [id: string]: HTMLImageElement }>({});
  const customBgImgCache = useRef<HTMLImageElement | null>(null);

  // Viewport navigation state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crop drag state
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialCropRect, setInitialCropRect] = useState<CropRect>(cropRect);

  // Direct Layer Transform Action state ('suit' | 'subject' | 'background' | 'text')
  const [layerAction, setLayerAction] = useState<{
    layer: 'suit' | 'subject' | 'background' | 'text';
    type: 'move' | 'scale' | 'rotate' | 'scale-x' | 'scale-y';
  } | null>(null);

  const [layerActionStart, setLayerActionStart] = useState<{
    mouseX: number;
    mouseY: number;
    origTransform: LayerTransform;
    origSuitState?: SuitLayerState;
    origTextState?: TextOverlaySettings;
    initialDistance: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    origTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
    initialDistance: 1,
  });

  // Pre-load suit and preset images
  useEffect(() => {
    const allSuits = [...SUIT_TEMPLATES, ...customSuits];
    allSuits.forEach(tpl => {
      if (!suitImgCache.current[tpl.id]) {
        const img = new Image();
        img.src = tpl.svgDataUri;
        suitImgCache.current[tpl.id] = img;
      }
    });

    BACKGROUND_PRESETS.forEach(preset => {
      if (preset.dataUri && !bgPresetImgCache.current[preset.id]) {
        const img = new Image();
        img.src = preset.dataUri;
        bgPresetImgCache.current[preset.id] = img;
      }
    });
  }, [customSuits]);

  // Pre-load custom background if set
  useEffect(() => {
    if (background.customImageDataUri) {
      const img = new Image();
      img.src = background.customImageDataUri;
      img.onload = () => {
        customBgImgCache.current = img;
        renderAll();
      };
    } else {
      customBgImgCache.current = null;
    }
  }, [background.customImageDataUri]);

  // Fit image to viewport initially
  useEffect(() => {
    if (image && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 60;
      const scaleX = (rect.width - padding) / image.width;
      const scaleY = (rect.height - padding) / image.height;
      const initialZoom = Math.min(1.5, Math.max(0.2, Math.min(scaleX, scaleY)));
      setZoom(initialZoom);
      setPan({ x: 0, y: 0 });
    }
  }, [image]);

  /**
   * Main Canvas Render Pipeline
   */
  const renderAll = useCallback(() => {
    if (!image) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;

    // Dimensions accounting for 90/270 rotation
    const isSideways = rotation % 180 !== 0;
    const baseW = isSideways ? image.height : image.width;
    const baseH = isSideways ? image.width : image.height;

    offCanvas.width = baseW;
    offCanvas.height = baseH;
    const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // 1. Render Base Photo onto a temporary subject canvas
    const subjectCanvas = document.createElement('canvas');
    subjectCanvas.width = baseW;
    subjectCanvas.height = baseH;
    const subCtx = subjectCanvas.getContext('2d', { willReadFrequently: true });
    if (!subCtx) return;

    const totalRotationDeg = rotation + (adjustments.straighten || 0);
    subCtx.save();
    subCtx.translate(baseW / 2, baseH / 2);
    subCtx.rotate((totalRotationDeg * Math.PI) / 180);
    subCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    subCtx.drawImage(image, -image.width / 2, -image.height / 2);
    subCtx.restore();

    // 2. Intelligent Green Screen Removal if enabled
    if (chromaKey.enabled) {
      const imgData = subCtx.getImageData(0, 0, baseW, baseH);
      autoRemoveGreenScreen(imgData);
      subCtx.putImageData(imgData, 0, 0);
    }

    // 3. Composite Dual Layers: Background (bottom) + Subject (top)
    ctx.clearRect(0, 0, baseW, baseH);

    // Draw Background Layer
    if (chromaKey.enabled && background.type !== 'transparent') {
      if (background.type === 'solid') {
        ctx.fillStyle = background.color;
        ctx.fillRect(0, 0, baseW, baseH);
      } else {
        // Support direct transforms for both preset and custom backgrounds!
        const preset = background.type === 'preset' ? BACKGROUND_PRESETS.find(p => p.id === background.presetId) : null;
        let bgImg: HTMLImageElement | null = null;
        if (background.type === 'custom' && customBgImgCache.current) {
          bgImg = customBgImgCache.current;
        } else if (preset?.id && bgPresetImgCache.current[preset.id]) {
          bgImg = bgPresetImgCache.current[preset.id];
        } else if (preset?.color) {
          ctx.fillStyle = preset.color;
          ctx.fillRect(0, 0, baseW, baseH);
        }

        if (bgImg) {
          ctx.save();
          ctx.translate(baseW / 2 + bgTransform.x, baseH / 2 + bgTransform.y);
          ctx.rotate((bgTransform.rotation * Math.PI) / 180);
          const bgScaleX = bgTransform.scaleX ?? bgTransform.scale ?? 1.0;
          const bgScaleY = bgTransform.scaleY ?? bgTransform.scale ?? 1.0;
          ctx.scale(bgScaleX, bgScaleY);
          ctx.drawImage(bgImg, -baseW / 2, -baseH / 2, baseW, baseH);
          ctx.restore();
        }
      }
    }

    // Draw Subject Layer (with Subject Transform)
    ctx.save();
    ctx.translate(baseW / 2 + subjectTransform.x, baseH / 2 + subjectTransform.y);
    ctx.rotate((subjectTransform.rotation * Math.PI) / 180);
    ctx.scale(subjectTransform.scale, subjectTransform.scale);
    ctx.drawImage(subjectCanvas, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();

    // 4. Color Adjustments, Sharpness, and Skin Smoothing
    const hasAdjustments = 
      adjustments.brightness !== 0 ||
      adjustments.contrast !== 0 ||
      adjustments.saturation !== 0 ||
      adjustments.temperature !== 0 ||
      adjustments.tint !== 0 ||
      adjustments.exposure !== 0;

    if (hasAdjustments || adjustments.sharpness > 0 || (adjustments.skinSmoothing || 0) > 0) {
      const adjData = ctx.getImageData(0, 0, baseW, baseH);
      if (hasAdjustments) {
        applyAdjustments(
          adjData,
          adjustments.brightness,
          adjustments.contrast,
          adjustments.saturation,
          adjustments.temperature,
          adjustments.tint,
          adjustments.exposure
        );
      }
      if (adjustments.skinSmoothing && adjustments.skinSmoothing > 0) {
        applySkinSmoothing(adjData, adjustments.skinSmoothing);
      }
      if (adjustments.sharpness > 0) {
        applySharpness(adjData, adjustments.sharpness);
      }
      ctx.putImageData(adjData, 0, 0);
    }

    // 5. Suit & Formal Attire Overlay
    if (suit.enabled && suit.templateId) {
      const allSuits = [...SUIT_TEMPLATES, ...customSuits];
      const suitImg = suitImgCache.current[suit.templateId];
      if (suitImg && suitImg.complete) {
        ctx.save();
        const suitTpl = allSuits.find(s => s.id === suit.templateId) || SUIT_TEMPLATES[0];
        
        const suitWidth = baseW * suit.scale;
        const suitHeight = suitWidth / (suitTpl.aspectRatio || 1.15);

        const suitCenterX = (baseW * suit.xPercent) / 100;
        const suitCenterY = (baseH * suit.yPercent) / 100;

        ctx.translate(suitCenterX, suitCenterY);
        ctx.rotate((suit.rotation * Math.PI) / 180);
        ctx.scale(suit.flipH ? -1 : 1, 1);

        if (suit.brightness !== 0 || suit.contrast !== 0) {
          const b = 1 + suit.brightness / 100;
          const c = 1 + suit.contrast / 100;
          ctx.filter = `brightness(${b}) contrast(${c})`;
        }

        ctx.drawImage(suitImg, -suitWidth / 2, -suitHeight / 2, suitWidth, suitHeight);
        ctx.restore();
      }
    }

    // Render to Display Canvas Viewport
    drawDisplayCanvas();

    if (onCanvasRendered) {
      onCanvasRendered(offCanvas);
    }
  }, [
    image,
    rotation,
    flipH,
    flipV,
    chromaKey,
    background,
    adjustments,
    suit,
    customSuits,
    subjectTransform,
    bgTransform,
    onCanvasRendered,
  ]);

  /**
   * Draw the interactive Display Canvas (with pan, zoom, crop box, suit/text/background layer handles)
   */
  const drawDisplayCanvas = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    const offCanvas = offscreenCanvasRef.current;
    if (!displayCanvas || !offCanvas || !image) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (displayCanvas.width !== rect.width || displayCanvas.height !== rect.height) {
        displayCanvas.width = rect.width;
        displayCanvas.height = rect.height;
      }
    }

    ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    // Coordinate transform: center + pan + zoom
    ctx.save();
    const centerX = displayCanvas.width / 2 + pan.x;
    const centerY = displayCanvas.height / 2 + pan.y;
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);

    // Draw the processed photo
    const imgX = -offCanvas.width / 2;
    const imgY = -offCanvas.height / 2;
    ctx.drawImage(offCanvas, imgX, imgY);

    // --- Dim area outside Crop Box ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    const cw = offCanvas.width;
    const ch = offCanvas.height;
    const cx = imgX + cropRect.x;
    const cy = imgY + cropRect.y;

    // Top
    ctx.fillRect(imgX, imgY, cw, cropRect.y);
    // Bottom
    ctx.fillRect(imgX, cy + cropRect.height, cw, ch - (cropRect.y + cropRect.height));
    // Left
    ctx.fillRect(imgX, cy, cropRect.x, cropRect.height);
    // Right
    ctx.fillRect(cx + cropRect.width, cy, cw - (cropRect.x + cropRect.width), cropRect.height);

    // --- Crop Box Border & Handles ---
    ctx.strokeStyle = activeStandard.aspectRatio === 0 ? '#a855f7' : '#38bdf8';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(cx, cy, cropRect.width, cropRect.height);

    // Crop box 8 handles
    const handleSize = 8 / zoom;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = activeStandard.aspectRatio === 0 ? '#9333ea' : '#0284c7';
    ctx.lineWidth = 1.5 / zoom;

    const cropCorners = [
      { x: cx, y: cy },
      { x: cx + cropRect.width / 2, y: cy },
      { x: cx + cropRect.width, y: cy },
      { x: cx + cropRect.width, y: cy + cropRect.height / 2 },
      { x: cx + cropRect.width, y: cy + cropRect.height },
      { x: cx + cropRect.width / 2, y: cy + cropRect.height },
      { x: cx, y: cy + cropRect.height },
      { x: cx, y: cy + cropRect.height / 2 },
    ];

    cropCorners.forEach(c => {
      ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });

    // --- 1. BACKGROUND TRANSFORM HANDLES (Active Layer === 'background') ---
    const isImageBg = background.type === 'custom' || background.type === 'preset';
    if (activeLayer === 'background' && isImageBg) {
      const baseW = offCanvas.width;
      const baseH = offCanvas.height;
      const bgCenterX = imgX + baseW / 2 + bgTransform.x;
      const bgCenterY = imgY + baseH / 2 + bgTransform.y;
      const bgScaleX = bgTransform.scaleX ?? bgTransform.scale ?? 1.0;
      const bgScaleY = bgTransform.scaleY ?? bgTransform.scale ?? 1.0;
      const bgW = baseW * bgScaleX;
      const bgH = baseH * bgScaleY;

      ctx.save();
      ctx.translate(bgCenterX, bgCenterY);
      ctx.rotate((bgTransform.rotation * Math.PI) / 180);

      // Purple Dotted Selection Box
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(-bgW / 2, -bgH / 2, bgW, bgH);
      ctx.setLineDash([]);

      const hS = 10 / zoom;

      // 4 Corner Handles (Uniform / Proportional Scale)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 2 / zoom;

      const bgCornerPts = [
        { x: -bgW / 2, y: -bgH / 2 },
        { x: bgW / 2, y: -bgH / 2 },
        { x: -bgW / 2, y: bgH / 2 },
        { x: bgW / 2, y: bgH / 2 },
      ];
      bgCornerPts.forEach(pt => {
        ctx.fillRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
        ctx.strokeRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
      });

      // 4 Edge Handles for Stretching Width ("تعريض") & Height ("تطويل") like free crop
      const bgEdgePts = [
        { x: 0, y: -bgH / 2 }, // Top Center (تطويل رأسي)
        { x: bgW / 2, y: 0 },  // Right Center (تعريض أفقي)
        { x: 0, y: bgH / 2 },  // Bottom Center (تطويل رأسي)
        { x: -bgW / 2, y: 0 }, // Left Center (تعريض أفقي)
      ];
      ctx.fillStyle = '#e9d5ff'; // Light purple tint for edge stretch points
      ctx.strokeStyle = '#7e22ce';
      bgEdgePts.forEach(pt => {
        ctx.fillRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
        ctx.strokeRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
      });

      // Top Rotation Knob
      const stemLen = 28 / zoom;
      ctx.beginPath();
      ctx.moveTo(0, -bgH / 2);
      ctx.lineTo(0, -bgH / 2 - stemLen);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -bgH / 2 - stemLen, 6 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Top Badge
      ctx.fillStyle = '#a855f7';
      ctx.font = `bold ${Math.max(10, 11 / zoom)}px sans-serif`;
      ctx.fillText(
        language === 'ar' ? '🖼️ تحكم بالخلفية (سحب/تعريض/تطويل/تدوير)' : '🖼️ Background (Move/Width/Height/Rotate)',
        -bgW / 2,
        -bgH / 2 - 8 / zoom
      );

      ctx.restore();
    }

    // --- 2. SUBJECT TRANSFORM HANDLES (Active Layer === 'subject') ---
    if (activeLayer === 'subject') {
      const baseW = offCanvas.width;
      const baseH = offCanvas.height;
      const subCenterX = imgX + baseW / 2 + subjectTransform.x;
      const subCenterY = imgY + baseH / 2 + subjectTransform.y;
      const subW = baseW * subjectTransform.scale * 0.9;
      const subH = baseH * subjectTransform.scale * 0.9;

      ctx.save();
      ctx.translate(subCenterX, subCenterY);
      ctx.rotate((subjectTransform.rotation * Math.PI) / 180);

      // Emerald Green Selection Box
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(-subW / 2, -subH / 2, subW, subH);
      ctx.setLineDash([]);

      // 4 Corner Handles
      const hS = 10 / zoom;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2 / zoom;

      const subCornerPts = [
        { x: -subW / 2, y: -subH / 2 },
        { x: subW / 2, y: -subH / 2 },
        { x: -subW / 2, y: subH / 2 },
        { x: subW / 2, y: subH / 2 },
      ];
      subCornerPts.forEach(pt => {
        ctx.fillRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
        ctx.strokeRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
      });

      // Top Rotation Knob
      const stemLen = 28 / zoom;
      ctx.beginPath();
      ctx.moveTo(0, -subH / 2);
      ctx.lineTo(0, -subH / 2 - stemLen);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -subH / 2 - stemLen, 6 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.restore();
    }

    // --- 3. SUIT TRANSFORM HANDLES & DIRECT DELETE BUTTON ---
    if (suit.enabled && (activeLayer === 'suit' || activeLayer === 'none')) {
      const allSuits = [...SUIT_TEMPLATES, ...customSuits];
      const suitTpl = allSuits.find(s => s.id === suit.templateId) || SUIT_TEMPLATES[0];
      const baseW = offCanvas.width;
      const baseH = offCanvas.height;
      const suitW = baseW * suit.scale;
      const suitH = suitWidthToHeight(suitW, suitTpl.aspectRatio || 1.15);
      const suitCenterX = imgX + (baseW * suit.xPercent) / 100;
      const suitCenterY = imgY + (baseH * suit.yPercent) / 100;

      ctx.save();
      ctx.translate(suitCenterX, suitCenterY);
      ctx.rotate((suit.rotation * Math.PI) / 180);

      // Cyan Selection Bounding Box
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(-suitW / 2, -suitH / 2, suitW, suitH);
      ctx.setLineDash([]);

      // 4 Corner Resize Handles
      const hSize = 10 / zoom;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 2 / zoom;

      const suitCornerPts = [
        { x: -suitW / 2, y: -suitH / 2 },
        { x: suitW / 2, y: -suitH / 2 },
        { x: -suitW / 2, y: suitH / 2 },
        { x: suitW / 2, y: suitH / 2 },
      ];
      suitCornerPts.forEach(pt => {
        ctx.fillRect(pt.x - hSize / 2, pt.y - hSize / 2, hSize, hSize);
        ctx.strokeRect(pt.x - hSize / 2, pt.y - hSize / 2, hSize, hSize);
      });

      // Top Rotation Stem & Knob
      const rotStemLen = 28 / zoom;
      ctx.beginPath();
      ctx.moveTo(0, -suitH / 2);
      ctx.lineTo(0, -suitH / 2 - rotStemLen);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -suitH / 2 - rotStemLen, 6 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Direct Delete Button [🗑️] at Top-Right
      const delBtnX = suitW / 2 + 14 / zoom;
      const delBtnY = -suitH / 2 - 14 / zoom;
      ctx.beginPath();
      ctx.arc(delBtnX, delBtnY, 11 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();

      // White 'X' on Delete Button
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / zoom;
      const xRad = 4.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(delBtnX - xRad, delBtnY - xRad);
      ctx.lineTo(delBtnX + xRad, delBtnY + xRad);
      ctx.moveTo(delBtnX + xRad, delBtnY - xRad);
      ctx.lineTo(delBtnX - xRad, delBtnY + xRad);
      ctx.stroke();

      ctx.restore();
    }

    // --- 4. TEXT OVERLAY INTERACTIVE HANDLES & RENDERING (Just Like Suits!) ---
    if (textOverlay.enabled && textOverlay.text) {
      const textScale = textOverlay.scale || 1.0;
      const baseFontSize = textOverlay.fontSize || 18;
      const effectiveFontSize = Math.max(10, Math.round((cropRect.width / 600) * baseFontSize * textScale));
      ctx.font = `600 ${effectiveFontSize}px ${textOverlay.fontFamily || 'sans-serif'}`;
      
      let fullText = textOverlay.text;
      if (textOverlay.includeDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        fullText += ` • ${todayStr}`;
      }

      const textMetrics = ctx.measureText(fullText);
      const textW = textMetrics.width + 24 / zoom;
      const textH = effectiveFontSize * 1.4;

      const textXPercent = textOverlay.xPercent !== undefined ? textOverlay.xPercent : 50;
      const textYPercent = textOverlay.yPercent !== undefined ? textOverlay.yPercent : 88;
      const textCenterX = cx + (cropRect.width * textXPercent) / 100;
      const textCenterY = cy + (cropRect.height * textYPercent) / 100;
      const textRotation = textOverlay.rotation || 0;

      ctx.save();
      ctx.translate(textCenterX, textCenterY);
      ctx.rotate((textRotation * Math.PI) / 180);

      // Background strip if enabled
      if (textOverlay.includeBorder) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(-textW / 2, -textH / 2, textW, textH);
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4 / zoom;
      ctx.shadowOffsetX = 1 / zoom;
      ctx.shadowOffsetY = 1 / zoom;

      ctx.fillStyle = textOverlay.color || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fullText, 0, 0);

      // Direct on-canvas interactive transform frame (When activeLayer === 'text' or user clicks text)
      if (activeLayer === 'text') {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Amber Dotted Selection Box
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8 / zoom;
        ctx.setLineDash([5 / zoom, 3 / zoom]);
        ctx.strokeRect(-textW / 2 - 4 / zoom, -textH / 2 - 4 / zoom, textW + 8 / zoom, textH + 8 / zoom);
        ctx.setLineDash([]);

        // 4 Corner Handles
        const hS = 9 / zoom;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2 / zoom;

        const tCorners = [
          { x: -textW / 2 - 4 / zoom, y: -textH / 2 - 4 / zoom },
          { x: textW / 2 + 4 / zoom, y: -textH / 2 - 4 / zoom },
          { x: -textW / 2 - 4 / zoom, y: textH / 2 + 4 / zoom },
          { x: textW / 2 + 4 / zoom, y: textH / 2 + 4 / zoom },
        ];
        tCorners.forEach(pt => {
          ctx.fillRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
          ctx.strokeRect(pt.x - hS / 2, pt.y - hS / 2, hS, hS);
        });

        // Top Rotation Knob
        const stemLen = 22 / zoom;
        ctx.beginPath();
        ctx.moveTo(0, -textH / 2 - 4 / zoom);
        ctx.lineTo(0, -textH / 2 - 4 / zoom - stemLen);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -textH / 2 - 4 / zoom - stemLen, 5.5 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Delete Button [🗑️] at Top-Right
        const delBtnX = textW / 2 + 16 / zoom;
        const delBtnY = -textH / 2 - 14 / zoom;
        ctx.beginPath();
        ctx.arc(delBtnX, delBtnY, 10 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();

        // White X
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8 / zoom;
        const xR = 4 / zoom;
        ctx.beginPath();
        ctx.moveTo(delBtnX - xR, delBtnY - xR); ctx.lineTo(delBtnX + xR, delBtnY + xR);
        ctx.moveTo(delBtnX + xR, delBtnY - xR); ctx.lineTo(delBtnX - xR, delBtnY + xR);
        ctx.stroke();
      }

      ctx.restore();
    }

    // --- DV Lottery Official Alignment Guides Overlay ---
    if (showDVGuides) {
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.beginPath();
      ctx.moveTo(cx + cropRect.width / 2, cy);
      ctx.lineTo(cx + cropRect.width / 2, cy + cropRect.height);
      ctx.stroke();

      const eyeTopY = cy + cropRect.height * 0.31;
      const eyeBottomY = cy + cropRect.height * 0.44;

      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.fillRect(cx, eyeTopY, cropRect.width, eyeBottomY - eyeTopY);

      ctx.strokeStyle = '#22c55e';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx, eyeTopY); ctx.lineTo(cx + cropRect.width, eyeTopY);
      ctx.moveTo(cx, eyeBottomY); ctx.lineTo(cx + cropRect.width, eyeBottomY);
      ctx.stroke();

      const ovalCenterX = cx + cropRect.width / 2;
      const ovalCenterY = cy + cropRect.height * 0.42;
      const ovalRadiusX = cropRect.width * 0.22;
      const ovalRadiusY = cropRect.height * 0.29;

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#22c55e';
      ctx.font = `bold ${Math.max(10, 11 / zoom)}px sans-serif`;
      ctx.fillText(
        language === 'ar' ? 'مستوى العينين (56%-69%)' : 'Eye Zone (56%-69%)',
        cx + 6 / zoom,
        eyeTopY - 4 / zoom
      );
      ctx.restore();
    }

    // --- Biometric Passport Standard Oval Guide (Algeria / EU Schengen / Turkey / UK 70-80%) ---
    if (showBiometricGuides) {
      ctx.save();
      const ovalCenterX = cx + cropRect.width / 2;
      const ovalCenterY = cy + cropRect.height * 0.44;
      const ovalRadiusX = cropRect.width * 0.26;
      const ovalRadiusY = cropRect.height * 0.36;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.beginPath();
      ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([2 / zoom, 2 / zoom]);
      const crownY = ovalCenterY - ovalRadiusY;
      const chinY = ovalCenterY + ovalRadiusY;
      ctx.beginPath();
      ctx.moveTo(cx, crownY); ctx.lineTo(cx + cropRect.width, crownY);
      ctx.moveTo(cx, chinY); ctx.lineTo(cx + cropRect.width, chinY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.max(10, 11 / zoom)}px sans-serif`;
      ctx.fillText(
        language === 'ar' ? 'مستوى قمة الرأس 80%' : 'Crown Top 80%',
        cx + 6 / zoom,
        crownY - 4 / zoom
      );
      ctx.fillText(
        language === 'ar' ? 'مستوى الذقن 70%' : 'Chin Line 70%',
        cx + 6 / zoom,
        chinY + 12 / zoom
      );
      ctx.restore();
    }

    // --- Rule of Thirds Inside Crop ---
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.beginPath();
      ctx.moveTo(cx + cropRect.width / 3, cy);
      ctx.lineTo(cx + cropRect.width / 3, cy + cropRect.height);
      ctx.moveTo(cx + (cropRect.width * 2) / 3, cy);
      ctx.lineTo(cx + (cropRect.width * 2) / 3, cy + cropRect.height);
      ctx.moveTo(cx, cy + cropRect.height / 3);
      ctx.lineTo(cx + cropRect.width, cy + cropRect.height / 3);
      ctx.moveTo(cx, cy + (cropRect.height * 2) / 3);
      ctx.lineTo(cx + cropRect.width, cy + (cropRect.height * 2) / 3);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [
    image,
    zoom,
    pan,
    cropRect,
    suit,
    customSuits,
    showGrid,
    showDVGuides,
    showBiometricGuides,
    language,
    activeLayer,
    subjectTransform,
    bgTransform,
    background,
    textOverlay,
    activeStandard,
  ]);

  const suitWidthToHeight = (width: number, aspect: number) => {
    return width / (aspect || 1.15);
  };

  useEffect(() => {
    renderAll();
  }, [renderAll]);

  useEffect(() => {
    drawDisplayCanvas();
  }, [drawDisplayCanvas]);

  // Window resize observer & Keyboard Shortcuts
  useEffect(() => {
    const handleResize = () => {
      drawDisplayCanvas();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(6.0, z * 1.15));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(z => Math.max(0.1, z * 0.85));
      } else if (e.key === '0') {
        e.preventDefault();
        handleZoomFit();
      } else if (e.key === '1') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey) {
        onRotationChange((rotation + 90) % 360);
      } else if (e.key.toLowerCase() === 'h' && !e.ctrlKey) {
        onFlipHChange(!flipH);
      } else if (e.key.toLowerCase() === 'g' && !e.ctrlKey) {
        setShowBiometricGuides(!showBiometricGuides);
      } else if (e.key.toLowerCase() === 'd' && !e.ctrlKey) {
        setShowDVGuides(!showDVGuides);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (suit.enabled && activeLayer === 'suit') {
          onSuitChange({ ...suit, enabled: false });
        } else if (textOverlay.enabled && activeLayer === 'text' && onTextOverlayChange) {
          onTextOverlayChange({ ...textOverlay, enabled: false });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawDisplayCanvas, rotation, flipH, showBiometricGuides, showDVGuides, suit, activeLayer, textOverlay, onRotationChange, onFlipHChange, onSuitChange, onTextOverlayChange, setShowBiometricGuides, setShowDVGuides]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onDropFile) {
      onDropFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Convert Screen / Mouse coordinates to Image Pixel coordinates
   */
  const screenToImageCoord = (screenX: number, screenY: number) => {
    const displayCanvas = displayCanvasRef.current;
    const offCanvas = offscreenCanvasRef.current;
    if (!displayCanvas || !offCanvas) return { x: 0, y: 0 };

    const rect = displayCanvas.getBoundingClientRect();
    const mouseX = screenX - rect.left;
    const mouseY = screenY - rect.top;

    const centerX = displayCanvas.width / 2 + pan.x;
    const centerY = displayCanvas.height / 2 + pan.y;

    const imgX = (mouseX - centerX) / zoom + offCanvas.width / 2;
    const imgY = (mouseY - centerY) / zoom + offCanvas.height / 2;

    return { x: imgX, y: imgY };
  };

  /**
   * Mouse Down: Priority Hit Testing for Suit, Text, Background, Crop Box, or Viewport Pan
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    if (e.button === 1 || e.altKey || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x: imgX, y: imgY } = screenToImageCoord(e.clientX, e.clientY);
    const offCanvas = offscreenCanvasRef.current;
    if (!offCanvas) return;
    const baseW = offCanvas.width;
    const baseH = offCanvas.height;

    // --- 1. HIT TEST ON TEXT OVERLAY HANDLES & DRAG (When Enabled) ---
    if (textOverlay.enabled && textOverlay.text && onTextOverlayChange) {
      const textScale = textOverlay.scale || 1.0;
      const baseFontSize = textOverlay.fontSize || 18;
      const effectiveFontSize = Math.max(10, Math.round((cropRect.width / 600) * baseFontSize * textScale));
      const offCtx = offCanvas.getContext('2d');
      let textW = 120;
      if (offCtx) {
        offCtx.save();
        offCtx.font = `600 ${effectiveFontSize}px ${textOverlay.fontFamily || 'sans-serif'}`;
        let fullT = textOverlay.text;
        if (textOverlay.includeDate) fullT += ` • 2026-00-00`;
        textW = offCtx.measureText(fullT).width + 24 / zoom;
        offCtx.restore();
      }
      const textH = effectiveFontSize * 1.4;

      const textXPercent = textOverlay.xPercent !== undefined ? textOverlay.xPercent : 50;
      const textYPercent = textOverlay.yPercent !== undefined ? textOverlay.yPercent : 88;
      const textCenterX = cropRect.x + (cropRect.width * textXPercent) / 100;
      const textCenterY = cropRect.y + (cropRect.height * textYPercent) / 100;

      const tRad = (-(textOverlay.rotation || 0) * Math.PI) / 180;
      const cosT = Math.cos(tRad);
      const sinT = Math.sin(tRad);
      const tDx = imgX - textCenterX;
      const tDy = imgY - textCenterY;
      const localTX = tDx * cosT - tDy * sinT;
      const localTY = tDx * sinT + tDy * cosT;

      // Delete Button [🗑️]
      const delBtnX = textW / 2 + 16 / zoom;
      const delBtnY = -textH / 2 - 14 / zoom;
      if (activeLayer === 'text' && Math.hypot(localTX - delBtnX, localTY - delBtnY) <= 14 / zoom) {
        onTextOverlayChange({ ...textOverlay, enabled: false });
        if (onActiveLayerChange) onActiveLayerChange('none');
        return;
      }

      // Rotation Knob
      const stemLen = 22 / zoom;
      const rotY = -textH / 2 - 4 / zoom - stemLen;
      if (activeLayer === 'text' && Math.hypot(localTX, localTY - rotY) <= 14 / zoom) {
        setLayerAction({ layer: 'text', type: 'rotate' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { x: textXPercent, y: textYPercent, scale: textScale, rotation: textOverlay.rotation || 0 },
          origTextState: { ...textOverlay },
          initialDistance: 1,
        });
        return;
      }

      // 4 Corner Scale Handles
      const tCorners = [
        { x: -textW / 2 - 4 / zoom, y: -textH / 2 - 4 / zoom },
        { x: textW / 2 + 4 / zoom, y: -textH / 2 - 4 / zoom },
        { x: -textW / 2 - 4 / zoom, y: textH / 2 + 4 / zoom },
        { x: textW / 2 + 4 / zoom, y: textH / 2 + 4 / zoom },
      ];
      if (activeLayer === 'text') {
        for (const pt of tCorners) {
          if (Math.hypot(localTX - pt.x, localTY - pt.y) <= 14 / zoom) {
            setLayerAction({ layer: 'text', type: 'scale' });
            setLayerActionStart({
              mouseX: imgX,
              mouseY: imgY,
              origTransform: { x: textXPercent, y: textYPercent, scale: textScale, rotation: textOverlay.rotation || 0 },
              origTextState: { ...textOverlay },
              initialDistance: Math.max(10, Math.hypot(localTX, localTY)),
            });
            return;
          }
        }
      }

      // Drag Text Body
      if (Math.abs(localTX) <= textW / 2 + 8 / zoom && Math.abs(localTY) <= textH / 2 + 8 / zoom) {
        if (onActiveLayerChange) onActiveLayerChange('text');
        setLayerAction({ layer: 'text', type: 'move' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { x: textXPercent, y: textYPercent, scale: textScale, rotation: textOverlay.rotation || 0 },
          origTextState: { ...textOverlay },
          initialDistance: 1,
        });
        return;
      }
    }

    // --- 2. HIT TEST ON SUIT HANDLES & DELETE BUTTON ---
    if (suit.enabled) {
      const allSuits = [...SUIT_TEMPLATES, ...customSuits];
      const suitTpl = allSuits.find(s => s.id === suit.templateId) || SUIT_TEMPLATES[0];
      const suitW = baseW * suit.scale;
      const suitH = suitWidthToHeight(suitW, suitTpl.aspectRatio || 1.15);
      const suitCenterX = (baseW * suit.xPercent) / 100;
      const suitCenterY = (baseH * suit.yPercent) / 100;

      const rad = (-suit.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = imgX - suitCenterX;
      const dy = imgY - suitCenterY;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      // Delete Button [🗑️]
      const delBtnX = suitW / 2 + 14 / zoom;
      const delBtnY = -suitH / 2 - 14 / zoom;
      if (Math.hypot(localX - delBtnX, localY - delBtnY) <= 16 / zoom) {
        onSuitChange({ ...suit, enabled: false });
        if (onActiveLayerChange) onActiveLayerChange('none');
        return;
      }

      // Top Rotation Knob
      const rotStemLen = 28 / zoom;
      const rotKnobY = -suitH / 2 - rotStemLen;
      if (Math.hypot(localX, localY - rotKnobY) <= 14 / zoom) {
        if (onActiveLayerChange) onActiveLayerChange('suit');
        setLayerAction({ layer: 'suit', type: 'rotate' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { x: suit.xPercent, y: suit.yPercent, scale: suit.scale, rotation: suit.rotation },
          origSuitState: { ...suit },
          initialDistance: 1,
        });
        return;
      }

      // 4 Corner Scale Handles
      const corners = [
        { x: -suitW / 2, y: -suitH / 2 },
        { x: suitW / 2, y: -suitH / 2 },
        { x: -suitW / 2, y: suitH / 2 },
        { x: suitW / 2, y: suitH / 2 },
      ];
      for (const pt of corners) {
        if (Math.hypot(localX - pt.x, localY - pt.y) <= 14 / zoom) {
          if (onActiveLayerChange) onActiveLayerChange('suit');
          setLayerAction({ layer: 'suit', type: 'scale' });
          setLayerActionStart({
            mouseX: imgX,
            mouseY: imgY,
            origTransform: { x: suit.xPercent, y: suit.yPercent, scale: suit.scale, rotation: suit.rotation },
            origSuitState: { ...suit },
            initialDistance: Math.max(10, Math.hypot(localX, localY)),
          });
          return;
        }
      }

      // Inside Suit Body Drag
      if (Math.abs(localX) <= suitW / 2 && Math.abs(localY) <= suitH / 2) {
        if (onActiveLayerChange) onActiveLayerChange('suit');
        setLayerAction({ layer: 'suit', type: 'move' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { x: suit.xPercent, y: suit.yPercent, scale: suit.scale, rotation: suit.rotation },
          origSuitState: { ...suit },
          initialDistance: 1,
        });
        return;
      }
    }

    // --- 3. HIT TEST ON BACKGROUND LAYER (When Active Layer === 'background') ---
    if (activeLayer === 'background' && onBgTransformChange) {
      const bgCenterX = baseW / 2 + bgTransform.x;
      const bgCenterY = baseH / 2 + bgTransform.y;
      const bgScaleX = bgTransform.scaleX ?? bgTransform.scale ?? 1.0;
      const bgScaleY = bgTransform.scaleY ?? bgTransform.scale ?? 1.0;
      const bgW = baseW * bgScaleX;
      const bgH = baseH * bgScaleY;

      const rad = (-bgTransform.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = imgX - bgCenterX;
      const dy = imgY - bgCenterY;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      // Top Rotation Knob
      const stemLen = 28 / zoom;
      if (Math.hypot(localX, localY - (-bgH / 2 - stemLen)) <= 14 / zoom) {
        setLayerAction({ layer: 'background', type: 'rotate' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { ...bgTransform, scaleX: bgScaleX, scaleY: bgScaleY },
          initialDistance: 1,
        });
        return;
      }

      // 4 Edge Scale Handles (Widen/Narrow & Lengthen/Shorten like Free Crop)
      const edgeHandles = [
        { id: 'tc', x: 0, y: -bgH / 2, actionType: 'scale-y' as const },
        { id: 'bc', x: 0, y: bgH / 2, actionType: 'scale-y' as const },
        { id: 'rc', x: bgW / 2, y: 0, actionType: 'scale-x' as const },
        { id: 'lc', x: -bgW / 2, y: 0, actionType: 'scale-x' as const },
      ];
      for (const pt of edgeHandles) {
        if (Math.hypot(localX - pt.x, localY - pt.y) <= 14 / zoom) {
          setLayerAction({ layer: 'background', type: pt.actionType });
          setLayerActionStart({
            mouseX: imgX,
            mouseY: imgY,
            origTransform: { ...bgTransform, scaleX: bgScaleX, scaleY: bgScaleY },
            initialDistance: pt.actionType === 'scale-x' 
              ? Math.max(10, Math.abs(localX)) 
              : Math.max(10, Math.abs(localY)),
          });
          return;
        }
      }

      // 4 Corner Scale Handles
      const corners = [
        { x: -bgW / 2, y: -bgH / 2 },
        { x: bgW / 2, y: -bgH / 2 },
        { x: -bgW / 2, y: bgH / 2 },
        { x: bgW / 2, y: bgH / 2 },
      ];
      for (const pt of corners) {
        if (Math.hypot(localX - pt.x, localY - pt.y) <= 14 / zoom) {
          setLayerAction({ layer: 'background', type: 'scale' });
          setLayerActionStart({
            mouseX: imgX,
            mouseY: imgY,
            origTransform: { ...bgTransform, scaleX: bgScaleX, scaleY: bgScaleY },
            initialDistance: Math.max(10, Math.hypot(localX, localY)),
          });
          return;
        }
      }

      // Drag Background Body
      if (Math.abs(localX) <= bgW / 2 && Math.abs(localY) <= bgH / 2) {
        setLayerAction({ layer: 'background', type: 'move' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { ...bgTransform, scaleX: bgScaleX, scaleY: bgScaleY },
          initialDistance: 1,
        });
        return;
      }
    }

    // --- 4. HIT TEST ON SUBJECT LAYER (When Active Layer === 'subject') ---
    if (activeLayer === 'subject' && onSubjectTransformChange) {
      const subCenterX = baseW / 2 + subjectTransform.x;
      const subCenterY = baseH / 2 + subjectTransform.y;
      const subW = baseW * subjectTransform.scale * 0.9;
      const subH = baseH * subjectTransform.scale * 0.9;

      const rad = (-subjectTransform.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = imgX - subCenterX;
      const dy = imgY - subCenterY;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      const stemLen = 28 / zoom;
      if (Math.hypot(localX, localY - (-subH / 2 - stemLen)) <= 14 / zoom) {
        setLayerAction({ layer: 'subject', type: 'rotate' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { ...subjectTransform },
          initialDistance: 1,
        });
        return;
      }

      const corners = [
        { x: -subW / 2, y: -subH / 2 },
        { x: subW / 2, y: -subH / 2 },
        { x: -subW / 2, y: subH / 2 },
        { x: subW / 2, y: subH / 2 },
      ];
      for (const pt of corners) {
        if (Math.hypot(localX - pt.x, localY - pt.y) <= 14 / zoom) {
          setLayerAction({ layer: 'subject', type: 'scale' });
          setLayerActionStart({
            mouseX: imgX,
            mouseY: imgY,
            origTransform: { ...subjectTransform },
            initialDistance: Math.max(10, Math.hypot(localX, localY)),
          });
          return;
        }
      }

      if (Math.abs(localX) <= subW / 2 && Math.abs(localY) <= subH / 2) {
        setLayerAction({ layer: 'subject', type: 'move' });
        setLayerActionStart({
          mouseX: imgX,
          mouseY: imgY,
          origTransform: { ...subjectTransform },
          initialDistance: 1,
        });
        return;
      }
    }

    // --- 5. CROP BOX HIT TEST (8 Handles + Move) ---
    const handleHitDist = 14 / zoom;
    const cx = cropRect.x;
    const cy = cropRect.y;
    const cw = cropRect.width;
    const ch = cropRect.height;

    const handles: { [key: string]: { x: number; y: number } } = {
      tl: { x: cx, y: cy },
      tr: { x: cx + cw, y: cy },
      bl: { x: cx, y: cy + ch },
      br: { x: cx + cw, y: cy + ch },
      tc: { x: cx + cw / 2, y: cy },
      bc: { x: cx + cw / 2, y: cy + ch },
      lc: { x: cx, y: cy + ch / 2 },
      rc: { x: cx + cw, y: cy + ch / 2 },
    };

    for (const [key, pt] of Object.entries(handles)) {
      if (Math.hypot(imgX - pt.x, imgY - pt.y) <= handleHitDist) {
        setDragHandle(key);
        setDragStartPos({ x: imgX, y: imgY });
        setInitialCropRect({ ...cropRect });
        return;
      }
    }

    // Inside crop box drag
    if (imgX >= cx && imgX <= cx + cw && imgY >= cy && imgY <= cy + ch) {
      // If user clicked inside crop box and activeLayer is none or crop, move crop box
      if (activeLayer === 'crop' || activeLayer === 'none') {
        setDragHandle('move');
        setDragStartPos({ x: imgX, y: imgY });
        setInitialCropRect({ ...cropRect });
        return;
      }
    }

    // Default: Pan viewport
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  /**
   * Mouse Move: Direct Transform for Suit, Text, Background, Subject, or Crop Resizing
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const { x: imgX, y: imgY } = screenToImageCoord(e.clientX, e.clientY);
    const offCanvas = offscreenCanvasRef.current;
    if (!offCanvas) return;
    const baseW = offCanvas.width;
    const baseH = offCanvas.height;

    // --- 1. DIRECT LAYER TRANSFORM ACTION HANDLING ---
    if (layerAction) {
      const { layer, type } = layerAction;

      // A. Text Overlay Layer Action (Move, Scale, Rotate)
      if (layer === 'text' && onTextOverlayChange && textOverlay.enabled) {
        const textCenterX = cropRect.x + (cropRect.width * (layerActionStart.origTransform.x)) / 100;
        const textCenterY = cropRect.y + (cropRect.height * (layerActionStart.origTransform.y)) / 100;

        if (type === 'move') {
          const dxPx = imgX - layerActionStart.mouseX;
          const dyPx = imgY - layerActionStart.mouseY;
          const newXP = Math.max(0, Math.min(100, layerActionStart.origTransform.x + (dxPx / cropRect.width) * 100));
          const newYP = Math.max(0, Math.min(100, layerActionStart.origTransform.y + (dyPx / cropRect.height) * 100));
          onTextOverlayChange({
            ...textOverlay,
            xPercent: Number(newXP.toFixed(1)),
            yPercent: Number(newYP.toFixed(1)),
          });
        } else if (type === 'scale') {
          const currentDist = Math.hypot(imgX - textCenterX, imgY - textCenterY);
          const ratio = currentDist / layerActionStart.initialDistance;
          const newScale = Math.max(0.3, Math.min(3.5, layerActionStart.origTransform.scale * ratio));
          onTextOverlayChange({
            ...textOverlay,
            scale: Number(newScale.toFixed(2)),
          });
        } else if (type === 'rotate') {
          const angleRad = Math.atan2(imgY - textCenterY, imgX - textCenterX);
          let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
          while (angleDeg > 180) angleDeg -= 360;
          while (angleDeg < -180) angleDeg += 360;
          onTextOverlayChange({
            ...textOverlay,
            rotation: angleDeg,
          });
        }
        return;
      }

      // B. Suit Layer Action (Move, Scale, Rotate)
      if (layer === 'suit' && suit.enabled) {
        const suitCenterX = (baseW * layerActionStart.origTransform.x) / 100;
        const suitCenterY = (baseH * layerActionStart.origTransform.y) / 100;

        if (type === 'move') {
          const dxPx = imgX - layerActionStart.mouseX;
          const dyPx = imgY - layerActionStart.mouseY;
          const newX = Math.max(5, Math.min(95, layerActionStart.origTransform.x + (dxPx / baseW) * 100));
          const newY = Math.max(10, Math.min(110, layerActionStart.origTransform.y + (dyPx / baseH) * 100));
          onSuitChange({
            ...suit,
            xPercent: newX,
            yPercent: newY,
          });
        } else if (type === 'scale') {
          const currentDist = Math.hypot(imgX - suitCenterX, imgY - suitCenterY);
          const ratio = currentDist / layerActionStart.initialDistance;
          const newScale = Math.max(0.2, Math.min(2.5, layerActionStart.origTransform.scale * ratio));
          onSuitChange({
            ...suit,
            scale: Number(newScale.toFixed(3)),
          });
        } else if (type === 'rotate') {
          const angleRad = Math.atan2(imgY - suitCenterY, imgX - suitCenterX);
          let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
          while (angleDeg > 180) angleDeg -= 360;
          while (angleDeg < -180) angleDeg += 360;
          onSuitChange({
            ...suit,
            rotation: Math.max(-60, Math.min(60, angleDeg)),
          });
        }
        return;
      }

      // C. Background Layer Action (Move, Scale, Scale-X, Scale-Y, Rotate)
      if (layer === 'background' && onBgTransformChange) {
        const bgCenterX = baseW / 2 + layerActionStart.origTransform.x;
        const bgCenterY = baseH / 2 + layerActionStart.origTransform.y;
        const rad = (-layerActionStart.origTransform.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = imgX - bgCenterX;
        const dy = imgY - bgCenterY;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        if (type === 'move') {
          const dxPx = imgX - layerActionStart.mouseX;
          const dyPx = imgY - layerActionStart.mouseY;
          onBgTransformChange({
            ...bgTransform,
            x: Math.round(layerActionStart.origTransform.x + dxPx),
            y: Math.round(layerActionStart.origTransform.y + dyPx),
          });
        } else if (type === 'scale-x') {
          // Stretch width horizontally ("تعريض / تضييق")
          const currentDistX = Math.abs(localX);
          const ratio = currentDistX / Math.max(1, layerActionStart.initialDistance);
          const origScaleX = layerActionStart.origTransform.scaleX ?? layerActionStart.origTransform.scale ?? 1.0;
          const newScaleX = Math.max(0.1, Math.min(5.0, origScaleX * ratio));
          onBgTransformChange({
            ...bgTransform,
            scaleX: Number(newScaleX.toFixed(3)),
          });
        } else if (type === 'scale-y') {
          // Stretch height vertically ("تطويل / تقصير")
          const currentDistY = Math.abs(localY);
          const ratio = currentDistY / Math.max(1, layerActionStart.initialDistance);
          const origScaleY = layerActionStart.origTransform.scaleY ?? layerActionStart.origTransform.scale ?? 1.0;
          const newScaleY = Math.max(0.1, Math.min(5.0, origScaleY * ratio));
          onBgTransformChange({
            ...bgTransform,
            scaleY: Number(newScaleY.toFixed(3)),
          });
        } else if (type === 'scale') {
          // Proportional Corner Scale
          const currentDist = Math.hypot(imgX - bgCenterX, imgY - bgCenterY);
          const ratio = currentDist / Math.max(1, layerActionStart.initialDistance);
          const origScale = layerActionStart.origTransform.scale || 1.0;
          const origScaleX = layerActionStart.origTransform.scaleX ?? origScale;
          const origScaleY = layerActionStart.origTransform.scaleY ?? origScale;
          const newScale = Math.max(0.1, Math.min(5.0, origScale * ratio));
          const newScaleX = Math.max(0.1, Math.min(5.0, origScaleX * ratio));
          const newScaleY = Math.max(0.1, Math.min(5.0, origScaleY * ratio));
          onBgTransformChange({
            ...bgTransform,
            scale: Number(newScale.toFixed(3)),
            scaleX: Number(newScaleX.toFixed(3)),
            scaleY: Number(newScaleY.toFixed(3)),
          });
        } else if (type === 'rotate') {
          const angleRad = Math.atan2(imgY - bgCenterY, imgX - bgCenterX);
          let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
          while (angleDeg > 180) angleDeg -= 360;
          while (angleDeg < -180) angleDeg += 360;
          onBgTransformChange({
            ...bgTransform,
            rotation: Math.max(-180, Math.min(180, angleDeg)),
          });
        }
        return;
      }

      // D. Subject Layer Action (Move, Scale, Rotate)
      if (layer === 'subject' && onSubjectTransformChange) {
        const subCenterX = baseW / 2 + layerActionStart.origTransform.x;
        const subCenterY = baseH / 2 + layerActionStart.origTransform.y;

        if (type === 'move') {
          const dxPx = imgX - layerActionStart.mouseX;
          const dyPx = imgY - layerActionStart.mouseY;
          onSubjectTransformChange({
            ...subjectTransform,
            x: Math.round(layerActionStart.origTransform.x + dxPx),
            y: Math.round(layerActionStart.origTransform.y + dyPx),
          });
        } else if (type === 'scale') {
          const currentDist = Math.hypot(imgX - subCenterX, imgY - subCenterY);
          const ratio = currentDist / layerActionStart.initialDistance;
          const newScale = Math.max(0.3, Math.min(3.0, layerActionStart.origTransform.scale * ratio));
          onSubjectTransformChange({
            ...subjectTransform,
            scale: Number(newScale.toFixed(3)),
          });
        } else if (type === 'rotate') {
          const angleRad = Math.atan2(imgY - subCenterY, imgX - subCenterX);
          let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
          while (angleDeg > 180) angleDeg -= 360;
          while (angleDeg < -180) angleDeg += 360;
          onSubjectTransformChange({
            ...subjectTransform,
            rotation: Math.max(-90, Math.min(90, angleDeg)),
          });
        }
        return;
      }
    }

    // --- 2. CROP BOX HANDLING (Free Aspect Ratio & Standard Constrained) ---
    if (dragHandle) {
      const dx = imgX - dragStartPos.x;
      const dy = imgY - dragStartPos.y;
      const targetRatio = activeStandard.aspectRatio; // 0 = Free Crop!
      const isFreeCrop = targetRatio <= 0;

      let newCrop = { ...initialCropRect };

      if (dragHandle === 'move') {
        newCrop.x = Math.max(0, Math.min(baseW - newCrop.width, initialCropRect.x + dx));
        newCrop.y = Math.max(0, Math.min(baseH - newCrop.height, initialCropRect.y + dy));
      } else if (isFreeCrop) {
        if (dragHandle === 'br') {
          newCrop.width = Math.max(40, Math.min(baseW - newCrop.x, initialCropRect.width + dx));
          newCrop.height = Math.max(40, Math.min(baseH - newCrop.y, initialCropRect.height + dy));
        } else if (dragHandle === 'bl') {
          const right = initialCropRect.x + initialCropRect.width;
          const newX = Math.max(0, Math.min(right - 40, initialCropRect.x + dx));
          newCrop.x = newX;
          newCrop.width = right - newX;
          newCrop.height = Math.max(40, Math.min(baseH - newCrop.y, initialCropRect.height + dy));
        } else if (dragHandle === 'tr') {
          const bottom = initialCropRect.y + initialCropRect.height;
          const newY = Math.max(0, Math.min(bottom - 40, initialCropRect.y + dy));
          newCrop.y = newY;
          newCrop.height = bottom - newY;
          newCrop.width = Math.max(40, Math.min(baseW - newCrop.x, initialCropRect.width + dx));
        } else if (dragHandle === 'tl') {
          const right = initialCropRect.x + initialCropRect.width;
          const bottom = initialCropRect.y + initialCropRect.height;
          const newX = Math.max(0, Math.min(right - 40, initialCropRect.x + dx));
          const newY = Math.max(0, Math.min(bottom - 40, initialCropRect.y + dy));
          newCrop.x = newX;
          newCrop.y = newY;
          newCrop.width = right - newX;
          newCrop.height = bottom - newY;
        } else if (dragHandle === 'tc') {
          const bottom = initialCropRect.y + initialCropRect.height;
          const newY = Math.max(0, Math.min(bottom - 40, initialCropRect.y + dy));
          newCrop.y = newY;
          newCrop.height = bottom - newY;
        } else if (dragHandle === 'bc') {
          newCrop.height = Math.max(40, Math.min(baseH - newCrop.y, initialCropRect.height + dy));
        } else if (dragHandle === 'lc') {
          const right = initialCropRect.x + initialCropRect.width;
          const newX = Math.max(0, Math.min(right - 40, initialCropRect.x + dx));
          newCrop.x = newX;
          newCrop.width = right - newX;
        } else if (dragHandle === 'rc') {
          newCrop.width = Math.max(40, Math.min(baseW - newCrop.x, initialCropRect.width + dx));
        }
      } else {
        if (dragHandle === 'br') {
          let newW = Math.max(100, initialCropRect.width + dx);
          let newH = newW / targetRatio;
          if (newCrop.x + newW > baseW) {
            newW = baseW - newCrop.x;
            newH = newW / targetRatio;
          }
          if (newCrop.y + newH > baseH) {
            newH = baseH - newCrop.y;
            newW = newH * targetRatio;
          }
          newCrop.width = newW;
          newCrop.height = newH;
        } else if (dragHandle === 'bl') {
          let newW = Math.max(100, initialCropRect.width - dx);
          let newH = newW / targetRatio;
          const newX = initialCropRect.x + (initialCropRect.width - newW);
          if (newX >= 0 && newCrop.y + newH <= baseH) {
            newCrop.x = newX;
            newCrop.width = newW;
            newCrop.height = newH;
          }
        } else if (dragHandle === 'tr') {
          let newW = Math.max(100, initialCropRect.width + dx);
          let newH = newW / targetRatio;
          const newY = initialCropRect.y + (initialCropRect.height - newH);
          if (newY >= 0 && newCrop.x + newW <= baseW) {
            newCrop.y = newY;
            newCrop.width = newW;
            newCrop.height = newH;
          }
        } else if (dragHandle === 'tl') {
          let newW = Math.max(100, initialCropRect.width - dx);
          let newH = newW / targetRatio;
          const newX = initialCropRect.x + (initialCropRect.width - newW);
          const newY = initialCropRect.y + (initialCropRect.height - newH);
          if (newX >= 0 && newY >= 0) {
            newCrop.x = newX;
            newCrop.y = newY;
            newCrop.width = newW;
            newCrop.height = newH;
          }
        }
      }

      onCropChange(newCrop);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragHandle(null);
    setLayerAction(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom(prev => Math.max(0.1, Math.min(6.0, prev * factor)));
  };

  const handleZoomFit = () => {
    if (image && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 60;
      const scaleX = (rect.width - padding) / image.width;
      const scaleY = (rect.height - padding) / image.height;
      setZoom(Math.min(1.5, Math.max(0.2, Math.min(scaleX, scaleY))));
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <div 
      ref={containerRef} 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 h-full w-full bg-zinc-950 checkerboard-pattern overflow-hidden flex items-center justify-center select-none"
    >
      {/* Top Floating Multi-Layer Switcher Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xl z-30">
        <span className="text-[11px] font-semibold text-zinc-400 px-1.5 hidden sm:inline">
          {language === 'ar' ? 'التحكم بالطبقات:' : 'Active Layer:'}
        </span>

        {/* Crop Box Selector */}
        <button
          onClick={() => onActiveLayerChange && onActiveLayerChange(activeLayer === 'crop' ? 'none' : 'crop')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeLayer === 'crop' || activeLayer === 'none'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
          }`}
          title={language === 'ar' ? 'تعديل إطار القص' : 'Crop Frame'}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'إطار القص' : 'Crop'}</span>
        </button>

        {/* Background Layer Selector */}
        <button
          onClick={() => onActiveLayerChange && onActiveLayerChange(activeLayer === 'background' ? 'none' : 'background')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeLayer === 'background'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
          }`}
          title={language === 'ar' ? 'تحريك وتكبير/تصغير الخلفية' : 'Background Layer'}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'الخلفية' : 'Backdrop'}</span>
        </button>

        {/* Suit Layer Selector */}
        {suit.enabled && (
          <button
            onClick={() => onActiveLayerChange && onActiveLayerChange(activeLayer === 'suit' ? 'none' : 'suit')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeLayer === 'suit'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
            }`}
            title={language === 'ar' ? 'تحريك وتكبير/تصغير البدلة' : 'Suit Layer'}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'البدلة' : 'Suit'}</span>
          </button>
        )}

        {/* Text Layer Selector */}
        {textOverlay.enabled && (
          <button
            onClick={() => onActiveLayerChange && onActiveLayerChange(activeLayer === 'text' ? 'none' : 'text')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeLayer === 'text'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
            }`}
            title={language === 'ar' ? 'تحريك وتكبير/تصغير النص' : 'Text Layer'}
          >
            <Type className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'النص' : 'Text'}</span>
          </button>
        )}

        {/* Subject Layer Selector */}
        <button
          onClick={() => onActiveLayerChange && onActiveLayerChange(activeLayer === 'subject' ? 'none' : 'subject')}
          className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
            activeLayer === 'subject'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
          }`}
          title={language === 'ar' ? 'تحريك وتكبير الشخص' : 'Subject Layer'}
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{language === 'ar' ? 'الشخص' : 'Subject'}</span>
        </button>

        {/* Reset Layer Transforms */}
        {(bgTransform.x !== 0 || bgTransform.y !== 0 || bgTransform.scale !== 1 || (bgTransform.scaleX !== undefined && bgTransform.scaleX !== 1) || (bgTransform.scaleY !== undefined && bgTransform.scaleY !== 1) || subjectTransform.x !== 0 || subjectTransform.scale !== 1 || (textOverlay.scale && textOverlay.scale !== 1)) && (
          <button
            onClick={() => {
              if (onSubjectTransformChange) onSubjectTransformChange({ x: 0, y: 0, scale: 1, rotation: 0 });
              if (onBgTransformChange) onBgTransformChange({ x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0 });
              if (onTextOverlayChange && textOverlay.enabled) {
                onTextOverlayChange({ ...textOverlay, xPercent: 50, yPercent: 88, scale: 1.0, rotation: 0 });
              }
            }}
            className="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            title={language === 'ar' ? 'إعادة ضبط أبعاد ومواضع الطبقات' : 'Reset Transforms'}
          >
            <ResetIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Drag & Drop Visual Indicator */}
      {isDragOverFile && (
        <div className="absolute inset-0 z-40 bg-cyan-950/80 backdrop-blur-sm border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none">
          <div className="p-4 rounded-full bg-cyan-500/20 text-cyan-400 mb-3 animate-pulse">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-base font-bold text-white">
            {language === 'ar' ? 'أفلت الصورة هنا لتحميلها مباشرة' : 'Drop photo here to load immediately'}
          </p>
        </div>
      )}

      {/* Interactive Canvas */}
      <canvas
        ref={displayCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full block ${
          isPanning 
            ? 'cursor-grabbing' 
            : layerAction?.type === 'rotate'
              ? 'cursor-crosshair'
              : layerAction?.type === 'scale'
                ? 'cursor-nwse-resize'
                : layerAction?.type === 'scale-x'
                  ? 'cursor-ew-resize'
                  : layerAction?.type === 'scale-y'
                    ? 'cursor-ns-resize'
                    : layerAction?.type === 'move'
                      ? 'cursor-grab'
                      : dragHandle 
                        ? 'cursor-nwse-resize' 
                        : 'cursor-default'
        }`}
      />

      {/* Floating Viewport Toolbars */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xl text-zinc-300 z-20">
        <button
          onClick={() => setZoom(z => Math.max(0.1, z * 0.85))}
          className="p-1 rounded-full hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          title={t.zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono w-12 text-center text-zinc-300">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(z => Math.min(6.0, z * 1.15))}
          className="p-1 rounded-full hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          title={t.zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomFit}
          className="p-1 rounded-full hover:bg-zinc-800 hover:text-white transition cursor-pointer text-xs"
          title={t.zoomFit}
        >
          <Maximize className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-zinc-700 mx-1"></div>

        <button
          onClick={() => onRotationChange((rotation + 270) % 360)}
          className="p-1 rounded-full hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          title={t.rotateLeft}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRotationChange((rotation + 90) % 360)}
          className="p-1 rounded-full hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          title={t.rotateRight}
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFlipHChange(!flipH)}
          className={`p-1 rounded-full transition cursor-pointer ${
            flipH ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-zinc-800 hover:text-white'
          }`}
          title={t.flipHorizontal}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={() => onFlipVChange(!flipV)}
          className={`p-1 rounded-full transition cursor-pointer ${
            flipV ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-zinc-800 hover:text-white'
          }`}
          title={t.flipVertical}
        >
          <FlipVertical className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-zinc-700 mx-1"></div>

        <button
          onClick={() => setShowDVGuides(!showDVGuides)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition cursor-pointer ${
            showDVGuides 
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-semibold' 
              : 'hover:bg-zinc-800 hover:text-white text-zinc-400'
          }`}
          title={t.dvOverlayToggle}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>DV 2x2"</span>
        </button>

        <button
          onClick={() => setShowBiometricGuides(!showBiometricGuides)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition cursor-pointer ${
            showBiometricGuides 
              ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 font-semibold' 
              : 'hover:bg-zinc-800 hover:text-white text-zinc-400'
          }`}
          title={t.guidesToggle}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>35x45</span>
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1 rounded-full transition cursor-pointer ${
            showGrid ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-zinc-800 hover:text-white text-zinc-400'
          }`}
          title={t.ruleOfThirdsToggle}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        {/* Quick Delete Active Layer Button */}
        {(suit.enabled && activeLayer === 'suit') && (
          <>
            <div className="h-4 w-px bg-zinc-700 mx-1"></div>
            <button
              onClick={() => {
                onSuitChange({ ...suit, enabled: false });
                if (onActiveLayerChange) onActiveLayerChange('none');
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 transition cursor-pointer"
              title={language === 'ar' ? 'حذف اللباس' : 'Delete Suit'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'حذف البدلة' : 'Remove Suit'}</span>
            </button>
          </>
        )}

        {(textOverlay.enabled && activeLayer === 'text' && onTextOverlayChange) && (
          <>
            <div className="h-4 w-px bg-zinc-700 mx-1"></div>
            <button
              onClick={() => {
                onTextOverlayChange({ ...textOverlay, enabled: false });
                if (onActiveLayerChange) onActiveLayerChange('none');
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 transition cursor-pointer"
              title={language === 'ar' ? 'حذف النص' : 'Delete Text'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'حذف النص' : 'Remove Text'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
