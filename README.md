# DualView

DualView is a Windows desktop application with two Android modes: mirror a physical phone over USB, or launch an independent Android virtual device on the PC.

## Feature 1: Phone screen over USB

- Windows desktop control panel built with Electron, React and TypeScript.
- USB Android discovery through the bundled ADB runtime.
- Phone screen/video mirroring through the official scrcpy runtime.
- The Windows installer bundles scrcpy and ADB, so the PC does not need internet after the installer has been transferred and installed.
- Phone and PC communicate over USB for mirroring. No hotspot or cloud relay is required.

## Feature 2: Android on PC

- The **Android on PC** workspace detects an installed Android SDK Emulator and lists available Android Virtual Devices (AVDs).
- Select an AVD and start it directly from DualView; close it from DualView as well.
- This is an independent Android virtual phone running on Windows, not a mirror of the physical phone.
- Requires Android Studio / Android SDK with the Android Emulator component and at least one AVD created in Device Manager.
- DualView detects the standard Windows SDK locations and the `ANDROID_HOME` / `ANDROID_SDK_ROOT` environment variables.
- Create and boot the AVD once while the required Android system image is available. After the system image is installed, the emulator can run offline.
- Android inside the emulator uses the PC's network. To use the phone's mobile data when the PC has no separate internet, enable USB tethering on the connected phone. Initial Android system-image downloads are large and must be prepared before going offline.

## Install

1. Download the Windows installer from the GitHub Releases page.
2. Install and open DualView.
3. For physical-phone mirroring, enable Developer options → USB debugging on the phone, connect by USB, approve the debugging prompt, then use **Phone screen** → **Start phone screen**.
4. For an independent virtual phone, install Android Studio with Android Emulator, create an AVD in Tools → Device Manager, then open **Android on PC** in DualView and press **Start Android on PC**.

## Physical phone / PC internet

The Windows installer includes ADB and scrcpy. Once the installer has been downloaded to the PC (for example, transferred using your phone), the PC does not need internet to mirror the phone over USB. The phone can continue using its own mobile data for online video in the mirrored phone screen.

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

Android on PC uses the official Android Emulator installed on the Windows computer; DualView does not bundle a multi-gigabyte Android system image or Android Studio. AVD creation and first system-image installation are one-time setup steps. Emulator performance depends on PC hardware and hardware virtualization being enabled in BIOS/UEFI. Some streaming apps may restrict playback or screen capture in virtual devices.

The separate **Video bridge** feature remains the next milestone.

## Repository

The source code and automated build workflows are maintained in this repository. GitHub Actions builds the Windows installer and Android companion APK. Versioned Git tags generate a GitHub Release containing both installers.
