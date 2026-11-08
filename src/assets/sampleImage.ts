// High-resolution vector portrait against green screen for instant chroma-key testing
const svgSamplePortrait = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <!-- Chroma Key Green Background -->
    <linearGradient id="greenScreen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00e600"/>
      <stop offset="100%" stop-color="#00cc00"/>
    </linearGradient>

    <!-- Skin Tones -->
    <radialGradient id="skinFace" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#ffd5b8"/>
      <stop offset="70%" stop-color="#f5be98"/>
      <stop offset="100%" stop-color="#e09c6f"/>
    </radialGradient>
    <linearGradient id="skinNeck" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#d98f62"/>
      <stop offset="50%" stop-color="#e8a87c"/>
      <stop offset="100%" stop-color="#d08453"/>
    </linearGradient>

    <!-- Hair Tone -->
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3b2413"/>
      <stop offset="60%" stop-color="#23140a"/>
      <stop offset="100%" stop-color="#140a04"/>
    </linearGradient>

    <!-- T-Shirt -->
    <linearGradient id="shirtCasual" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Green Screen Studio Backdrop -->
  <rect width="600" height="600" fill="url(#greenScreen)"/>

  <!-- Casual Shoulders / Torso -->
  <path d="M 60 600 L 540 600 L 510 460 Q 440 400 370 385 L 230 385 Q 160 400 90 460 Z" fill="url(#shirtCasual)"/>
  <!-- T-shirt collar line -->
  <path d="M 240 385 Q 300 440 360 385" fill="none" stroke="#1e293b" stroke-width="4"/>

  <!-- Neck -->
  <path d="M 252 320 L 252 405 Q 300 425 348 405 L 348 320 Z" fill="url(#skinNeck)"/>

  <!-- Head Base (Oval - exact DV lottery proportions) -->
  <!-- Center at X:300, Y:270, Width:190, Height:240 -->
  <ellipse cx="300" cy="270" rx="95" ry="122" fill="url(#skinFace)" filter="url(#softShadow)"/>

  <!-- Ears -->
  <ellipse cx="198" cy="275" rx="14" ry="24" fill="#e8a87c"/>
  <ellipse cx="198" cy="275" rx="8" ry="14" fill="#cf865a"/>
  <ellipse cx="602" cy="275" rx="14" ry="24" fill="#e8a87c"/>
  <ellipse cx="402" cy="275" rx="14" ry="24" fill="#e8a87c"/>
  <ellipse cx="402" cy="275" rx="8" ry="14" fill="#cf865a"/>

  <!-- Hair (Top & Sides) -->
  <path d="M 195 240 Q 185 160 250 140 Q 300 130 350 140 Q 415 160 405 240 Q 375 165 300 165 Q 225 165 195 240 Z" fill="url(#hairGrad)"/>
  <!-- Hair volume top -->
  <path d="M 210 170 Q 240 120 300 120 Q 360 120 390 170 Q 340 140 300 140 Q 260 140 210 170 Z" fill="url(#hairGrad)"/>

  <!-- Eyebrows (Eye level around Y=260) -->
  <path d="M 235 240 Q 260 234 275 242" stroke="#23140a" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <path d="M 365 240 Q 340 234 325 242" stroke="#23140a" stroke-width="4.5" stroke-linecap="round" fill="none"/>

  <!-- Eyes (Eye level exact 60% from bottom -> Y=260) -->
  <!-- Left Eye -->
  <ellipse cx="258" cy="260" rx="15" ry="8" fill="#ffffff" stroke="#d1d5db" stroke-width="0.5"/>
  <circle cx="258" cy="260" r="6" fill="#45270c"/>
  <circle cx="258" cy="260" r="3" fill="#000000"/>
  <circle cx="256" cy="258" r="1.5" fill="#ffffff"/> <!-- catchlight -->
  <path d="M 242 258 Q 258 250 274 258" stroke="#3b2413" stroke-width="2" fill="none"/>

  <!-- Right Eye -->
  <ellipse cx="342" cy="260" rx="15" ry="8" fill="#ffffff" stroke="#d1d5db" stroke-width="0.5"/>
  <circle cx="342" cy="260" r="6" fill="#45270c"/>
  <circle cx="342" cy="260" r="3" fill="#000000"/>
  <circle cx="340" cy="258" r="1.5" fill="#ffffff"/> <!-- catchlight -->
  <path d="M 326 258 Q 342 250 358 258" stroke="#3b2413" stroke-width="2" fill="none"/>

  <!-- Nose -->
  <path d="M 300 255 L 297 295 Q 290 304 300 305 Q 310 304 303 295 Z" fill="#d98f62" opacity="0.6"/>
  <ellipse cx="293" cy="302" rx="3" ry="1.5" fill="#b86b3b"/>
  <ellipse cx="307" cy="302" rx="3" ry="1.5" fill="#b86b3b"/>

  <!-- Neutral Mouth (Biometric passport requirement: closed lips, neutral expression) -->
  <path d="M 278 335 Q 300 338 322 335" stroke="#9a3412" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M 284 340 Q 300 348 316 340" fill="#c2410c" opacity="0.5"/>
</svg>
`;

export const SAMPLE_PORTRAIT_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(svgSamplePortrait.trim())}`;
