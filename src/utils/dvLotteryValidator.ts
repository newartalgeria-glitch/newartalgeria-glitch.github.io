import type { DVLotteryValidation } from '../types';

export const validateDVLottery = (
  width: number,
  height: number,
  estimatedFileSizeKB: number,
  headHeightPercent: number = 60, // approximate or user guide alignment
  eyeLevelPercent: number = 62    // approximate or user guide alignment
): DVLotteryValidation => {
  const issues: DVLotteryValidation['issues'] = [];
  let score = 100;

  // 1. Aspect Ratio Check (Must be 1:1)
  const ratio = width / height;
  const isSquare = Math.abs(ratio - 1.0) < 0.01;
  const aspectRatioValid = isSquare;
  if (!aspectRatioValid) {
    score -= 30;
    issues.push({
      type: 'error',
      textEn: `Aspect ratio is ${(ratio).toFixed(2)}:1. US Visa photos must be perfectly square (1:1).`,
      textAr: `نسبة الأبعاد الحالية ${(ratio).toFixed(2)}:1. يشترط أن تكون الصورة مربعة تماماً (1:1).`,
    });
  } else {
    issues.push({
      type: 'success',
      textEn: 'Aspect ratio is perfectly square 1:1.',
      textAr: 'نسبة الأبعاد مربعة 1:1 ومطابقة للمواصفات.',
    });
  }

  // 2. Resolution Check (600x600 to 1200x1200)
  const isWidthValid = width >= 600 && width <= 1200;
  const isHeightValid = height >= 600 && height <= 1200;
  const resolutionValid = isWidthValid && isHeightValid;

  if (width < 600 || height < 600) {
    score -= 30;
    issues.push({
      type: 'error',
      textEn: `Dimensions ${width}x${height}px are below the 600x600 px minimum requirement.`,
      textAr: `أبعاد الصورة ${width}x${height} بكسل أقل من الحد الأدنى المطلوب 600x600 بكسل.`,
    });
  } else if (width > 1200 || height > 1200) {
    score -= 15;
    issues.push({
      type: 'warning',
      textEn: `Dimensions ${width}x${height}px exceed 1200x1200 px. May be resized by DV entry tool.`,
      textAr: `أبعاد الصورة ${width}x${height} أكبر من 1200x1200 بكسل. يفضل تصديرها بمقاس 600x600.`,
    });
  } else {
    issues.push({
      type: 'success',
      textEn: `Dimensions ${width}x${height}px meet official US Visa requirements (600 - 1200 px).`,
      textAr: `أبعاد الصورة ${width}x${height} بكسل تطابق المعيار الرسمي تماماً (600 - 1200 بكسل).`,
    });
  }

  // 3. File Size Check (<= 240 KB)
  const fileSizeValid = estimatedFileSizeKB <= 240 && estimatedFileSizeKB >= 20;
  if (estimatedFileSizeKB > 240) {
    score -= 25;
    issues.push({
      type: 'error',
      textEn: `Estimated file size (~${Math.round(estimatedFileSizeKB)} KB) exceeds the 240 KB limit.`,
      textAr: `حجم الملف المقدر (~${Math.round(estimatedFileSizeKB)} ك.ب) يتجاوز الحد الأقصى 240 كيلوبايت.`,
    });
  } else if (estimatedFileSizeKB < 20) {
    score -= 10;
    issues.push({
      type: 'warning',
      textEn: `Estimated file size (~${Math.round(estimatedFileSizeKB)} KB) is very small. Check for compression artifacts.`,
      textAr: `حجم الملف المقدر (~${Math.round(estimatedFileSizeKB)} ك.ب) صغير جداً، تأكد من جودة ونقاء الصورة.`,
    });
  } else {
    issues.push({
      type: 'success',
      textEn: `Estimated JPEG size (~${Math.round(estimatedFileSizeKB)} KB) is within the ≤ 240 KB limit.`,
      textAr: `حجم ملف JPEG المقدر (~${Math.round(estimatedFileSizeKB)} ك.ب) ضمن الحد القانوني (أقل من 240 ك.ب).`,
    });
  }

  // 4. Head Height Check (50% - 69% of height)
  const headHeightValid = headHeightPercent >= 50 && headHeightPercent <= 69;
  if (!headHeightValid) {
    score -= 15;
    issues.push({
      type: 'warning',
      textEn: `Head height is ~${Math.round(headHeightPercent)}%. Official requirement is between 50% and 69%.`,
      textAr: `ارتفاع الرأس المقدر ~${Math.round(headHeightPercent)}%. المطلوب رسمياً أن يشغل بين 50% إلى 69%.`,
    });
  } else {
    issues.push({
      type: 'success',
      textEn: `Head size (~${Math.round(headHeightPercent)}%) is within the required 50% - 69% proportion.`,
      textAr: `حجم الرأس (~${Math.round(headHeightPercent)}%) يقع بدقة داخل النطاق المسموح (50% إلى 69%).`,
    });
  }

  // 5. Eye Level Check (56% - 69% from bottom)
  const eyeLevelValid = eyeLevelPercent >= 56 && eyeLevelPercent <= 69;
  if (!eyeLevelValid) {
    score -= 10;
    issues.push({
      type: 'warning',
      textEn: `Eye level position (~${Math.round(eyeLevelPercent)}%) should be between 56% and 69% from bottom.`,
      textAr: `مستوى العينين (~${Math.round(eyeLevelPercent)}%) يجب أن يتراوح بين 56% إلى 69% من أسفل الصورة.`,
    });
  } else {
    issues.push({
      type: 'success',
      textEn: 'Eye level alignment satisfies official US Department of State criteria.',
      textAr: 'محاذاة خط العينين تطابق شروط وزارة الخارجية الأمريكية تماماً.',
    });
  }

  const overallScore = Math.max(0, Math.min(100, score));
  const overallPass = overallScore >= 80 && isSquare && width >= 600 && height >= 600 && estimatedFileSizeKB <= 240;

  return {
    isSquare,
    actualWidth: width,
    actualHeight: height,
    resolutionValid,
    aspectRatioValid,
    fileSizeKB: Math.round(estimatedFileSizeKB),
    fileSizeValid,
    headHeightPercent,
    headHeightValid,
    eyeLevelPercent,
    eyeLevelValid,
    colorDepthValid: true,
    overallScore,
    overallPass,
    issues,
  };
};
