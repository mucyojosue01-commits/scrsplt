# DualView

DualView is a native Windows desktop application with an Android companion for connecting a real Android phone to a Windows PC.

## Current milestone

The Windows shell is built with Electron + React + TypeScript. It detects Android devices through Android Debug Bridge (ADB), checks whether scrcpy is installed, and launches a real USB screen-mirroring/control session when both are available.

This is a desktop application, not a website.

## Requirements for the first USB mirror

- Windows 10/11
- Samsung Galaxy A06 (or another Android device)
- USB data cable
- Android Developer options and USB debugging enabled
- Android Platform Tools (ADB) installed and available on PATH
- scrcpy installed and available on PATH

DualView does not require the PC to have internet to mirror over USB. Downloading/installing ADB and scrcpy requires internet once; the phone and PC communicate locally over USB during use.

## Development

- Node.js 20+
- npm

```bash
npm install
npm run dev
npm test
npm run build
```

## Build the Windows installer

```bash
npm run dist:win
```

The installer is generated in `release/`.

## Roadmap

1. Windows desktop shell and USB device discovery/mirroring.
2. Android companion app and secure pairing.
3. Direct phone-to-PC video forwarding over USB, where source-app and DRM restrictions allow it.
4. Optional local wireless pairing.
5. Independent Android runtime on Windows (separate from the phone's installed apps).

### Important limitations

Ordinary Android screen mirroring follows the phone's current display. It does not create an independent copy of an app. Some DRM-protected video apps block screen capture. DualView will clearly report these limitations rather than claiming universal support.
