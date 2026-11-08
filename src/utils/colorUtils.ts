export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): RGB => {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
};

/**
 * Weighted Euclidean perceptual color distance (approximating CIELAB)
 */
export const colorDistance = (c1: RGB, c2: RGB): number => {
  const rmean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(
    (((512 + rmean) * dr * dr) >> 8) +
    4 * dg * dg +
    (((767 - rmean) * db * db) >> 8)
  );
};

/**
 * One-Click Automatic Green Screen Remover
 * Scans and removes all green screen shades (bright green, deep green, shadows, fabric folds)
 * automatically in a single click with antialiased edge feathering and green despill.
 */
export const autoRemoveGreenScreen = (imageData: ImageData): void => {
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    // Green dominance check:
    const maxRB = Math.max(r, b);
    const diff = g - maxRB;

    // Fast Hue calculation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let hue = 0;

    if (delta > 0) {
      if (max === g) {
        hue = 60 * ((b - r) / delta + 2);
      } else if (max === r) {
        hue = 60 * (((g - b) / delta) % 6);
      } else {
        hue = 60 * ((r - g) / delta + 4);
      }
      if (hue < 0) hue += 360;
    }

    const sat = max > 0 ? delta / max : 0;
    const val = max / 255;

    // Green screen range covers hues 65° (yellowish green) through 175° (cyan-green)
    const isGreenHue = hue >= 65 && hue <= 175;
    const isGreenDominant = diff > 8 && g > 40;

    if (isGreenHue && (isGreenDominant || (sat > 0.20 && val > 0.15 && g > r && g > b))) {
      // Solid green background - complete removal
      if (diff > 20 || (sat > 0.30 && diff > 12)) {
        data[i + 3] = 0;
      } else {
        // Soft edge antialiasing around hair and shoulders
        const factor = Math.max(0, Math.min(1, 1 - (diff / 20)));
        data[i + 3] = Math.round(a * factor);

        // Despill edge fringe
        const avgRB = (r + b) / 2;
        if (g > avgRB) {
          data[i + 1] = Math.round(avgRB);
        }
      }
    } else if (diff > 0 && isGreenHue) {
      // Boundary despill suppression to eliminate green bounce on skin/hair
      const avgRB = (r + b) / 2;
      if (g > avgRB) {
        data[i + 1] = Math.round(avgRB * 0.85 + g * 0.15);
      }
    }
  }
};

/**
 * Standard Professional Image Adjustments
 * Accurate Contrast, Brightness, Saturation, Temperature, Tint, and Exposure curves.
 */
export const applyAdjustments = (
  imageData: ImageData,
  brightness: number, // -100 to 100
  contrast: number, // -100 to 100
  saturation: number, // -100 to 100
  temperature: number, // -100 to 100
  tint: number, // -100 to 100
  exposure: number // -100 to 100
): void => {
  const data = imageData.data;

  // Correct standard contrast factor (contrast=0 yields factor=1.0)
  const clampedContrast = Math.max(-99, Math.min(99, contrast));
  const contrastFactor = (259 * (clampedContrast + 255)) / (255 * (259 - clampedContrast));

  // Brightness shift
  const bShift = (brightness / 100) * 100;

  // Saturation factor (saturation=0 yields factor=1.0)
  const satFactor = saturation >= 0 ? (1 + (saturation / 100) * 1.5) : (1 + saturation / 100);

  // Exposure multiplier (exposure=0 yields factor=1.0)
  const expFactor = Math.pow(2, (exposure / 100) * 1.5);

  // Temperature (Warmth shifts Red/Yellow, Coolness shifts Blue)
  const tempR = (temperature / 100) * 35;
  const tempB = -(temperature / 100) * 35;

  // Tint (Magenta shifts Red/Blue, Green shifts Green)
  const tintG = -(tint / 100) * 25;
  const tintM = (tint / 100) * 18;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Exposure
    if (exposure !== 0) {
      r *= expFactor;
      g *= expFactor;
      b *= expFactor;
    }

    // 2. Brightness
    if (brightness !== 0) {
      r += bShift;
      g += bShift;
      b += bShift;
    }

    // 3. Contrast
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 4. Temperature & Tint
    if (temperature !== 0 || tint !== 0) {
      r += tempR + tintM;
      g += tintG;
      b += tempB + tintM;
    }

    // 5. Saturation (perceptual luminance-preserving)
    if (saturation !== 0) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * satFactor;
      g = lum + (g - lum) * satFactor;
      b = lum + (b - lum) * satFactor;
    }

    // Clamp to valid 0-255 range
    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }
};

/**
 * 3x3 Convolution filter for Sharpness
 */
export const applySharpness = (imageData: ImageData, sharpness: number): void => {
  if (sharpness <= 0) return;

  const w = imageData.width;
  const h = imageData.height;
  const src = imageData.data;
  const copy = new Uint8ClampedArray(src);

  // Kernel strength
  const k = (sharpness / 100) * 1.5;
  const center = 1 + 4 * k;
  const neighbor = -k;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (copy[idx + 3] === 0) continue;

      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * w + x) * 4 + c];
        const bottom = copy[((y + 1) * w + x) * 4 + c];
        const left = copy[(y * w + (x - 1)) * 4 + c];
        const right = copy[(y * w + (x + 1)) * 4 + c];
        const mid = copy[idx + c];

        const val = mid * center + (top + bottom + left + right) * neighbor;
        src[idx + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
};

/**
 * Edge-preserving Skin Smoothing & Blemish Softener (Bilateral-like Airbrush Filter)
 */
export const applySkinSmoothing = (imageData: ImageData, amount: number): void => {
  if (amount <= 0) return;

  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  const radius = Math.min(3, Math.max(1, Math.round((amount / 100) * 3)));
  const rangeThreshold = 25 * (amount / 100) + 10;
  const blendWeight = (amount / 100) * 0.85;

  for (let y = radius; y < h - radius; y += 1) {
    for (let x = radius; x < w - radius; x += 1) {
      const idx = (y * w + x) * 4;
      if (copy[idx + 3] === 0) continue;

      const r = copy[idx];
      const g = copy[idx + 1];
      const b = copy[idx + 2];

      // Quick skin tone check: R > G > B and difference (R - G) > 10
      const isSkin = r > 60 && g > 40 && b > 20 && r > g && g >= b && (r - b) > 15;
      if (!isSkin) continue;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = ((y + dy) * w + (x + dx)) * 4;
          const nr = copy[nIdx];
          const ng = copy[nIdx + 1];
          const nb = copy[nIdx + 2];

          // Intensity distance to preserve eyes, eyebrows, lips and sharp borders
          const dist = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
          if (dist < rangeThreshold * 3) {
            sumR += nr;
            sumG += ng;
            sumB += nb;
            count++;
          }
        }
      }

      if (count > 0) {
        const avgR = sumR / count;
        const avgG = sumG / count;
        const avgB = sumB / count;

        data[idx] = Math.round(r * (1 - blendWeight) + avgR * blendWeight);
        data[idx + 1] = Math.round(g * (1 - blendWeight) + avgG * blendWeight);
        data[idx + 2] = Math.round(b * (1 - blendWeight) + avgB * blendWeight);
      }
    }
  }
};
