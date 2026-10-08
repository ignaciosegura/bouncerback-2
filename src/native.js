// Capacitor (iOS / Android) setup. Everything here is a no-op in the browser.
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { SplashScreen } from '@capacitor/splash-screen'

export const isNative = Capacitor.isNativePlatform()

// Call once at startup, after React has rendered the first screen
export function initNative () {
  if (!isNative) return
  // The manifest / Info.plist already allow landscape only; this keeps it locked at runtime too
  // The system bars start hidden (SystemBars in capacitor.config.json)
  ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {})
  // The splash stays up until the Intro has been painted, so there's no white flash
  requestAnimationFrame(() => requestAnimationFrame(() => {
    SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {})
  }))
  // Going to the background pauses the game, like a hidden tab: the GameEngine pauses on `blur`
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) window.dispatchEvent(new Event('blur'))
  })
}
