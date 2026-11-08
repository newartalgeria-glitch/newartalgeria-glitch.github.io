import type { SuitTemplate } from '../types';

const svgToDataUri = (svgStr: string) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr.trim())}`;
};

// 1. Photo-Realistic Classic Black Italian Wool Suit with Crisp White Shirt & Dark/Black Silk Tie
const svgClassicBlackSuit = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 520" width="600" height="520">
  <defs>
    <!-- Left Shoulder Shadow & Highlight -->
    <radialGradient id="blkShoulderL" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#2d2e34"/>
      <stop offset="45%" stop-color="#191a1e"/>
      <stop offset="85%" stop-color="#0b0b0e"/>
      <stop offset="100%" stop-color="#050506"/>
    </radialGradient>
    <!-- Right Shoulder Shadow & Highlight -->
    <radialGradient id="blkShoulderR" cx="70%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#26272c"/>
      <stop offset="45%" stop-color="#141518"/>
      <stop offset="85%" stop-color="#090a0c"/>
      <stop offset="100%" stop-color="#040405"/>
    </radialGradient>

    <!-- Dark / Black Silk Tie Gradient -->
    <linearGradient id="darkTieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#111215"/>
      <stop offset="30%" stop-color="#2a2c33"/>
      <stop offset="50%" stop-color="#3d404a"/>
      <stop offset="70%" stop-color="#222429"/>
      <stop offset="100%" stop-color="#0d0e10"/>
    </linearGradient>

    <!-- Crisp Cotton White Shirt -->
    <linearGradient id="cottonShirt" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="65%" stop-color="#f3f5f8"/>
      <stop offset="100%" stop-color="#dce1e8"/>
    </linearGradient>

    <!-- Collar 3D Depth Shading -->
    <linearGradient id="collarLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="75%" stop-color="#eaedf2"/>
      <stop offset="100%" stop-color="#c8cfd9"/>
    </linearGradient>
    <linearGradient id="collarRight" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="75%" stop-color="#eaedf2"/>
      <stop offset="100%" stop-color="#c8cfd9"/>
    </linearGradient>

    <!-- Drop Shadows for Lapels and Tie -->
    <filter id="lapelShadowL" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="-3" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
    <filter id="lapelShadowR" x="-10%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
    <filter id="tieDimpleShadow" x="-30%" y="-10%" width="160%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Left & Right Natural Sloping Shoulder Contours -->
  <path d="M 10 520 L 590 520 L 570 250 C 535 192 475 168 375 158 C 310 152 290 152 225 158 C 125 168 65 192 30 250 Z" fill="url(#blkShoulderL)"/>
  <path d="M 300 152 L 590 520 L 570 250 C 535 192 475 168 375 158 Z" fill="url(#blkShoulderR)" opacity="0.95"/>

  <!-- Crisp White Shirt Triangle -->
  <polygon points="225,155 375,155 350,345 250,345" fill="url(#cottonShirt)"/>

  <!-- Shirt Placket Center Seam & Buttons -->
  <line x1="300" y1="180" x2="300" y2="345" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="300" cy="275" r="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.9"/>
  <circle cx="300" cy="325" r="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.9"/>

  <!-- Left Shirt Collar Leaf -->
  <path d="M 230 156 L 292 160 L 282 232 L 216 196 Z" fill="url(#collarLeft)" stroke="#b8c2cc" stroke-width="1"/>
  <!-- Right Shirt Collar Leaf -->
  <path d="M 370 156 L 308 160 L 318 232 L 384 196 Z" fill="url(#collarRight)" stroke="#b8c2cc" stroke-width="1"/>

  <!-- Dark Tie Knot with Center Dimple -->
  <path d="M 284 190 C 284 186 316 186 316 190 L 324 228 C 316 238 305 242 300 242 C 295 242 284 238 276 228 Z" fill="url(#darkTieGrad)" filter="url(#tieDimpleShadow)"/>
  <!-- Tie Dimple Shadow Crease -->
  <path d="M 297 224 C 300 230 303 230 303 224" stroke="#050507" stroke-width="2.5" fill="none"/>

  <!-- Dark Tie Blade Falling Naturally -->
  <path d="M 288 236 L 312 236 L 328 470 L 300 515 L 272 470 Z" fill="url(#darkTieGrad)" filter="url(#tieDimpleShadow)"/>

  <!-- Subtle Micro-Jacquard Weave Stripes on Dark Tie -->
  <line x1="286" y1="265" x2="314" y2="285" stroke="#4b4f5a" stroke-width="1.2" opacity="0.4"/>
  <line x1="282" y1="305" x2="318" y2="325" stroke="#4b4f5a" stroke-width="1.2" opacity="0.4"/>
  <line x1="279" y1="345" x2="321" y2="365" stroke="#4b4f5a" stroke-width="1.2" opacity="0.4"/>
  <line x1="276" y1="385" x2="324" y2="405" stroke="#4b4f5a" stroke-width="1.2" opacity="0.4"/>
  <line x1="273" y1="425" x2="327" y2="445" stroke="#4b4f5a" stroke-width="1.2" opacity="0.4"/>

  <!-- Left Notch Lapel with Dimensional Pick-Stitching -->
  <path d="M 200 156 L 265 355 L 202 298 L 170 238 L 180 195 Z" fill="#1e1f24" stroke="#070709" stroke-width="1.4" filter="url(#lapelShadowL)"/>
  <line x1="188" y1="210" x2="198" y2="206" stroke="#42434a" stroke-width="1.5"/>

  <!-- Right Notch Lapel -->
  <path d="M 400 156 L 335 355 L 398 298 L 430 238 L 420 195 Z" fill="#18191d" stroke="#070709" stroke-width="1.4" filter="url(#lapelShadowR)"/>

  <!-- Suit Front Fastening Button -->
  <circle cx="300" cy="390" r="9" fill="#131417" stroke="#41434c" stroke-width="2"/>
  <circle cx="300" cy="390" r="5" fill="#060608"/>
  <line x1="298" y1="388" x2="302" y2="392" stroke="#686a76" stroke-width="1.2"/>
  <line x1="302" y1="388" x2="298" y2="392" stroke="#686a76" stroke-width="1.2"/>

  <!-- Left Chest Pocket & Subtle Crisp White Pocket Square -->
  <path d="M 120 300 L 172 292 L 172 302 L 120 310 Z" fill="#16171b" stroke="#08080a" stroke-width="1.2"/>
  <polygon points="135,296 148,280 160,294" fill="#ffffff" opacity="0.95"/>
</svg>
`;

// 2. Photo-Realistic Premium Navy Blue Suit with White Shirt & Patterned Red / Burgundy Tie
const svgNavyRedTieSuit = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 520" width="600" height="520">
  <defs>
    <!-- Navy Wool Shoulder Form -->
    <radialGradient id="navyShoulderL" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#223762"/>
      <stop offset="45%" stop-color="#152445"/>
      <stop offset="85%" stop-color="#0a1226"/>
      <stop offset="100%" stop-color="#050914"/>
    </radialGradient>
    <radialGradient id="navyShoulderR" cx="70%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#1c2f54"/>
      <stop offset="45%" stop-color="#111c36"/>
      <stop offset="85%" stop-color="#080e1e"/>
      <stop offset="100%" stop-color="#040710"/>
    </radialGradient>

    <!-- Rich Burgundy / Crimson Silk Tie Shading -->
    <linearGradient id="burgundyTieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4a040b"/>
      <stop offset="25%" stop-color="#7a0c1a"/>
      <stop offset="50%" stop-color="#b0162a"/>
      <stop offset="75%" stop-color="#7a0c1a"/>
      <stop offset="100%" stop-color="#3b0308"/>
    </linearGradient>

    <linearGradient id="whiteShirtNavy" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f0f4f8"/>
      <stop offset="100%" stop-color="#d6dfe8"/>
    </linearGradient>

    <filter id="navyLapelShadowL" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="-3" dy="6" stdDeviation="5" flood-color="#020617" flood-opacity="0.7"/>
    </filter>
    <filter id="navyLapelShadowR" x="-10%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#020617" flood-opacity="0.7"/>
    </filter>
    <filter id="tieShadowRed" x="-30%" y="-10%" width="160%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#020617" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Shoulders -->
  <path d="M 10 520 L 590 520 L 570 250 C 535 192 475 168 375 158 C 310 152 290 152 225 158 C 125 168 65 192 30 250 Z" fill="url(#navyShoulderL)"/>
  <path d="M 300 152 L 590 520 L 570 250 C 535 192 475 168 375 158 Z" fill="url(#navyShoulderR)" opacity="0.95"/>

  <!-- White Cotton Shirt -->
  <polygon points="225,155 375,155 350,345 250,345" fill="url(#whiteShirtNavy)"/>
  <line x1="300" y1="180" x2="300" y2="345" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="300" cy="275" r="4" fill="#ffffff" stroke="#94a3b8" stroke-width="0.9"/>
  <circle cx="300" cy="325" r="4" fill="#ffffff" stroke="#94a3b8" stroke-width="0.9"/>

  <!-- Collar Leaves with subtle blue shadow -->
  <path d="M 230 156 L 292 160 L 282 232 L 216 196 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <path d="M 370 156 L 308 160 L 318 232 L 384 196 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Burgundy Patterned Tie Knot -->
  <path d="M 284 190 C 284 186 316 186 316 190 L 324 228 C 316 238 305 242 300 242 C 295 242 284 238 276 228 Z" fill="url(#burgundyTieGrad)" filter="url(#tieShadowRed)"/>
  <path d="M 297 224 C 300 230 303 230 303 224" stroke="#260206" stroke-width="2.5" fill="none"/>

  <!-- Patterned Red / Burgundy Tie Blade -->
  <path d="M 288 236 L 312 236 L 328 470 L 300 515 L 272 470 Z" fill="url(#burgundyTieGrad)" filter="url(#tieShadowRed)"/>

  <!-- Elegant Gold & White Silk Pattern Dots / Weave on Tie -->
  <g fill="#fde68a" opacity="0.75">
    <circle cx="300" cy="255" r="1.8"/>
    <circle cx="292" cy="275" r="1.8"/><circle cx="308" cy="275" r="1.8"/>
    <circle cx="300" cy="295" r="1.8"/>
    <circle cx="288" cy="315" r="1.8"/><circle cx="312" cy="315" r="1.8"/>
    <circle cx="300" cy="335" r="1.8"/>
    <circle cx="285" cy="355" r="1.8"/><circle cx="315" cy="355" r="1.8"/>
    <circle cx="300" cy="375" r="1.8"/>
    <circle cx="282" cy="395" r="1.8"/><circle cx="318" cy="395" r="1.8"/>
    <circle cx="300" cy="415" r="1.8"/>
    <circle cx="279" cy="435" r="1.8"/><circle cx="321" cy="435" r="1.8"/>
    <circle cx="300" cy="455" r="1.8"/>
  </g>

  <!-- Tailored Navy Left Lapel -->
  <path d="M 200 156 L 265 355 L 202 298 L 170 238 L 180 195 Z" fill="#1b2d52" stroke="#081021" stroke-width="1.4" filter="url(#navyLapelShadowL)"/>
  <line x1="188" y1="210" x2="198" y2="206" stroke="#38548c" stroke-width="1.5"/>

  <!-- Tailored Navy Right Lapel -->
  <path d="M 400 156 L 335 355 L 398 298 L 430 238 L 420 195 Z" fill="#14223f" stroke="#081021" stroke-width="1.4" filter="url(#navyLapelShadowR)"/>

  <!-- Polished Horn Button -->
  <circle cx="300" cy="390" r="9" fill="#0f172a" stroke="#475569" stroke-width="2"/>
  <circle cx="300" cy="390" r="5" fill="#020617"/>
  <line x1="298" y1="388" x2="302" y2="392" stroke="#94a3b8" stroke-width="1.2"/>
  <line x1="302" y1="388" x2="298" y2="392" stroke="#94a3b8" stroke-width="1.2"/>

  <!-- Breast Welt Pocket & Red Bordered Pocket Square -->
  <path d="M 120 300 L 172 292 L 172 302 L 120 310 Z" fill="#111c34" stroke="#080e1e" stroke-width="1.2"/>
  <polygon points="135,296 148,280 160,294" fill="#ffffff" opacity="0.95"/>
  <polygon points="136,295 148,282 159,293" fill="none" stroke="#b0162a" stroke-width="1.2"/>
</svg>
`;

// 3. Photo-Realistic Charcoal Grey Tailored Wool Suit with Crisp White Shirt & Neat Patterned Tie
const svgCharcoalGreySuit = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 520" width="600" height="520">
  <defs>
    <!-- Charcoal Heather Wool Fabric Texture -->
    <radialGradient id="charcoalShoulderL" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#4a505b"/>
      <stop offset="45%" stop-color="#323740"/>
      <stop offset="85%" stop-color="#1e2227"/>
      <stop offset="100%" stop-color="#111316"/>
    </radialGradient>
    <radialGradient id="charcoalShoulderR" cx="70%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#404650"/>
      <stop offset="45%" stop-color="#2a2e36"/>
      <stop offset="85%" stop-color="#181a1f"/>
      <stop offset="100%" stop-color="#0c0e10"/>
    </radialGradient>

    <!-- Neat Silver & Slate Geometric Tie -->
    <linearGradient id="slateTieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="30%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="70%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>

    <filter id="charcoalLapelShadowL" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="-3" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
    <filter id="charcoalLapelShadowR" x="-10%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Shoulders -->
  <path d="M 10 520 L 590 520 L 570 250 C 535 192 475 168 375 158 C 310 152 290 152 225 158 C 125 168 65 192 30 250 Z" fill="url(#charcoalShoulderL)"/>
  <path d="M 300 152 L 590 520 L 570 250 C 535 192 475 168 375 158 Z" fill="url(#charcoalShoulderR)" opacity="0.95"/>

  <!-- Pure White Cotton Shirt -->
  <polygon points="225,155 375,155 350,345 250,345" fill="#ffffff"/>
  <line x1="300" y1="180" x2="300" y2="345" stroke="#e2e8f0" stroke-width="1.5"/>
  <circle cx="300" cy="275" r="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.9"/>
  <circle cx="300" cy="325" r="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.9"/>

  <!-- Collars -->
  <path d="M 230 156 L 292 160 L 282 232 L 216 196 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
  <path d="M 370 156 L 308 160 L 318 232 L 384 196 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Neat Tie Knot with Dimple -->
  <path d="M 284 190 C 284 186 316 186 316 190 L 324 228 C 316 238 305 242 300 242 C 295 242 284 238 276 228 Z" fill="url(#slateTieGrad)"/>
  <path d="M 297 224 C 300 230 303 230 303 224" stroke="#0f172a" stroke-width="2.5" fill="none"/>

  <!-- Neat Tie Blade -->
  <path d="M 288 236 L 312 236 L 328 470 L 300 515 L 272 470 Z" fill="url(#slateTieGrad)"/>

  <!-- Neat Silk Micro-Check Grid Pattern on Tie -->
  <g stroke="#cbd5e1" stroke-width="0.8" opacity="0.45">
    <line x1="288" y1="260" x2="312" y2="260"/>
    <line x1="285" y1="290" x2="315" y2="290"/>
    <line x1="282" y1="320" x2="318" y2="320"/>
    <line x1="279" y1="350" x2="321" y2="350"/>
    <line x1="276" y1="380" x2="324" y2="380"/>
    <line x1="273" y1="410" x2="327" y2="410"/>
    <line x1="270" y1="440" x2="330" y2="440"/>
  </g>

  <!-- Left Lapel -->
  <path d="M 200 156 L 265 355 L 202 298 L 170 238 L 180 195 Z" fill="#383d46" stroke="#1c2026" stroke-width="1.4" filter="url(#charcoalLapelShadowL)"/>
  <line x1="188" y1="210" x2="198" y2="206" stroke="#6b7280" stroke-width="1.5"/>

  <!-- Right Lapel -->
  <path d="M 400 156 L 335 355 L 398 298 L 430 238 L 420 195 Z" fill="#2d323b" stroke="#1c2026" stroke-width="1.4" filter="url(#charcoalLapelShadowR)"/>

  <!-- Charcoal Button -->
  <circle cx="300" cy="390" r="9" fill="#1f242c" stroke="#6b7280" stroke-width="2"/>
  <circle cx="300" cy="390" r="5" fill="#0f1115"/>

  <!-- Pocket & Square -->
  <path d="M 120 300 L 172 292 L 172 302 L 120 310 Z" fill="#292d35" stroke="#181a1f" stroke-width="1.2"/>
  <polygon points="135,296 148,280 160,294" fill="#ffffff" opacity="0.95"/>
</svg>
`;

// 4. Photo-Realistic Luxury Black Velvet Tuxedo with Satin Shawl Lapel & Silk Bow Tie
const svgBlackTuxedo = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 520" width="600" height="520">
  <defs>
    <linearGradient id="satinShawl" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3c3d42"/>
      <stop offset="50%" stop-color="#18181a"/>
      <stop offset="100%" stop-color="#08080a"/>
    </linearGradient>
  </defs>

  <!-- Deep Black Body -->
  <path d="M 10 520 L 590 520 L 570 250 C 535 192 475 168 375 158 C 310 152 290 152 225 158 C 125 168 65 192 30 250 Z" fill="#09090b"/>

  <!-- Pleated Marcella Tuxedo Shirt -->
  <polygon points="225,155 375,155 350,355 250,355" fill="#ffffff"/>
  <line x1="285" y1="180" x2="285" y2="355" stroke="#e2e8f0" stroke-width="1.2"/>
  <line x1="315" y1="180" x2="315" y2="355" stroke="#e2e8f0" stroke-width="1.2"/>
  <!-- Onyx Studs with Silver Rim -->
  <circle cx="300" cy="275" r="4.5" fill="#09090b" stroke="#cbd5e1" stroke-width="1.2"/>
  <circle cx="300" cy="318" r="4.5" fill="#09090b" stroke="#cbd5e1" stroke-width="1.2"/>

  <!-- Wingtip Collar Leaflets -->
  <polygon points="240,156 280,156 270,195" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <polygon points="360,156 320,156 330,195" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Silk Bow Tie Knot & Wings -->
  <polygon points="262,175 300,190 262,205 272,190" fill="#141416" stroke="#27272a" stroke-width="1.2"/>
  <polygon points="338,175 300,190 338,205 328,190" fill="#141416" stroke="#27272a" stroke-width="1.2"/>
  <circle cx="300" cy="190" r="7.5" fill="#27272a" stroke="#09090b" stroke-width="1"/>

  <!-- Lustrous Satin Shawl Lapels -->
  <path d="M 200 156 Q 240 265 270 355 L 220 305 Q 190 245 170 195 Z" fill="url(#satinShawl)" stroke="#000000" stroke-width="1.5"/>
  <path d="M 400 156 Q 360 265 330 355 L 380 305 Q 410 245 430 195 Z" fill="url(#satinShawl)" stroke="#000000" stroke-width="1.5"/>
</svg>
`;

// 5. Photo-Realistic Women's Executive Navy Blazer with Ivory Silk Blouse & Pearl Pendant
const svgWomenNavyBlazer = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 520" width="600" height="520">
  <defs>
    <radialGradient id="womenNavyGrad" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#22334f"/>
      <stop offset="55%" stop-color="#121b2b"/>
      <stop offset="100%" stop-color="#060910"/>
    </radialGradient>
  </defs>

  <!-- Tailored Shoulder Slope -->
  <path d="M 20 520 L 580 520 L 560 255 C 525 200 465 175 370 165 C 310 160 290 160 230 165 C 135 175 75 200 40 255 Z" fill="url(#womenNavyGrad)"/>

  <!-- Ivory Silk Blouse with Soft Draped Neckline -->
  <polygon points="235,165 365,165 300,320" fill="#f8fafc"/>
  <path d="M 250 195 Q 300 225 350 195" stroke="#e2e8f0" stroke-width="2" fill="none"/>

  <!-- Fine Pearl Pendant Necklace -->
  <path d="M 250 170 Q 300 215 350 170" stroke="#cbd5e1" stroke-width="1.2" fill="none"/>
  <circle cx="300" cy="202" r="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>

  <!-- Slim Elegant Lapels -->
  <path d="M 215 165 L 300 355 L 255 290 L 195 230 Z" fill="#1b2a42" stroke="#080e18" stroke-width="1.5"/>
  <path d="M 385 165 L 300 355 L 345 290 L 405 230 Z" fill="#152135" stroke="#080e18" stroke-width="1.5"/>

  <!-- Gold Accent Fastener -->
  <circle cx="300" cy="370" r="7" fill="#d97706" stroke="#fbbf24" stroke-width="1.5"/>
</svg>
`;

export const SUIT_TEMPLATES: SuitTemplate[] = [
  {
    id: 'men-black-classic',
    nameEn: 'Classic Black Suit (White Shirt & Dark Tie)',
    nameAr: 'بدلة سوداء كلاسيكية (قميص أبيض وربطة داكنة)',
    category: 'men-suit',
    svgDataUri: svgToDataUri(svgClassicBlackSuit),
    aspectRatio: 600 / 520,
  },
  {
    id: 'men-navy-blue',
    nameEn: 'Premium Navy Blue Suit (White Shirt & Red Tie)',
    nameAr: 'بدلة كحلية فاخرة (قميص أبيض وربطة حمراء مزخرفة)',
    category: 'men-suit',
    svgDataUri: svgToDataUri(svgNavyRedTieSuit),
    aspectRatio: 600 / 520,
  },
  {
    id: 'men-charcoal-grey',
    nameEn: 'Charcoal Grey Wool Suit (Neat Tie Setup)',
    nameAr: 'بدلة صوفية رمادية فحمية (مع ربطة عنق أنيقة)',
    category: 'men-suit',
    svgDataUri: svgToDataUri(svgCharcoalGreySuit),
    aspectRatio: 600 / 520,
  },
  {
    id: 'men-black-tuxedo',
    nameEn: 'Luxury Satin Velvet Tuxedo & Bow Tie',
    nameAr: 'توكسيدو مخملي فاخر مع بابيون حريري',
    category: 'men-tuxedo',
    svgDataUri: svgToDataUri(svgBlackTuxedo),
    aspectRatio: 600 / 520,
  },
  {
    id: 'women-formal-blazer',
    nameEn: "Women's Executive Navy Blazer & Blouse",
    nameAr: 'سترة نسائية كحلية راقية مع قميص حريري',
    category: 'women-blazer',
    svgDataUri: svgToDataUri(svgWomenNavyBlazer),
    aspectRatio: 600 / 520,
  },
];
