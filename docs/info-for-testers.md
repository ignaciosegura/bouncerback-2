# Info for Testers

Useful tricks and information for testing the game.

---

## End-of-level interstitials

Until the real pictures exist, no level names one. To try the feature, put any PNG in `assets/interstitials/` (ideally 1920x1080) and name it in a level file, for example in `src/levels/level1.json`:

```json
"youWinInterstitial": "test.png",
"gameOverInterstitial": "test.png"
```

Then run `npm run validate:levels` and `npm run dev`. To get there quickly, shorten the level (`duration`) for a win, or set `lives` to 1 for a loss. Don't commit the test picture or the level changes. See "End-of-level interstitials" in `graphical-specs.md`.

## Level unlocking

Only the first tier of levels (LEARN) is unlocked on a fresh install. Each further tier unlocks when every level of the tier before it has been beaten (see "Level unlocking" in `game-rules.md`). The progress is saved on the device, under the `localStorage` key `bouncerback.levelProgress`.

### Konami Code (recommended)

With a game controller connected, go to Level Select and press **up, up, down, down, left, right, left, right** on the d-pad (no B A at the end). Every level unlocks at once. Enter the code again with every level unlocked and the progress goes back to a fresh install's: only the first tier unlocked, no levels beaten (the high score and the settings are kept). After the reset, LEARN blinks again as a level still to beat.

It works the same on the web and on the Android and iOS apps, in every build, and the result is saved like normal progress. If it doesn't react, check that the controller drives the menus (the selection moves with the d-pad) and enter it again: any other button or a stick push starts the code over. See "Menus" in `game-controller.md`.

Without a controller, use the methods below.

### Web browser

Your own browser starts at tier 0, like a fresh install. To unlock everything for testing, open the browser's developer tools on the game's page and set `bouncerback.levelProgress` to `{"unlockedTier":2,"beatenLevels":[1,2,3,4]}` in local storage. From the console:

```js
localStorage.setItem('bouncerback.levelProgress', '{"unlockedTier":2,"beatenLevels":[1,2,3,4]}')
```

Then reload the page. The numbers match the current level files (three tiers, 0 to 2, and level 5 alone in the last one): if the tiers change, adjust them.

To start again from a fresh install, delete the key (`localStorage.removeItem('bouncerback.levelProgress')`) and reload.

### Mobile apps (Android and iOS)

This can't be done the same way on the mobile apps: they have no address bar or developer tools of their own, and their storage is separate from any browser's. The options are:

- **Debug builds** (see `mobile-build.md`): the app's web view can be inspected from a computer, which gives you the same console as on the web.
  - Android (emulator, or a device connected by USB with USB debugging on): open `chrome://inspect` in Chrome on the computer, find the Bouncerback web view and click "inspect".
  - iOS Simulator: in Safari on the Mac, turn on the Develop menu (Safari > Settings > Advanced > "Show features for web developers"), then choose Develop > the simulator > Bouncerback.
  - Run the same `localStorage.setItem(...)` line in the console, then reload the web view from the console (`location.reload()`) or close and reopen the app.
- **Release builds** (store or TestFlight versions): they can't be inspected, so the levels have to be unlocked by playing them.

To start again from a fresh install on mobile, clear the app's data (Android: Settings > Apps > Bouncerback > Storage > Clear storage) or uninstall and reinstall it. Either way, the high score and the settings are reset too.
