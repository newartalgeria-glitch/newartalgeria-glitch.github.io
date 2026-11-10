import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the app works under https://<user>.github.io/<repo>/
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Tailwind v4 emits oklch()/color-mix() colors that browsers older than
  // Chrome 111 (e.g. the last Chrome on Windows 7 / 8.1, Chrome 109) cannot
  // parse, which drops backgrounds and text colors. Down-level the CSS and JS
  // output for Chrome 109 so the UI renders correctly on those machines.
  css: {
    lightningcss: { targets: { chrome: 109 << 16 } },
  },
  build: {
    target: 'chrome109',
    cssTarget: 'chrome109',
    cssMinify: 'lightningcss',
  },
})
