package com.dualview.mobile

import android.content.pm.PackageManager
import rikka.shizuku.Shizuku

/**
 * Read-only host capability probe through the owner's Shizuku authorization.
 * No display is created and no app is launched by diagnostics.
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
        if (!isRunning()) {
            return "SHIZUKU: NOT RUNNING\nStart Shizuku on Phone A using Android Wireless debugging."
        }
        if (!hasShellPermission()) {
            return "SHIZUKU: PERMISSION REQUIRED\nApprove DualView's shell access request, then run diagnostics again."
        }

        return try {
            val uid = Shizuku.getUid()
            val version = Shizuku.getVersion()
            val identity = when (uid) {
                0 -> "root"
                2000 -> "ADB shell"
                else -> "UID $uid"
            }
            val process = Shizuku.newProcess(
                arrayOf(
                    "sh", "-c",
                    "echo '=== BUILD ==='; getprop ro.build.version.release; getprop ro.build.version.sdk; getprop ro.build.type; " +
                    "echo '=== DEVICE ==='; getprop ro.product.manufacturer; getprop ro.product.model; " +
                    "echo '=== DISPLAY SHELL COMMANDS ==='; cmd display help 2>&1; " +
                    "echo '=== DISPLAY SERVICE SNAPSHOT ==='; dumpsys display 2>&1 | head -n 100; " +
                    "echo '=== ACTIVITY DISPLAY OPTIONS ==='; cmd activity help 2>&1 | head -n 80; " +
                    "echo '=== WIFI AWARE FEATURES ==='; pm list features | grep -i -E 'wifi.aware|wifi.direct' || true"
                ),
                null,
                null
            )
            val output = process.inputStream.bufferedReader().use { it.readText() }.take(9000)
            val error = process.errorStream.bufferedReader().use { it.readText() }.take(1500)
            val exit = process.waitFor()
            "BRIDGE: READY ($identity)\nShizuku API: $version\nProbe exit: $exit\n\n$output\n$error\n\nIMPORTANT: This is a read-only capability inventory. A positive build or shell probe is not proof of independent-display support. That requires a real device test: create a separate display, launch a different app on it, confirm the host screen stays unchanged, then verify capture and input routing."
        } catch (e: Exception) {
            "Host diagnostics failed: ${e.javaClass.simpleName}: ${e.message ?: "unknown error"}"
        }
    }
}
