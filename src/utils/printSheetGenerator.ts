import jsPDF from 'jspdf';
import { PAPER_SIZES } from '../constants/standards';
import type { PrintSettings } from '../types';

export interface GridRenderOptions {
  photoCanvas: HTMLCanvasElement;
  photoWidthMm: number;
  photoHeightMm: number;
  settings: PrintSettings;
  dpi?: number; // default 300
}

/**
 * Validates and normalizes photo dimensions in millimeters
 */
const getValidDimensionsMm = (
  photoCanvas: HTMLCanvasElement,
  photoWidthMm?: number,
  photoHeightMm?: number
): { wMm: number; hMm: number } => {
  let w = photoWidthMm && photoWidthMm > 0 ? photoWidthMm : 0;
  let h = photoHeightMm && photoHeightMm > 0 ? photoHeightMm : 0;

  if (w <= 0 || h <= 0) {
    const canvasAspect = photoCanvas.width > 0 && photoCanvas.height > 0
      ? photoCanvas.width / photoCanvas.height
      : 35 / 45;
    w = 35;
    h = 35 / canvasAspect;
  }
  return { wMm: w, hMm: h };
};

/**
 * Calculates optimal grid layout and scaling so that ALL requested photos (2, 4, 6, 8)
 * are guaranteed to fit 100% inside the sheet printable area without clipping.
 * Supports 0 mm seamless touching spacing ("صور ملتصقة تماماً").
 */
const calculateOptimalGrid = (
  sheetWidthPx: number,
  sheetHeightPx: number,
  photoWidthPx: number,
  photoHeightPx: number,
  spacingPx: number,
  marginPx: number,
  gridCount: number
) => {
  const availW = Math.max(10, sheetWidthPx - 2 * marginPx);
  const availH = Math.max(10, sheetHeightPx - 2 * marginPx);

  // Candidate grid dimensions [cols, rows]
  let candidateLayouts: [number, number][] = [];

  if (gridCount === 2) {
    candidateLayouts = sheetWidthPx >= sheetHeightPx ? [[2, 1], [1, 2]] : [[1, 2], [2, 1]];
  } else if (gridCount === 4) {
    candidateLayouts = [[2, 2]];
  } else if (gridCount === 6) {
    candidateLayouts = sheetWidthPx >= sheetHeightPx ? [[3, 2], [2, 3]] : [[2, 3], [3, 2]];
  } else if (gridCount === 8) {
    candidateLayouts = sheetWidthPx >= sheetHeightPx ? [[4, 2], [2, 4]] : [[2, 4], [4, 2]];
  } else {
    candidateLayouts = [[2, 2]];
  }

  let bestLayout = candidateLayouts[0];
  let bestScale = 0;
  let bestPhotoW = photoWidthPx;
  let bestPhotoH = photoHeightPx;
  let bestSpacing = Math.max(0, spacingPx);

  const exactSpacing = Math.max(0, spacingPx);

  for (const [cols, rows] of candidateLayouts) {
    const neededW = cols * photoWidthPx + (cols - 1) * exactSpacing;
    const neededH = rows * photoHeightPx + (rows - 1) * exactSpacing;

    const scaleW = availW / neededW;
    const scaleH = availH / neededH;
    const scale = Math.min(1.0, scaleW, scaleH);

    if (scale > bestScale) {
      bestScale = scale;
      bestLayout = [cols, rows];
      bestPhotoW = Math.round(photoWidthPx * scale);
      bestPhotoH = Math.round(photoHeightPx * scale);
      bestSpacing = exactSpacing === 0 ? 0 : Math.round(exactSpacing * scale);
    }
  }

  const [cols, rows] = bestLayout;
  const totalGridW = cols * bestPhotoW + (cols - 1) * bestSpacing;
  const totalGridH = rows * bestPhotoH + (rows - 1) * bestSpacing;

  const startX = Math.round((sheetWidthPx - totalGridW) / 2);
  const startY = Math.round((sheetHeightPx - totalGridH) / 2);

  return {
    cols,
    rows,
    photoW: bestPhotoW,
    photoH: bestPhotoH,
    spacing: bestSpacing,
    startX: Math.max(0, startX),
    startY: Math.max(0, startY),
  };
};

/**
 * Renders a full printable sheet at 300 DPI to an HTMLCanvasElement
 */
export const renderPrintSheetCanvas = ({
  photoCanvas,
  photoWidthMm,
  photoHeightMm,
  settings,
  dpi = 300,
}: GridRenderOptions): HTMLCanvasElement => {
  const paper = PAPER_SIZES.find(p => p.id === settings.paperSizeId) || PAPER_SIZES[0];

  // MM to pixels at target DPI
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);

  let paperWidthMm = paper.widthMm;
  let paperHeightMm = paper.heightMm;

  if (settings.orientation === 'landscape') {
    const temp = paperWidthMm;
    paperWidthMm = paperHeightMm;
    paperHeightMm = temp;
  }

  const sheetWidthPx = mmToPx(paperWidthMm);
  const sheetHeightPx = mmToPx(paperHeightMm);

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = sheetWidthPx;
  sheetCanvas.height = sheetHeightPx;
  const ctx = sheetCanvas.getContext('2d');
  if (!ctx) return sheetCanvas;

  // Background white paper sheet
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

  // Normalize photo dimensions
  const { wMm, hMm } = getValidDimensionsMm(photoCanvas, photoWidthMm, photoHeightMm);
  const rawPhotoWPx = mmToPx(wMm);
  const rawPhotoHPx = mmToPx(hMm);
  
  // Use ?? instead of || so that 0 mm is preserved as 0 px!
  const spacingMmValue = settings.spacingMm ?? 0;
  const rawSpacingPx = spacingMmValue <= 0.05 ? 0 : mmToPx(spacingMmValue);
  const rawMarginPx = mmToPx(settings.marginMm ?? 5);

  // Compute optimal grid layout guaranteeing all photos (including 8) fit 100%
  const grid = calculateOptimalGrid(
    sheetWidthPx,
    sheetHeightPx,
    rawPhotoWPx,
    rawPhotoHPx,
    rawSpacingPx,
    rawMarginPx,
    settings.gridCount
  );

  let placed = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (placed >= settings.gridCount) break;

      const px = grid.startX + c * (grid.photoW + grid.spacing);
      const py = grid.startY + r * (grid.photoH + grid.spacing);

      // Draw photo
      ctx.drawImage(photoCanvas, px, py, grid.photoW, grid.photoH);

      // Optional border (only when photoBorder is true and spacing > 0)
      if (settings.photoBorder && grid.spacing > 0) {
        ctx.strokeStyle = settings.borderColor || '#E2E8F0';
        ctx.lineWidth = Math.max(1, mmToPx(settings.borderWidthMm || 0.3));
        ctx.strokeRect(px, py, grid.photoW, grid.photoH);
      }

      // Cut lines / guides
      if (settings.showCutLines) {
        ctx.save();
        ctx.strokeStyle = settings.cutLineColor || '#94A3B8';
        ctx.lineWidth = Math.max(1, Math.round(dpi / 300));

        if (settings.cutLineStyle === 'dashed') {
          ctx.setLineDash([mmToPx(2), mmToPx(2)]);
          ctx.strokeRect(px, py, grid.photoW, grid.photoH);
        } else if (settings.cutLineStyle === 'solid') {
          ctx.setLineDash([]);
          ctx.strokeRect(px, py, grid.photoW, grid.photoH);
        } else if (settings.cutLineStyle === 'crop-marks') {
          const markLen = mmToPx(2.5);
          const gap = mmToPx(0.8);
          ctx.setLineDash([]);

          // Top-left
          ctx.beginPath();
          ctx.moveTo(px - gap, py); ctx.lineTo(px - gap - markLen, py);
          ctx.moveTo(px, py - gap); ctx.lineTo(px, py - gap - markLen);
          // Top-right
          ctx.moveTo(px + grid.photoW + gap, py); ctx.lineTo(px + grid.photoW + gap + markLen, py);
          ctx.moveTo(px + grid.photoW, py - gap); ctx.lineTo(px + grid.photoW, py - gap - markLen);
          // Bottom-left
          ctx.moveTo(px - gap, py + grid.photoH); ctx.lineTo(px - gap - markLen, py + grid.photoH);
          ctx.moveTo(px, py + grid.photoH + gap); ctx.lineTo(px, py + grid.photoH + gap + markLen);
          // Bottom-right
          ctx.moveTo(px + grid.photoW + gap, py + grid.photoH); ctx.lineTo(px + grid.photoW + gap + markLen, py + grid.photoH);
          ctx.moveTo(px + grid.photoW, py + grid.photoH + gap); ctx.lineTo(px + grid.photoW, py + grid.photoH + gap + markLen);
          ctx.stroke();
        }
        ctx.restore();
      }

      placed++;
    }
  }

  // Studio credit line on bottom margin
  if (settings.showStudioInfo && settings.studioInfoText) {
    ctx.save();
    ctx.fillStyle = '#64748B';
    ctx.font = `${Math.max(9, Math.round(dpi * 0.03))}px sans-serif`;
    ctx.textAlign = 'center';
    const textY = sheetHeightPx - Math.max(mmToPx(2), rawMarginPx / 2);
    ctx.fillText(settings.studioInfoText, sheetWidthPx / 2, textY);
    ctx.restore();
  }

  return sheetCanvas;
};

/**
 * Generates an exact-dimension PDF ready for print using jsPDF
 */
export const generatePrintPDF = ({
  photoCanvas,
  photoWidthMm,
  photoHeightMm,
  settings,
}: {
  photoCanvas: HTMLCanvasElement;
  photoWidthMm: number;
  photoHeightMm: number;
  settings: PrintSettings;
}): jsPDF => {
  const paper = PAPER_SIZES.find(p => p.id === settings.paperSizeId) || PAPER_SIZES[0];

  const orientation = settings.orientation === 'landscape' ? 'l' : 'p';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [paper.widthMm, paper.heightMm],
  });

  const paperWidthMm = orientation === 'l' ? paper.heightMm : paper.widthMm;
  const paperHeightMm = orientation === 'l' ? paper.widthMm : paper.heightMm;

  const { wMm, hMm } = getValidDimensionsMm(photoCanvas, photoWidthMm, photoHeightMm);

  // Compute scale and layout matching canvas generator
  const dpi = 300;
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);
  const sheetWidthPx = mmToPx(paperWidthMm);
  const sheetHeightPx = mmToPx(paperHeightMm);

  const spacingMmValue = settings.spacingMm ?? 0;
  const rawSpacingPx = spacingMmValue <= 0.05 ? 0 : mmToPx(spacingMmValue);
  const rawMarginPx = mmToPx(settings.marginMm ?? 5);

  const grid = calculateOptimalGrid(
    sheetWidthPx,
    sheetHeightPx,
    mmToPx(wMm),
    mmToPx(hMm),
    rawSpacingPx,
    rawMarginPx,
    settings.gridCount
  );

  const pxToMm = (px: number) => (px * 25.4) / dpi;
  const photoWMm = pxToMm(grid.photoW);
  const photoHMm = pxToMm(grid.photoH);
  const spacingMm = pxToMm(grid.spacing);
  const startXMm = pxToMm(grid.startX);
  const startYMm = pxToMm(grid.startY);

  const photoImgData = photoCanvas.toDataURL('image/jpeg', 0.96);

  let placed = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (placed >= settings.gridCount) break;

      const px = startXMm + c * (photoWMm + spacingMm);
      const py = startYMm + r * (photoHMm + spacingMm);

      pdf.addImage(photoImgData, 'JPEG', px, py, photoWMm, photoHMm);

      if (settings.showCutLines) {
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.1);
        if (settings.cutLineStyle === 'dashed') {
          pdf.setLineDashPattern([1.5, 1.5], 0);
          pdf.rect(px, py, photoWMm, photoHMm);
        } else if (settings.cutLineStyle === 'solid') {
          pdf.setLineDashPattern([], 0);
          pdf.rect(px, py, photoWMm, photoHMm);
        } else if (settings.cutLineStyle === 'crop-marks') {
          pdf.setLineDashPattern([], 0);
          const len = 2.5;
          const gap = 0.5;
          // TL
          pdf.line(px - gap, py, px - gap - len, py);
          pdf.line(px, py - gap, px, py - gap - len);
          // TR
          pdf.line(px + photoWMm + gap, py, px + photoWMm + gap + len, py);
          pdf.line(px + photoWMm, py - gap, px + photoWMm, py - gap - len);
          // BL
          pdf.line(px - gap, py + photoHMm, px - gap - len, py + photoHMm);
          pdf.line(px, py + photoHMm + gap, px, py + photoHMm + gap + len);
          // BR
          pdf.line(px + photoWMm + gap, py + photoHMm, px + photoWMm + gap + len, py + photoHMm);
          pdf.line(px + photoWMm, py + photoHMm + gap, px + photoWMm, py + photoHMm + gap + len);
        }
      }

      placed++;
    }
  }

  // Margin studio info
  if (settings.showStudioInfo && settings.studioInfoText) {
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(settings.studioInfoText, paperWidthMm / 2, paperHeightMm - 2.5, { align: 'center' });
  }

  return pdf;
};
