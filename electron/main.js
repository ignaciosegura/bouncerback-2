// Electron main process: the desktop wrapper around the web build in dist/ (see docs/desktop-build.md).
// It never touches game state: it only opens the window and serves the files.
import { app, BrowserWindow, Menu, net, protocol, screen, shell } from 'electron'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const SCHEME = 'app'
const START_URL = `${SCHEME}://bouncerback/index.html`

// The game is served from app://bouncerback/ rather than file://: fetch / XHR (Howler, the hashed
// asset URLs) work as on the web site, and localStorage gets one fixed origin
protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
}])

// X11 on Linux, also where Wayland is available: the Deck's Game Mode runs games through Xwayland,
// and the Steam overlay approach planned later needs X11
if (process.platform === 'linux') app.commandLine.appendSwitch('ozone-platform', 'x11')

function serveDist () {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url)
    const filePath = path.join(DIST, decodeURIComponent(pathname))
    // Nothing outside dist/ is ever served
    const relative = path.relative(DIST, filePath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return new Response('Not found', { status: 404 })
    }
    return net.fetch(pathToFileURL(filePath).toString())
  })
}

function createWindow () {
  const win = new BrowserWindow({
    title: 'Bouncerback',
    fullscreen: true,
    // Black from the first frame, so there's no white flash before the Intro is painted
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  // The credit links (target="_blank") open in the system browser, never in a second window
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://`)) event.preventDefault()
  })

  // F11 toggles fullscreen; Ctrl+Shift+I opens DevTools (test build convenience, reconsider before release)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen())
      event.preventDefault()
    } else if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  // Once the page has loaded, the GPU process has started and its status is the real one
  win.webContents.once('did-finish-load', writeLaunchInfo)
  win.loadURL(START_URL)
}

// A short report in the user-data folder (~/.config/Bouncerback/ on Linux), to check on the Deck,
// where there are no DevTools at hand, whether WebGL runs with hardware acceleration
async function writeLaunchInfo () {
  const display = screen.getPrimaryDisplay()
  const info = {
    date: new Date().toISOString(),
    app: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    platform: `${process.platform} ${process.arch}`,
    sessionType: process.env.XDG_SESSION_TYPE ?? null,
    display: { size: display.size, scaleFactor: display.scaleFactor },
    gpuFeatureStatus: app.getGPUFeatureStatus(),
    gpuInfo: await app.getGPUInfo('complete').catch((error) => String(error))
  }
  const file = path.join(app.getPath('userData'), 'launch-info.txt')
  await writeFile(file, JSON.stringify(info, null, 2)).catch(() => {})
}

Menu.setApplicationMenu(null)

app.whenReady().then(() => {
  serveDist()
  createWindow()
})

app.on('window-all-closed', () => app.quit())
