// Electron preload: the bridge between the game (renderer) and the main process (see docs/desktop-build.md).
// CommonJS, since a sandboxed preload can't be an ES module. The game finds `window.bouncerbackDesktop`
// only in the desktop builds (src/desktop.js); nothing else is exposed: no ipcRenderer, no Node.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bouncerbackDesktop', {
  quit: () => ipcRenderer.send('quit')
})
