package com.dualview.mobile

import android.content.pm.PackageManager
import rikka.shizuku.Shizuku

/**
 * Optional, user-authorized Shizuku capability check.
 *
 * This intentionally does not claim that shell access creates an Android
 * virtual display. A dedicated Shizuku UserService backend is the next step
 * for running the host-side display controller.
 */
object HostBridge {
    private const val REQUEST_CODE = 4107

    fun isRunning(): Boolean = Shizuku.pingBinder()

    fun hasShellPermission(): Boolean =
        isRunning() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED

    fun requestPermission() {
        if (isRunning() && !hasShellPermission()) {
            Shizuku.requestPermission(REQUEST_CODE)
        }
    }

    fun diagnostics(): String {
        if (!isRunning()) {
            return "Shizuku is not running. Install and start Shizuku on Phone A using Android Wireless debugging, then return here."
        }
        if (!hasShellPermission()) {
            return "Shizuku is running, but DualView has not been granted access. Tap Grant shell access and approve the prompt."
        }

        return try {
            val uid = Shizuku.getUid()
            val version = Shizuku.getVersion()
            val identity = when (uid) {
                0 -> "root"
                2000 -> "ADB shell"
                else -> "UID $uid"
            }
            "SHIZUKU CONNECTION: READY\nIdentity: $identity\nShizuku API version: $version\n\nThis confirms the authorized bridge only. It does not yet confirm that this Android build permits creating an independent virtual display. The next host test must verify display creation, app launch on that display, frame capture, and input routing."
        } catch (e: Exception) {
            "Shizuku check failed: ${e.javaClass.simpleName}: ${e.message ?: "unknown error"}"
        }
    }
}
