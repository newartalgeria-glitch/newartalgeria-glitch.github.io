export interface FontOption {
  id: string;
  nameEn: string;
  nameAr: string;
  family: string;
  category: 'arabic' | 'latin';
  sampleText: string;
}

/**
 * 12 Professional Arabic Google Fonts for Photo Studios
 */
export const ARABIC_FONTS: FontOption[] = [
  { id: 'cairo', nameEn: 'Cairo', nameAr: 'خط كايرو (عصري واضح)', family: "'Cairo', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'tajawal', nameEn: 'Tajawal', nameAr: 'خط تجوال (أنيق)', family: "'Tajawal', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'almarai', nameEn: 'Almarai', nameAr: 'خط المراعي (رسمي)', family: "'Almarai', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'amiri', nameEn: 'Amiri', nameAr: 'خط أميري (نسخ فخم)', family: "'Amiri', serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'changa', nameEn: 'Changa', nameAr: 'خط تشانغا (عريض وقوي)', family: "'Changa', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'readex-pro', nameEn: 'Readex Pro', nameAr: 'خط ريدكس برو (تقني)', family: "'Readex Pro', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'el-messiri', nameEn: 'El Messiri', nameAr: 'خط المسيري (ناعم وجذاب)', family: "'El Messiri', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'noto-kufi-arabic', nameEn: 'Noto Kufi', nameAr: 'خط كوفي حديث', family: "'Noto Kufi Arabic', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'lateef', nameEn: 'Lateef', nameAr: 'خط لطيف (رشيق كلاسيك)', family: "'Lateef', serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'reem-kufi', nameEn: 'Reem Kufi', nameAr: 'خط ريم كوفي (أصيل)', family: "'Reem Kufi', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'scheherazade-new', nameEn: 'Scheherazade', nameAr: 'خط شهرزاد (تراثي)', family: "'Scheherazade New', serif", category: 'arabic', sampleText: 'استوديو نادر' },
  { id: 'rubik', nameEn: 'Rubik Arabic', nameAr: 'خط روبيك (مستدير)', family: "'Rubik', sans-serif", category: 'arabic', sampleText: 'استوديو نادر' },
];

/**
 * 12 Professional Latin Google Fonts for Photo Studios
 */
export const LATIN_FONTS: FontOption[] = [
  { id: 'roboto', nameEn: 'Roboto', nameAr: 'Roboto (Standard Sans)', family: "'Roboto', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'montserrat', nameEn: 'Montserrat', nameAr: 'Montserrat (Geometric)', family: "'Montserrat', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'open-sans', nameEn: 'Open Sans', nameAr: 'Open Sans (Clean)', family: "'Open Sans', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'poppins', nameEn: 'Poppins', nameAr: 'Poppins (Modern Rounded)', family: "'Poppins', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'inter', nameEn: 'Inter', nameAr: 'Inter (Precise UI)', family: "'Inter', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'lato', nameEn: 'Lato', nameAr: 'Lato (Corporate)', family: "'Lato', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'oswald', nameEn: 'Oswald', nameAr: 'Oswald (Bold Condensed)', family: "'Oswald', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'playfair-display', nameEn: 'Playfair Display', nameAr: 'Playfair (Luxury Serif)', family: "'Playfair Display', serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'bebas-neue', nameEn: 'Bebas Neue', nameAr: 'Bebas Neue (Tall Impact)', family: "'Bebas Neue', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'raleway', nameEn: 'Raleway', nameAr: 'Raleway (Artistic Thin)', family: "'Raleway', sans-serif", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'pacifico', nameEn: 'Pacifico', nameAr: 'Pacifico (Cursive Signature)', family: "'Pacifico', cursive", category: 'latin', sampleText: 'Studio Nadir' },
  { id: 'cinzel', nameEn: 'Cinzel', nameAr: 'Cinzel (Roman Formal)', family: "'Cinzel', serif", category: 'latin', sampleText: 'Studio Nadir' },
];

export const ALL_FONTS: FontOption[] = [...ARABIC_FONTS, ...LATIN_FONTS];

/**
 * Classic Photo Editing Studio Palette (40 Swatches: 8 columns x 5 rows)
 * Matching the exact desktop layout from PhotoFiltre / Photoshop
 */
export const STUDIO_SWATCH_PALETTE: string[][] = [
  // Row 1: Deep Darks & Blacks
  ['#000000', '#5A2800', '#363300', '#003815', '#00274C', '#001150', '#1E1045', '#262626'],
  // Row 2: Deep Saturated Tones
  ['#5C0600', '#D45000', '#3B7200', '#006E2E', '#007878', '#0033B3', '#3A0078', '#555555'],
  // Row 3: Vibrant Primaries
  ['#D10000', '#FF6600', '#86CC00', '#00B347', '#00C2C2', '#0066FF', '#6E00B3', '#888888'],
  // Row 4: Bright & Neon Accents
  ['#FF0080', '#FFAA00', '#FFFF00', '#00FF00', '#00FFFF', '#00AEFF', '#993366', '#B8B8B8'],
  // Row 5: Soft Pastels & Pure White
  ['#FFC4E1', '#FFE0B2', '#FFFFCC', '#D0F8CE', '#CCFFFF', '#CCE5FF', '#E1CCFF', '#FFFFFF'],
];
