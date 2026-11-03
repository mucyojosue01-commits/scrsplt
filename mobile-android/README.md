# DualView Mobile

**DualView Mobile is a separate Android-to-Android product.** It must never share, move, or overwrite files in the Windows Desktop app or the root `android/` companion project.

## Product target

- **Phone A — Host:** installed apps and private app data remain on Phone A.
- **Phone B — Client display:** receives a live display stream and returns touch/keyboard input.
- **Mode B — Independent display:** selected Phone A apps run on a second virtual display while Phone A remains usable independently. This is the priority.
- **Mode C — Mirroring:** duplicates Phone A's current screen as a separate optional mode. It is not a substitute for Mode B.
- **Transport:** local Wi-Fi first; USB/OTG where Android device roles and implementation permit. Bluetooth is only for discovery/pairing metadata, never video.

## scrcpy-style technical direction

The intended architecture is deliberately close to scrcpy:

1. The owner enables Android Wireless debugging on Phone A and starts a trusted ADB-shell bridge (Shizuku is the initial optional bridge).
2. DualView checks shell authorization and interrogates the actual Android firmware before enabling host features.
3. A small host-side agent, started with the owner's authorization, will create/manage the secondary display, launch selected packages onto it, capture the display using Android's hardware video encoder (MediaCodec), and stream encoded frames over a paired local connection.
4. Phone B will decode the stream with MediaCodec onto a dedicated display surface and send normalized touch, key and navigation events back to Phone A.
5. Pairing must authenticate both devices; streaming should use an authenticated encrypted channel. No open unauthenticated control port.
6. Host-side app data stays on Phone A. No APK or private app-data cloning to Phone B.

The Shizuku integration currently included is a **real shell-authorization and diagnostic bridge**. The Host screen explains Wireless debugging/Shizuku setup, requests permission, and runs read-only diagnostics (`id`, Android build properties and `cmd display help`). This is not yet the virtual-display server or streaming implementation.

## Android reality and compatibility

A stock Android app cannot grant itself the privileged APIs needed to create arbitrary virtual displays, start arbitrary apps on them, capture protected surfaces, or inject system-wide input. Ordinary Accessibility or MediaProjection prompts do not grant all of those capabilities.

The AOSP VirtualDeviceManager sample documents a privileged host setup (rooted Android 14+ userdebug/eng host with privileged installation) and a separate client baseline. OEM production firmware can impose further restrictions. Shizuku may expose useful shell operations on some devices, but shell access does not guarantee that every required API/command is present or allowed. The app must probe actual capabilities and report them; never assume Android version alone means compatible.

**The Samsung Galaxy A06 is not presumed to support independent-display hosting.** Its exact firmware must pass the host diagnostics and a real create-display/launch/capture/input test before being marked supported. DRM/secure windows may remain uncapturable.

## Current implementation

- Separate Android Gradle project and APK workflow under `mobile-android/`.
- Phone A / Phone B role screens and distinct Mode B / Mode C descriptions.
- Local IPv4 information.
- Optional Shizuku provider and shell-permission flow for Phone A.
- Read-only host diagnostics to inspect shell identity, build type and display command help.
- No fake “connected” state and no silent mirroring fallback.

## Remaining engineering milestones

1. **Host proof-of-capability:** build and validate a small host agent on a known-compatible rooted/userdebug device; create a secondary display, launch a chosen installed package there, and capture it while the primary display remains independent.
2. **scrcpy-like stream:** hardware H.264/H.265 encode on Phone A, authenticated Wi-Fi transport, MediaCodec decode on Phone B, adaptive bitrate/FPS/resolution and reconnect handling.
3. **Remote input:** map client touch coordinates and key events to the virtual display; gate system-wide input behind the authorized host bridge.
4. **Pairing and security:** QR/manual pairing, per-device keys, encrypted session, explicit disconnect/revoke, no public-network exposure.
5. **Mode C mirroring:** implement separately with Android MediaProjection consent.
6. **Device validation:** test on actual OEM devices; publish a compatibility matrix and only enable controls that pass.

## Build

From this directory:

```bash
gradle --no-daemon :app:assembleDebug
```

GitHub Actions publishes the artifact as `DualView-Mobile-Android-Debug`. It does not touch the desktop installer or root Android companion APK.

## References

- AOSP VirtualDeviceManager sample: https://android.googlesource.com/platform/development/+/main/samples/VirtualDeviceManager/README.md
- Android ADB: https://developer.android.com/tools/adb
- Shizuku: https://shizuku.rikka.app/
- scrcpy architecture/reference: https://github.com/Genymobile/scrcpy
