// Nadir Photo Lab - desktop edition. Runs the web app fully offline from local files.
const { app, BrowserWindow, protocol, net, shell, session, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')

const NAME = 'Nadir Photo Lab'
const ROOT = path.join(__dirname, 'web')
const ICON = path.join(__dirname, 'icon.png')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } },
])
app.setName(NAME)
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
    if (u.startsWith('app://')) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: ICON, title: 'Nadir - ' + NAME } }
    if (/^(https?:|mailto:)/i.test(u)) shell.openExternal(u)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, u) => {
    if (!u.startsWith('app://')) { e.preventDefault(); if (/^(https?:|mailto:)/i.test(u)) shell.openExternal(u) }
  })
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault() }
    else if (input.key === 'Escape' && win.isFullScreen()) { win.setFullScreen(false) }
  })
  win.loadURL(url)
  return win
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  protocol.handle('app', (req) => {
    const f = resolveFile(req.url)
    if (!f) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(f).toString())
  })
  // camera access is allowed for the app's own pages only
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === 'media' && wc.getURL().startsWith('app://')))
  session.defaultSession.setPermissionCheckHandler((wc, perm) => perm === 'media')
  let main = makeWindow('app://local/index.html')
  app.on('second-instance', () => { if (main.isMinimized()) main.restore(); main.focus() })
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) main = makeWindow('app://local/index.html') })
})
app.on('window-all-closed', () => app.quit())
