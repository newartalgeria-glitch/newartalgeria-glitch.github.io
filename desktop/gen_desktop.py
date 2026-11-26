#!/usr/bin/env python3
"""Generates the desktop (Electron + NSIS) wrapper folder for one app.
usage: gen_desktop.py <repo_dir> <slug> <ProductName> <appId> <code>"""
import sys, os, json

repo, slug, product, app_id, code = sys.argv[1:6]
d = os.path.join(repo, 'desktop')
os.makedirs(d, exist_ok=True)

def signed32(x):
    x &= 0xFFFFFFFF
    return x - (1 << 32) if x >= (1 << 31) else x

n = int(code)
h = signed32(signed32((n ^ 0x5A5A1234)) * 40503 + 12345)
file_stem = product.replace(' ', '-')

W = lambda name, s: open(os.path.join(d, name), 'w', encoding='utf-8').write(s)

W('package.json', json.dumps({
  "name": slug + "-desktop",
  "version": "1.0.0",
  "description": product + " - desktop edition (offline)",
  "author": "Nadir",
  "main": "main.js",
  "private": True,
  "devDependencies": {"electron": "^41.0.0", "electron-builder": "^26.0.0", "resedit": "^2.0.3"},
  "build": {
    "appId": app_id,
    "productName": product,
    "copyright": "Copyright © 2026 Nadir",
    "asar": False, "publish": None, "electronLanguages": ["fr", "ar", "en-US"],
    "directories": {"output": "release"},
    "files": ["main.js", "package.json", "icon.png", "web/**/*"],
    "afterPack": "afterPack.js",
    "win": {"target": [{"target": "nsis", "arch": ["x64"]}], "icon": "icon.ico", "signAndEditExecutable": False},
    "nsis": {
      "oneClick": False, "perMachine": False, "allowToChangeInstallationDirectory": True,
      "createDesktopShortcut": "always", "createStartMenuShortcut": True,
      "shortcutName": product, "installerIcon": "icon.ico", "uninstallerIcon": "icon.ico",
      "installerHeaderIcon": "icon.ico", "include": "installer.nsh", "language": "1036",
      "artifactName": file_stem + "-Setup.exe", "deleteAppDataOnUninstall": False,
      "runAfterFinish": True
    }
  }
}, indent=2))

W('main.js', r'''// %PRODUCT% - desktop edition. Runs the web app fully offline from local files.
const { app, BrowserWindow, shell, session, Menu } = require('electron')
const http = require('http')
const path = require('path')
const fs = require('fs')

const NAME = '%PRODUCT%'
const ROOT = path.join(__dirname, 'web')
const ICON = path.join(__dirname, 'icon.png')

// The app is served from a tiny local web server (127.0.0.1 only) so the browser engine behaves exactly like on the website:
// correct MIME types (.wasm for the face model), Range requests, caching.
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.data': 'application/octet-stream',
  '.binarypb': 'application/octet-stream', '.tflite': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
}
let ORIGIN = ''
function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const f = resolveFile('http://local' + req.url)
      if (!f) { res.writeHead(404); return res.end('Not found') }
      const size = fs.statSync(f).size
      const type = MIME[path.extname(f).toLowerCase()] || 'application/octet-stream'
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
      if (range) {
        const a = range[1] ? parseInt(range[1], 10) : 0
        const b = range[2] ? Math.min(parseInt(range[2], 10), size - 1) : size - 1
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 })
        return fs.createReadStream(f, { start: a, end: b }).pipe(res)
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' })
      fs.createReadStream(f).pipe(res)
    })
    srv.listen(0, '127.0.0.1', () => { ORIGIN = 'http://127.0.0.1:' + srv.address().port; resolve() })
  })
}
app.setName(NAME)
app.setAppUserModelId('%APPID%')
if (!app.requestSingleInstanceLock()) app.quit()

function resolveFile(urlStr) {
  let p = decodeURIComponent(new URL(urlStr).pathname)
  let f = path.normalize(path.join(ROOT, p))
  if (!f.startsWith(ROOT)) return null
  try {
    if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
  } catch { /* handled below */ }
  return fs.existsSync(f) ? f : null
}

function makeWindow(url, opts = {}) {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    show: false, autoHideMenuBar: true, backgroundColor: '#111111',
    title: 'Nadir - ' + NAME, icon: ICON,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: false, spellcheck: false },
    ...opts,
  })
  win.on('page-title-updated', (e) => e.preventDefault())
  win.once('ready-to-show', () => { win.maximize(); win.show() })
  win.webContents.setWindowOpenHandler(({ url: u }) => {
    if (u.startsWith(ORIGIN)) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: ICON, title: 'Nadir - ' + NAME } }
    if (/^(https?:|mailto:)/i.test(u)) shell.openExternal(u)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, u) => {
    if (!u.startsWith(ORIGIN)) { e.preventDefault(); if (/^(https?:|mailto:)/i.test(u)) shell.openExternal(u) }
  })
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault() }
    else if (input.key === 'Escape' && win.isFullScreen()) { win.setFullScreen(false) }
  })
  win.loadURL(url)
  return win
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  await startServer()
  // camera access is allowed for the app's own pages only
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === 'media' && wc.getURL().startsWith(ORIGIN)))
  session.defaultSession.setPermissionCheckHandler((wc, perm) => perm === 'media')
  let main = makeWindow(ORIGIN + '/index.html')
  app.on('second-instance', () => { if (main.isMinimized()) main.restore(); main.focus() })
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) main = makeWindow(ORIGIN + '/index.html') })
})
app.on('window-all-closed', () => app.quit())
'''.replace('%PRODUCT%', product).replace('%APPID%', app_id))

W('afterPack.js', r'''// Sets the icon and the Windows "Details" properties (name, publisher) on the .exe without needing Wine.
const fs = require('fs')
const path = require('path')

exports.default = async function (context) {
  const ResEdit = await import('resedit')
  const R = ResEdit.default || ResEdit
  const exeName = context.packager.appInfo.productFilename + '.exe'
  const exe = path.join(context.appOutDir, exeName)
  const data = fs.readFileSync(exe)
  const pe = R.NtExecutable.from(data)
  const res = R.NtExecutableResource.from(pe)
  const ico = R.Data.IconFile.from(fs.readFileSync(path.join(context.packager.projectDir, 'icon.ico')))
  R.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries, 1, 1033, ico.icons.map((i) => i.data))
  const vi = R.Resource.VersionInfo.fromEntries(res.entries)[0]
  const ver = context.packager.appInfo.version.split('.').map(Number)
  vi.setFileVersion(ver[0] || 1, ver[1] || 0, ver[2] || 0, 0, 1033)
  vi.setProductVersion(ver[0] || 1, ver[1] || 0, ver[2] || 0, 0, 1033)
  vi.setStringValues({ lang: 1033, codepage: 1200 }, {
    CompanyName: 'Nadir',
    FileDescription: context.packager.appInfo.productName + ' - Nadir',
    ProductName: context.packager.appInfo.productName,
    LegalCopyright: 'Copyright © 2026 Nadir',
    OriginalFilename: exeName,
    InternalName: context.packager.appInfo.productName,
  })
  vi.outputToResourceEntries(res.entries)
  res.outputResource(pe)
  fs.writeFileSync(exe, Buffer.from(pe.generate()))
}
''')

W('installer.nsh', r'''; Installation code page (asked before the files are installed).
; The code is never stored in clear text: only a one-way-ish number derived from it.
!include nsDialogs.nsh
!include LogicLib.nsh

!macro customInit
  ${If} ${Silent}
    Abort
  ${EndIf}
!macroend

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
  Page custom NadirCodeCreate NadirCodeLeave
  Var /GLOBAL NadirCodeField
  Function NadirCodeCreate
    !insertmacro MUI_HEADER_TEXT "%PRODUCT% - Nadir" "Code d'installation requis"
    nsDialogs::Create 1018
    Pop $0
    ${NSD_CreateLabel} 0 0 100% 24u "Entrez le code secret fourni par Nadir pour installer %PRODUCT%."
    Pop $0
    ${NSD_CreatePassword} 0 34u 50% 14u ""
    Pop $NadirCodeField
    ${NSD_CreateLabel} 0 56u 100% 24u "Le code est composé de chiffres uniquement."
    Pop $0
    nsDialogs::Show
  FunctionEnd
  Function NadirCodeLeave
    ${NSD_GetText} $NadirCodeField $0
    ${If} $0 == ""
      MessageBox MB_OK|MB_ICONEXCLAMATION "Veuillez saisir le code."
      Abort
    ${EndIf}
    IntOp $1 $0 + 0
    IntOp $2 $1 ^ 0x5A5A1234
    IntOp $2 $2 * 40503
    IntOp $2 $2 + 12345
    ${If} $2 <> %HASH%
      MessageBox MB_OK|MB_ICONSTOP "Code incorrect. L'installation ne peut pas continuer."
      Abort
    ${EndIf}
  FunctionEnd
!macroend
'''.replace('%PRODUCT%', product).replace('%HASH%', str(h)))

W('.gitignore', 'node_modules\nrelease\nweb\n')
print('ok', slug, 'hash', h)
