package com.dualview.mobile

import android.os.Binder
import java.util.concurrent.TimeUnit

/**
 * Runs in Shizuku's shell/root UserService process. Only performs read-only
 * device inventory; it does not create displays or launch installed apps.
 */
class HostShellUserService : IHostShell.Stub() {
    override fun runDiagnostics(): String {
        val uid = android.os.Process.myUid()
        val identity = when (uid) {
            0 -> "root"
            2000 -> "ADB shell"
            else -> "UID $uid"
        }
        val script = """
            echo '=== BUILD ==='
            getprop ro.build.version.release
            getprop ro.build.version.sdk
            getprop ro.build.type
            echo '=== DEVICE ==='
            getprop ro.product.manufacturer
            getprop ro.product.model
            echo '=== DISPLAY SHELL COMMANDS ==='
            cmd display help 2>&1
            echo '=== DISPLAY SERVICE SNAPSHOT ==='
            dumpsys display 2>&1 | head -n 100
            echo '=== ACTIVITY DISPLAY OPTIONS ==='
            cmd activity help 2>&1 | head -n 80
            echo '=== WIFI AWARE FEATURES ==='
            pm list features | grep -i -E 'wifi.aware|wifi.direct' || true
        """.trimIndent()
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("sh", "-c", script))
            val finished = process.waitFor(15, TimeUnit.SECONDS)
            if (!finished) {
                process.destroyForcibly()
                return "BRIDGE: READY ($identity)\nDIAGNOSTIC TIMEOUT\nThe read-only system inventory exceeded 15 seconds."
            }
            val output = process.inputStream.bufferedReader().use { it.readText() }.take(9000)
            val error = process.errorStream.bufferedReader().use { it.readText() }.take(1500)
            "BRIDGE: READY ($identity)\nProbe exit: ${process.exitValue()}\n\n$output\n$error\n\nIMPORTANT: This is a read-only capability inventory. A positive shell probe is not proof of independent-display support. That requires a real device test: create a separate display, launch a different app on it, confirm the host screen stays unchanged, then verify capture and input routing."
        } catch (e: Exception) {
            "Privileged diagnostics failed: ${e.javaClass.simpleName}: ${e.message ?: "unknown error"}"
        }
    }

    override fun onTransact(code: Int, data: android.os.Parcel, reply: android.os.Parcel?, flags: Int): Boolean {
        if (code == 16777115) {
            Thread {
                try { reply?.writeNoException() } catch (_: Exception) {}
                android.os.Process.killProcess(android.os.Process.myPid())
            }.start()
            return true
        }
        return super.onTransact(code, data, reply, flags)
    }
}
