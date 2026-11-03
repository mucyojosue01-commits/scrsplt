# DualView

DualView is a Windows desktop companion for using one physical Android phone across two displays.

## Current workflow
- Mirror the phone's physical screen in a Windows window.
- Open an Android virtual display in a second Windows window.
- The second window opens Android's own home/launcher screen. Open apps using the launcher inside that Android window; DualView no longer asks you to pick an app or uses its unreliable nine-dot app picker.
- Apps remain installed on the phone and run on the phone's Android system.
- Direct USB connection; no cloud relay or Android emulator/system image.

## PC resource engine
DualView reports Windows RAM usage and CPU core availability and uses the PC for its own desktop work, window rendering, video transport and supported processing tasks. **Windows RAM is not transparently added to Android RAM:** Android app code and app memory still execute on the phone. Moving arbitrary Android app execution to Windows would require app-specific remote execution or a different Android runtime, which would violate the requirement to keep the phone's Android system.

## Requirements
- Windows 10/11 x64.
- Android 10 (API 29) or newer for the secondary virtual display.
- USB data cable, USB debugging enabled, and PC authorization accepted on the phone.
- Some manufacturers or apps may restrict virtual displays. The Android launcher must support secondary displays on the target phone.

## Build
`npm install`, `npm test`, `npm run dist:win`.
The CI workflow downloads official scrcpy Windows tools and bundles them into the installer.
