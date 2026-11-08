export interface BackgroundPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  category: 'solid' | 'studio' | 'gradient';
  color?: string;
  dataUri?: string;
  descriptionEn: string;
  descriptionAr: string;
}

const svgToDataUri = (svgStr: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svgStr.trim())}`;

// Studio Vignette Grey
const svgStudioGrey = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
  <defs>
    <radialGradient id="vignetteGrey" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#f3f4f6"/>
      <stop offset="60%" stop-color="#d1d5db"/>
      <stop offset="100%" stop-color="#9ca3af"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#vignetteGrey)"/>
</svg>
`;

// Studio Spotlight Blue
const svgStudioBlue = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
  <defs>
    <radialGradient id="vignetteBlue" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="55%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#vignetteBlue)"/>
</svg>
`;

// Warm Studio Portrait
const svgWarmStudio = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
  <defs>
    <radialGradient id="vignetteWarm" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="50%" stop-color="#ea580c" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#fff7ed"/>
  <rect width="100%" height="100%" fill="url(#vignetteWarm)"/>
  <circle cx="150" cy="200" r="80" fill="#ffffff" opacity="0.08"/>
  <circle cx="450" cy="350" r="120" fill="#ffffff" opacity="0.06"/>
</svg>
`;

// Soft Elegant Bokeh
const svgBokehStudio = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
  <defs>
    <linearGradient id="bokehGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bokehGrad)"/>
  <circle cx="100" cy="150" r="50" fill="#bae6fd" opacity="0.35" filter="url(#blur)"/>
  <circle cx="500" cy="250" r="90" fill="#e0f2fe" opacity="0.25" filter="url(#blur)"/>
  <circle cx="200" cy="600" r="70" fill="#7dd3fc" opacity="0.3" filter="url(#blur)"/>
  <circle cx="450" cy="650" r="110" fill="#38bdf8" opacity="0.2" filter="url(#blur)"/>
</svg>
`;

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // Solid Colors
  {
    id: 'solid-white',
    nameEn: 'Pure White (US Visa / Official)',
    nameAr: 'أبيض ناصع (فيزا أمريكا / المعيار المعتمد)',
    category: 'solid',
    color: '#FFFFFF',
    descriptionEn: 'Required for US Visa, DV Lottery, Saudi Arabia, UAE, Canada.',
    descriptionAr: 'مطلوب لتأشيرة أمريكا، القرعة، السعودية، الإمارات، كندا.',
  },
  {
    id: 'solid-light-grey',
    nameEn: 'Light Grey (Algeria & EU Biometric)',
    nameAr: 'رمادي فاتح (الجزائر والاتحاد الأوروبي)',
    category: 'solid',
    color: '#E5E7EB',
    descriptionEn: 'Mandatory in Algeria, France and Schengen (Pure white is forbidden).',
    descriptionAr: 'إلزامي في الجزائر وفرنسا وشنغن (الأبيض الناصع ممنوع فيها).',
  },
  {
    id: 'solid-light-blue',
    nameEn: 'Light Blue (Algeria / French Visa)',
    nameAr: 'أزرق سماوي فاتح (تأشيرات فرنسية والجزائر)',
    category: 'solid',
    color: '#BFDBFE',
    descriptionEn: 'Allowed light blue background for Algerian and French IDs.',
    descriptionAr: 'أزرق فاتح مسموح في بطاقات الهوية الجزائرية والفرنسية.',
  },
  {
    id: 'solid-off-white',
    nameEn: 'Soft Off-White (Cream)',
    nameAr: 'أبيض كريمي ناعم',
    category: 'solid',
    color: '#F8F9FA',
    descriptionEn: 'Gentle studio off-white prevents overexposure in print.',
    descriptionAr: 'خلفية كريمية مريحة تمنع حروق البياض الزائد في الطباعة.',
  },
  {
    id: 'solid-royal-blue',
    nameEn: 'Royal Studio Blue',
    nameAr: 'أزرق ملكي كلاسيكي',
    category: 'solid',
    color: '#1E3A8A',
    descriptionEn: 'Classic studio portrait & academic photo background.',
    descriptionAr: 'خلفية استوديو كلاسيكية للصور الشخصية والأكاديمية.',
  },
  {
    id: 'solid-red',
    nameEn: 'Official Red (Asian Standard)',
    nameAr: 'أحمر رسمي (المعيار الآسيوي)',
    category: 'solid',
    color: '#DC2626',
    descriptionEn: 'Standard for Indonesian, Vietnamese and select Asian IDs.',
    descriptionAr: 'المعيار المعتمد للهويات في إندونيسيا وفيتنام وبعض الدول الآسيوية.',
  },
  // Studio Backdrop Textures
  {
    id: 'studio-vignette-grey',
    nameEn: 'Studio Vignette Grey',
    nameAr: 'رمادي استوديو مع هالة ضوئية',
    category: 'studio',
    dataUri: svgToDataUri(svgStudioGrey),
    descriptionEn: 'Professional photography studio spotlight gradient.',
    descriptionAr: 'تدرج ضوئي احترافي مع تركيز إضاءة على الموضوع.',
  },
  {
    id: 'studio-spotlight-blue',
    nameEn: 'Studio Spotlight Blue',
    nameAr: 'أزرق استوديو احترافي',
    category: 'studio',
    dataUri: svgToDataUri(svgStudioBlue),
    descriptionEn: 'Deep rich portrait blue with center highlight.',
    descriptionAr: 'أزرق ملكي عميق مع إضاءة وسطية متدرجة.',
  },
  {
    id: 'studio-warm-sepia',
    nameEn: 'Warm Portrait Amber',
    nameAr: 'دفء استوديو كهرماني',
    category: 'studio',
    dataUri: svgToDataUri(svgWarmStudio),
    descriptionEn: 'Warm portrait lighting for family and commemorative photos.',
    descriptionAr: 'إضاءة دافئة مريحة للصور التذكارية والشخصية.',
  },
  {
    id: 'studio-bokeh-blue',
    nameEn: 'Soft Bokeh Backdrop',
    nameAr: 'خلفية بوكيه ناعمة',
    category: 'studio',
    dataUri: svgToDataUri(svgBokehStudio),
    descriptionEn: 'Delicate blurred bokeh circles for creative portraits.',
    descriptionAr: 'دوائر بوكيه ضبابية لطيفة للصور الإبداعية.',
  },
];
