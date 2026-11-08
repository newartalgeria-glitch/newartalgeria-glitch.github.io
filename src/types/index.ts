export type Language = 'en' | 'ar';

export interface PassportStandard {
  id: string;
  nameEn: string;
  nameAr: string;
  country: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number; // width / height (0 = free / custom)
  defaultPxWidth: number;
  defaultPxHeight: number;
  headMinPercent: number; // e.g. 70%
  headMaxPercent: number; // e.g. 80%
  bgRequirementEn: string;
  bgRequirementAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface PaperSize {
  id: string;
  nameEn: string;
  nameAr: string;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
}

export interface GridPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  paperId: string;
  cols: number;
  rows: number;
  count: number;
}

export interface SuitTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  category: 'men-suit' | 'men-tuxedo' | 'men-shirt' | 'women-blazer';
  svgDataUri: string;
  aspectRatio: number; // width / height
}

export interface SuitLayerState {
  enabled: boolean;
  templateId: string;
  xPercent: number; // center X as % of canvas (default 50%)
  yPercent: number; // center Y as % of canvas (default 75%)
  scale: number; // scale relative to photo width (e.g. 0.8)
  rotation: number; // degrees
  flipH: boolean;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
}

export interface LayerTransform {
  x: number; // px offset
  y: number; // px offset
  scale: number; // scale multiplier, default 1.0
  scaleX?: number; // width stretch multiplier (تعريض)
  scaleY?: number; // height stretch multiplier (تطويل)
  rotation: number; // degrees, default 0
}

export type ActiveLayerType = 'subject' | 'background' | 'suit' | 'text' | 'crop' | 'none';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  temperature: number; // -100 (cool) to 100 (warm)
  tint: number; // -100 (green) to 100 (magenta)
  exposure: number; // -100 to 100
  sharpness: number; // 0 to 100
  straighten: number; // -15 to +15 fine angle degrees
  skinSmoothing: number; // 0 to 100 skin softening airbrush
}

export interface ChromaKeySettings {
  enabled: boolean;
  autoRemoved: boolean;
}

export type BackgroundType = 'transparent' | 'solid' | 'preset' | 'custom';

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  presetId: string;
  customImageDataUri: string | null;
}

export interface TextOverlaySettings {
  enabled: boolean;
  text: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-center' | 'custom';
  fontSize: number; // px relative to 600px canvas
  color: string;
  fontFamily: string;
  includeDate: boolean;
  includeBorder: boolean;
  xPercent?: number; // center X as % of crop frame (default 50%)
  yPercent?: number; // center Y as % of crop frame (default 90%)
  scale?: number; // direct on-canvas scale multiplier, default 1.0
  rotation?: number; // degrees, default 0
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DVLotteryValidation {
  isSquare: boolean;
  actualWidth: number;
  actualHeight: number;
  resolutionValid: boolean; // 600x600 to 1200x1200
  aspectRatioValid: boolean; // exactly 1:1
  fileSizeKB: number;
  fileSizeValid: boolean; // <= 240 KB
  headHeightPercent: number; // 50% to 69%
  headHeightValid: boolean;
  eyeLevelPercent: number; // 56% to 69% from bottom
  eyeLevelValid: boolean;
  colorDepthValid: boolean;
  overallScore: number; // 0 to 100
  overallPass: boolean;
  issues: {
    type: 'error' | 'warning' | 'success';
    textEn: string;
    textAr: string;
  }[];
}

export interface PrintSettings {
  paperSizeId: string;
  gridCount: number; // 2, 4, 6, 8
  orientation: 'portrait' | 'landscape';
  showCutLines: boolean;
  cutLineStyle: 'solid' | 'dashed' | 'crop-marks';
  cutLineColor: string;
  photoBorder: boolean;
  borderColor: string;
  borderWidthMm: number;
  spacingMm: number;
  marginMm: number;
  showStudioInfo: boolean;
  studioInfoText: string;
}
