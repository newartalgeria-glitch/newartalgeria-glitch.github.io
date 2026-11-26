// Nadir Photo Lab - desktop edition. Runs the web app fully offline from local files.
const { app, BrowserWindow, shell, session, Menu } = require('electron')
const http = require('http')
const path = require('path')
const fs = require('fs')

const NAME = 'Nadir Photo Lab'
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
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('enable-unsafe-swiftshader')
app.setAppUserModelId('com.nadir.photolab')
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
