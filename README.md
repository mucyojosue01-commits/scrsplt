# DualView

DualView is a Windows desktop application with an Android companion. It opens the connected phone display in a separate desktop video window, positioned on the left side of the PC desktop, while the DualView control panel remains available.

## What works in this milestone

- Windows desktop control panel built with Electron, React and TypeScript.
- Android companion APK with USB setup guidance.
- USB Android discovery through ADB.
- Phone screen/video mirroring through the official scrcpy runtime.
- The Windows installer bundles scrcpy and ADB so the PC does not need its own internet connection after the installer has been downloaded and installed.
- Phone and PC communicate over USB for mirroring. No hotspot or cloud relay is required.

## Install

1. Download and install `DualView-Setup-0.2.0.exe` from the GitHub Releases page.
2. Install `DualView-Android-Companion.apk` on the phone if you want the companion setup guide.
3. On Android, enable Developer options and USB debugging.
4. Connect the phone to Windows using a USB data cable, unlock it, and approve the USB debugging prompt.
5. Open DualView and select the detected phone, then choose **Start phone screen**.
6. The phone video opens in a separate window on the left side of the desktop. Use the phone itself to open and control the video app; the mirrored window displays the phone's current screen.

## PC internet requirement

The Windows installer includes ADB and scrcpy. Once the installer has been downloaded to the PC (for example, transferred using your phone), the PC does not need internet to mirror the phone over USB. The phone can continue using its own mobile data for online video.

## Development

- Node.js 20+
- Java 17+
- Gradle 8+
- Android SDK / Android Gradle Plugin

```bash
npm install
npm test
npm run build
npm run dist:win
gradle --no-daemon :android:assembleDebug
```

## Scope and limitations

This milestone mirrors the phone's live display in a separate Windows window; it does not yet create a second independent instance of a phone app or bypass app-level DRM / secure-screen capture restrictions. Some streaming services may show a black screen or block capture. The optional independent Android runtime on Windows and a dedicated video-only transport remain future work.

## Repository

The source code and automated build workflows are maintained in this repository. GitHub Actions builds the Windows installer and Android APK. Versioned Git tags generate a GitHub Release containing both installers.
