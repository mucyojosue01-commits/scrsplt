package com.dualview.mobile

import android.content.pm.PackageManager
import rikka.shizuku.Shizuku

/**
 * Optional, user-authorized bridge to Android's ADB shell.
 * Shizuku must be started by the device owner (normally via Wireless debugging).
 * This is a capability probe, not a promise that every Android build exposes
 * the privileged virtual-display APIs required by independent mode.
 */
object HostBridge {
    private const val REQUEST_CODE = 4107

    fun isRunning(): Boolean = Shizuku.pingBinder()

    fun hasShellPermission(): Boolean =
        isRunning() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED

    fun requestPermission() {
        if (isRunning() && !hasShellPermission()) Shizuku.requestPermission(REQUEST_CODE)
    }

    fun diagnostics(): String {
        if (!isRunning()) return "Shizuku is not running. Install and start Shizuku on Phone A using Android Wireless debugging, then return here."
        if (!hasShellPermission()) return "Shizuku is running, but DualView has not been granted shell access. Tap Grant shell access and approve the prompt."
        return try {
            val process = Shizuku.newProcess(
                arrayOf("sh", "-c", "id; getprop ro.build.version.release; getprop ro.build.type; cmd display help 2>&1"),
                null,
                null
            )
            val output = process.inputStream.bufferedReader().use { it.readText() }.take(5000)
            val error = process.errorStream.bufferedReader().use { it.readText() }.take(1000)
            val exit = process.waitFor()
            "ADB SHELL PROBE (exit $exit)\n$output\n$error".trim()
        } catch (e: Exception) {
            "Shell probe failed: ${e.javaClass.simpleName}: ${e.message ?: "unknown error"}"
        }
    }
}
