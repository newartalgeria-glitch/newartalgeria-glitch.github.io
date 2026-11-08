# 📸 NadirPhotoLab - Professional Passport & Biometric Photo Studio

**NadirPhotoLab** is a 100% client-side web application designed specifically for photography studios, minilabs, and passport/ID photo processors. Built with **React 19**, **HTML5 Canvas API**, **Tailwind CSS v4**, and **jsPDF**, it requires **$0 backend hosting** and can be deployed freely to **GitHub Pages**, **Vercel**, or **Netlify**.

---

## 🌟 Key Features

### 1. 🛂 Global Biometric Passport Standards & Crop
- **Algeria / France / EU Schengen / UK (35x45 mm)**: Official 70%–80% head height ratio with light grey/blue background guidelines.
- **US Visa / DV Lottery (2x2 inches / 51x51 mm / 600x600 px)**: Official 1:1 square standard with 50%–69% head height ratio.
- **Saudi Arabia / Gulf (40x60 mm)**: Standard for Umrah, Hajj, and GCC visas.
- **Canada Passport (50x70 mm)**: Strict chin-to-crown measurement alignment.
- **Turkey (50x60 mm)** & **UAE (40x50 mm)** biometric dimensions.
- **Custom Dimensions**: Arbitrary width and height inputs with real-time aspect ratio lock.

### 2. 🇺🇸 Automated US DV Lottery & Visa Compliance Checker
- **Real-Time Validation Engine**:
  - ✅ **Dimensions Check**: Validates 600×600 px up to 1200×1200 px.
  - ✅ **Aspect Ratio Check**: Verifies strict 1:1 square aspect ratio.
  - ✅ **File Size Calculation**: Ensures file size is $\le 240\text{ KB}$ with JPEG optimization.
  - ✅ **Head Height Proportion**: Validates that head height occupies between 50% and 69% of the photo height.
  - ✅ **Eye Level Range**: Validates eye position between 56% and 69% from the bottom of the photo.
  - ✅ **sRGB 24-bit Color Depth**: Compliance check.
- **One-Click Auto-Fix for DV Lottery**: Instantly locks 1:1 ratio, activates official guidelines, sets white background, and prepares 600×600 px JPEG export.

### 3. 🟢 Chroma Key & Studio Background Removal Engine
- **Eyedropper Tool**: Pick any background color directly from the canvas with live loupe preview.
- **Tolerance & Edge Softness**: Fine-tune chroma threshold and feathering for smooth hair cutouts.
- **Green Despill Filter**: Automatically neutralizes green color bounce on subject hair and shoulders.
- **Instant Background Replacement**:
  - Solid studio colors: Pure White `#FFFFFF`, Biometric Light Grey `#E5E7EB`, Light Blue `#BFDBFE`, Off-White, Royal Blue `#1E3A8A`, Asian Red `#DC2626`.
  - Studio textures: Vignette Grey Spotlight, Royal Blue Studio, Warm Amber Sepia, Blurred Bokeh.
  - Custom user uploaded backgrounds.
  - Transparent PNG export.

### 4. 👔 Formal Attire & Suit Overlay Studio
- Built-in library of high-resolution formal vector suits:
  - Classic Black Business Suit with Burgundy Tie & White Shirt.
  - Navy Blue Executive Suit with Blue & Gold Striped Tie.
  - Charcoal Grey Modern Suit with Silk Tie.
  - Formal Black Evening Tuxedo with Pleated Shirt & Bow Tie.
  - White Collared Formal Dress Shirt with Tie.
  - Women's Tailored Executive Navy Blazer with Pearl Pendant.
- **Interactive Transform Controls**:
  - Drag suit directly over subject shoulders on canvas.
  - Scale, horizontal/vertical position, and fine angle rotation.
  - Horizontal flip.
  - Lighting tone matching (Brightness & Contrast sliders to match photo lighting).

### 5. 🖨️ Multi-Photo Grid Sheet Generator (Print Studio)
- **Paper Formats**:
  - **4x6 inches (10x15 cm)**: Standard photographic paper used in DNP, Epson, Canon Selphy photo printers.
  - **A4 (210x297 mm)**.
  - **5x7 inches (13x18 cm)**.
  - **US Letter (8.5x11 inches)**.
- **Grid Layouts**: Auto-align 2, 4, 6, 8, 12, or 16 photos per sheet.
- **Precision Cutting Guides**:
  - Dashed hairline cutting marks.
  - Solid lines.
  - Corner crop tick marks (Photoshop style).
- **Export Options**:
  - Direct browser printing at 300 DPI (`Ctrl + P`).
  - Ultra High-Resolution PNG (300 DPI).
  - Exact-dimension Print PDF via `jsPDF`.

### 6. 🌐 100% Bilingual Arabic & English (Full RTL/LTR Support)
- Tailored for photography studios in North Africa (Algeria, Morocco, Tunisia) and the Middle East, as well as international studios.
- Toggle anytime between Arabic (RTL) and English (LTR) with native typography.

---

## 🚀 Quick Start

### Development Mode
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
The compiled, optimized static application will be located in the `dist/` directory.

### Local Preview of Production Build
```bash
npm run preview
```

---

## 📦 Deployment (100% Free - Zero Server Costs)

Because **NadirPhotoLab** operates 100% client-side via JavaScript Canvas API:
- **GitHub Pages**: Upload the `dist/` folder or configure GitHub Actions to deploy automatically.
- **Vercel**: Run `vercel` or link your repository.
- **Netlify**: Drag and drop the `dist/` folder into the Netlify dashboard.

---

## 🔒 Privacy & Security
All photo processing (cropping, chroma-keying, suit fitting, export) runs strictly in the client's web browser. **No customer photos are ever uploaded to an external server or third-party service.**
