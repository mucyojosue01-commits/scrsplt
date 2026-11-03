# DualView

DualView is a lightweight Windows desktop companion for using one physical Android phone across two independent displays.

## Current features

- Mirror the phone's primary screen in a separate Windows window.
- Create an Android virtual display on the same physical phone and launch a different installed app there. Example: keep a music app on the phone while opening Android Settings on the PC.
- USB-first local connection; no cloud relay and no internet required for USB mirroring.
- Bundled ADB and scrcpy runtime; no Android Studio, Android Emulator, AVD, or multi-gigabyte system image.
- Smart Settings UI for audio forwarding, keep-awake, orientation, resolution, FPS, bitrate, fullscreen, screen-off, touch indicators and window behavior.
- Safe scrcpy CLI argument generation with validation and capability detection from the bundled scrcpy help output.
- Samsung DeX compatibility detection; unsupported models remain on the DualView virtual-display engine.

## Requirements

- Windows 10/11 x64.
- Physical Android phone running Android 10 (API 29) or newer for the secondary virtual display.
- USB data cable and Android Developer Options → USB debugging enabled.
- Approve the PC's RSA debugging prompt on the unlocked phone.

The virtual-display feature uses scrcpy's --new-display support. Android OEMs may restrict virtual displays or app launching; compatibility must be confirmed on the target phone. Some apps may not support secondary displays. Audio forwarding is optional and depends on Android version and device support. Samsung DeX is proprietary and limited to supported Galaxy models; detecting a Samsung phone alone does not mean DeX is available.

## Build

```bash
npm install
npm test
npm run dist:win
```

The Windows build workflow downloads the official scrcpy Windows archive and bundles scrcpy + ADB into the installer. The Android companion APK is not required. Video Bridge is an independent Windows browser window and uses the PC network connection (including Android USB tethering).
