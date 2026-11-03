# DualView Mobile

This is the **phone-to-phone Android application**, kept deliberately separate from the Windows desktop application.

## Repository boundaries

- `electron/`, `src/`, root `package.json`, and root `android/` belong to the existing **DualView Desktop** product.
- `mobile-android/` is the independent **DualView Mobile** Gradle project.
- Mobile build output and release artifacts must use a separate workflow and naming prefix (`DualView-Mobile`). Never replace or reuse the Windows installer or desktop companion APK.

## Product target

Phone A is the host. It runs installed Android apps on an independent virtual display. Phone B is the client display: it receives the rendered display and returns user input. App packages and private app data remain on Phone A. Phone-to-phone mirroring is a later, separate mode.

Preferred transport is local Wi-Fi. USB/OTG is an additional transport where both devices support USB host/device roles. Bluetooth is for discovery/pairing metadata only, not video frames.

## Important Android platform constraint

The current AOSP VirtualDeviceManager reference implementation demonstrates this exact host/client architecture, including app launching on virtual displays, display streaming, and input forwarding. However, its documented host prerequisites are a **rooted Android 14+ userdebug/eng device**; the client baseline is Android 13+, and both example devices require Wi-Fi Aware. The host app is installed as a privileged system app in the AOSP sample. A normal third-party app permission prompt, Accessibility approval, or MediaProjection consent does not grant those privileged VirtualDeviceManager capabilities.

Therefore this starter does not pretend that ordinary stock Android phones can host arbitrary apps on a secondary display. Host capability must be verified on each device before enabling the feature. The Samsung Galaxy A06 is not assumed to be a supported host. We will keep a compatibility gate and never silently fall back to mirroring while labeling it an independent display.

Reference implementation and prerequisites:
- AOSP VirtualDeviceManager demo: https://android.googlesource.com/platform/development/+/main/samples/VirtualDeviceManager/README.md
- Android ADB documentation: https://developer.android.com/tools/adb

## Current implementation status

This is the isolated Android project foundation and role/compatibility shell only. It is **not yet a functioning phone-to-phone display stream**. The next engineering milestone is a supported host backend and client transport/decoder, based on device capability rather than unsafe permission assumptions.
