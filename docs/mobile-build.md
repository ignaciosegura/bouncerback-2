# Bouncerback — Mobile test builds

Where the debug builds of the iOS and Android apps end up, and how to build and launch them from the command line. These are builds for testing on simulators, emulators and your own devices, not store releases (those need signing: see "Not covered").

Setup (Xcode, Android Studio, JDK 21, `ANDROID_HOME`, `JAVA_HOME`) is in `docs/tech-stack.md`, section 4. The Capacitor decisions are in `docs/implementation-plan.md`, Phase 10.

---

## Where the builds are

| Platform | Build | Location |
| :--- | :--- | :--- |
| Android | Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| iOS | Simulator app | `<derivedDataPath>/Build/Products/Debug-iphonesimulator/App.app` |

- The Android APK is inside the repo and git-ignored. Gradle recreates it on every build.
- The iOS app goes wherever `-derivedDataPath` points. The commands below use `/tmp/bb-ios`, which the system may clear on a reboot: just build again. Building from Xcode puts it in `~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator/`.
- The iOS simulator build only runs in the iOS Simulator. Running on a real iPhone needs a signed build from Xcode (see "Not covered").

---

## Before either build: put the web code into the native projects

The native apps hold a copy of the web build, so every change to `src/` or `assets/` needs this before rebuilding:

```
npm run cap:sync
```

It runs `vite build` and `cap sync` (copies `dist/` into `android/` and `ios/` and updates the plugins). Other scripts:

| Script | What it does |
| :--- | :--- |
| `npm run cap:ios` | Sync, then open the project in Xcode |
| `npm run cap:android` | Sync, then open the project in Android Studio |
| `npm run build:android-install` | Sync, then build the debug APK and install it on the running emulator or connected device (`./gradlew installDebug`) |
| `npm run cap:assets` | Regenerate the native icons and splash from `assets/native/` |

---

## Android

Needs `ANDROID_HOME` and `JAVA_HOME` (JDK 21) set, see `docs/tech-stack.md`.

**Build the APK**

```
cd android
./gradlew assembleDebug
```

**Build and install on a running emulator or a connected device**

```
./gradlew installDebug
```

**Start an emulator** (names come from `emulator -list-avds`):

```
emulator -avd Pixel_8_Pro
adb wait-for-device
```

**Launch the app** (after installing):

```
adb shell am start -n com.bouncerback.app/.MainActivity
```

**Install an existing APK without building**

```
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Choose the target device**

`adb devices` lists the connected devices and emulators. The first column is the serial (for example `R58M123ABC` or `emulator-5554`).

- Gradle has no device flag. `installDebug` reads the `ANDROID_SERIAL` environment variable:

  ```
  ANDROID_SERIAL=R58M123ABC ./gradlew installDebug
  ```

  Or set it for the whole shell session: `export ANDROID_SERIAL=emulator-5554`.
- With one device connected, nothing needs setting. With several and no `ANDROID_SERIAL`, `installDebug` installs on all of them.
- `adb` commands take `-s <serial>` instead (for example `adb -s emulator-5554 install -r ...`). With more than one device listed, add it to every `adb` command.
- Capacitor can pick the target too: `npx cap run android --list` shows the targets and `npx cap run android --target <serial>` runs on one.
- Wireless devices: run `adb pair <ip:port>`, then `adb connect <ip:port>`. They then show up in `adb devices` like any other.

**Device shows `unauthorized` in `adb devices`**

The device has not accepted this computer's ADB key yet.

1. Unlock the device and accept the "Allow USB debugging?" dialog. Tick "Always allow from this computer".
2. No dialog: `adb kill-server`, then `adb start-server`, then `adb devices`. Unplug and replug the cable if needed.
3. Still no dialog: Settings > Developer options > "Revoke USB debugging authorizations", replug the cable and accept the new prompt.
4. Some phones only show the prompt in "File transfer" USB mode, not "Charging only". Switching USB debugging off and on in Developer options also re-triggers it.

When the list shows `device` instead of `unauthorized`, the device is ready.

Notes:
- Stop the app: `adb shell am force-stop com.bouncerback.app`.
- Console messages: `adb logcat -s chromium Capacitor`.
- The first time the system bars hide, Android shows a "Viewing full screen" hint: tap "Got it".

---

## iOS (Simulator)

**Build** (from the repo root):

```
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/bb-ios build
```

The first build downloads the Capacitor Swift package, so it needs network access and takes a few minutes. Run it in a normal terminal: in a restricted or sandboxed shell, the "Resolve Package Graph" step can hang.

**Start a simulator** (names and IDs from `xcrun simctl list devices available`):

```
xcrun simctl boot "iPhone 17"
open -a Simulator
```

**Install and launch**

```
xcrun simctl install booted /tmp/bb-ios/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.bouncerback.app
```

Notes:
- `booted` means the simulator that is currently running. With several running, use its ID instead.
- Stop the app: `xcrun simctl terminate booted com.bouncerback.app`.
- Screenshot: `xcrun simctl io booted screenshot shot.png`. The image comes in the device's portrait orientation, so the landscape game appears rotated.
- Console messages: `xcrun simctl spawn booted log stream --predicate 'process == "App"'`.
- Or skip the command line: `npm run cap:ios`, then press Run in Xcode with an iPhone simulator selected.

---

## Native changes made by hand

These edits are inside the generated projects. Keep them if the platform folders are ever regenerated:

- Android: `screenOrientation="sensorLandscape"` in `AndroidManifest.xml`; the black window background, the display cutout mode and the black system splash in `res/values/styles.xml` (with `res/drawable/splash_icon_empty.xml`); the default vector icon files removed so the generated adaptive icon is used.
- iOS: portrait removed from `UISupportedInterfaceOrientations` (iPhone and iPad) in `Info.plist`.

---

## Not covered

- **Real iPhone:** a signed build from Xcode, with an Apple developer team selected under Signing & Capabilities.
- **Store releases:** a signed Android App Bundle (`./gradlew bundleRelease` with a keystore) and an iOS archive. Neither has been set up yet.
