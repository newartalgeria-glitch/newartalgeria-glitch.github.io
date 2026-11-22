// Builds the offline web bundle: same app, but with the fonts bundled (no Google Fonts), no ads, no site metadata.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const repo = path.resolve(import.meta.dirname, '..')
const stage = path.join(import.meta.dirname, '_stage')
fs.rmSync(stage, { recursive: true, force: true })
fs.mkdirSync(stage)
for (const f of fs.readdirSync(repo)) {
  if (['.git', 'dist', 'desktop', 'node_modules'].includes(f)) continue
  fs.cpSync(path.join(repo, f), path.join(stage, f), { recursive: true })
}
fs.symlinkSync(path.join(repo, 'node_modules'), path.join(stage, 'node_modules'))

// fonts: every family used by the app, bundled from @fontsource (latin + arabic, weights 400/600/700 when they exist)
const fams = ['almarai','amiri','bebas-neue','cairo','changa','cinzel','el-messiri','inter','lateef','lato','montserrat','noto-kufi-arabic','open-sans','oswald','pacifico','playfair-display','poppins','raleway','readex-pro','reem-kufi','roboto','rubik','scheherazade-new','tajawal']
let css = ''
for (const f of fams) for (const sub of ['latin', 'arabic']) for (const w of [400, 600, 700]) {
  const file = `${sub}-${w}.css`
  if (fs.existsSync(path.join(repo, 'node_modules/@fontsource', f, file))) css += `import '@fontsource/${f}/${file}'\n`
}
fs.writeFileSync(path.join(stage, 'src/desktop-fonts.ts'), css)
const main = path.join(stage, 'src/main.tsx')
fs.writeFileSync(main, `import './desktop-fonts'\n` + fs.readFileSync(main, 'utf8'))
const idx = path.join(stage, 'index.html')
let html = fs.readFileSync(idx, 'utf8')
html = html.replace(/<link[^>]*(fonts\.googleapis|fonts\.gstatic)[^>]*>\s*/g, '')
  .replace(/<meta name="google-adsense-account"[^>]*>\s*/g, '')
  .replace(/<script src=".\/ads-config.js"><\/script>\s*/g, '')
fs.writeFileSync(idx, html)

execSync('npx vite build', { cwd: stage, stdio: 'inherit' })
const web = path.join(import.meta.dirname, 'web')
fs.rmSync(web, { recursive: true, force: true })
fs.cpSync(path.join(stage, 'dist'), web, { recursive: true })
for (const f of ['robots.txt', 'sitemap.xml', 'ads.txt', 'googled97d035c7c939866.html']) fs.rmSync(path.join(web, f), { force: true })
fs.writeFileSync(path.join(web, 'ads-config.js'), "window.ADSENSE_CLIENT = ''\n")
fs.rmSync(stage, { recursive: true, force: true })
console.log('web bundle ready:', web)
