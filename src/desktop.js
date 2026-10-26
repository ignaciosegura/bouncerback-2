// Desktop (Electron) builds. The preload bridge (electron/preload.cjs) only exists there, so in the
// browser and the native apps `isDesktop` is false and everything here is a no-op.
const bridge = window.bouncerbackDesktop

export const isDesktop = Boolean(bridge)

// Closes the game (the Main Menu's EXIT GAME button). The main process quits the app
export const quitDesktop = () => {
  bridge?.quit()
}
