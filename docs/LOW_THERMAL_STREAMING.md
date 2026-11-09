# DualView low-thermal streaming architecture

## What is and is not offloaded

The Android device is the screen source and therefore cannot be a zero-work node. Android must capture the display and encode it before sending it over USB. DualView uses scrcpy's Android MediaCodec hardware encoder (H.264) on the phone and decodes/renders the compressed stream on the Windows PC. The companion APK is not in the frame pipeline and remains an idle setup/help surface.

Do **not** send raw RGBA frames over USB. A 1280x720 RGBA frame is 3.52 MiB; at 15 fps that is about 52.7 MiB/s (443 Mb/s) before transport overhead. 1920x1080 at 30 fps is about 237 MiB/s (1.99 Gb/s). USB 2.0 practical throughput is far below this. Raw capture would also force large copies and increase memory bandwidth, heat and battery drain. The correct boundary is hardware H.264 encode on Android, transport compressed packets, PC-side decode and render.

## Implemented changes

- Default stream profile is **Cool**: max-size 960, 15 fps, 1.2 Mbps, H.264, audio disabled.
- Balanced: max-size 1280, 24 fps, 2 Mbps, H.264, audio disabled.
- Quality: max-size 1920, 30 fps, 4 Mbps, H.264, audio disabled.
- Both phone mirroring and secondary-display sessions receive the selected profile.
- Windows remains responsible for H.264 decoding, window composition and display rendering.
- Companion app copy explicitly states that it does not capture, encode, decode or buffer frames.
- Existing scrcpy implementation owns its bounded packet/frame queues. DualView does not introduce raw frame arrays, per-frame Kotlin objects, Bitmap copies, or a second in-memory video queue.
- Existing resource telemetry reports Android available memory and thermal sensor temperatures when the device exposes them.

## Thermal and memory operating guidance

For a Galaxy A06 / 4 GB RAM device, start with Cool and close demanding foreground apps. Keep the phone ventilated and do not charge it during long high-load sessions if it is heating. If temperature continues rising, stop the session; software cannot guarantee a safe temperature or prevent an OEM thermal shutdown. A thermal sensor value may be unavailable or may not represent battery temperature, so it is telemetry, not a safety certification.

The current implementation exposes explicit profiles, not a claimed automatic thermal controller. Dynamic profile switching requires restarting the scrcpy session (scrcpy does not offer a safe universal live bitrate/FPS setter through this integration); the UI must not imply that a temperature threshold is automatically enforced.

For memory, do not call System.gc() periodically. It is not a reliable memory limit and can cause pauses. The app avoids unbounded frame queues and keeps the companion idle. The Android encoder and Android system still consume memory; PC RAM cannot be used as Android RAM. Device memory availability varies with One UI, foreground apps and system services.

## Validation checklist

1. Build the Windows installer and companion APK.
2. On the A06, test Cool profile for 10 minutes while recording battery/thermal sensor telemetry and checking for dropped frames, disconnects and reboots.
3. Repeat with screen off/on and with/without USB charging; stop immediately if temperature rises sharply or the phone becomes unstable.
4. Compare Balanced only after Cool is stable. Do not use Quality as the baseline on this device.
5. Confirm Windows process memory remains bounded during a 20-minute session and that stopping the stream releases the scrcpy process.
6. Test secondary display separately from ordinary mirroring: a virtual display can add Android compositor and app workload beyond simple mirroring.

A green CI build validates compilation and packaging only. It does not validate thermals on a physical Galaxy A06.
