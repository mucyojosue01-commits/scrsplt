package com.dualview.mobile

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.content.ServiceConnection
import android.os.IBinder
import rikka.shizuku.Shizuku
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Starts a Shizuku UserService for diagnostics. Shizuku 13.1.5 intentionally
 * hides newProcess(); UserService is the supported replacement.
 */
object HostBridge {
    private const val REQUEST_CODE = 4107
    private val executor = Executors.newSingleThreadExecutor()

    fun isRunning(): Boolean = Shizuku.pingBinder()

    fun hasShellPermission(): Boolean =
        isRunning() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED

    fun requestPermission() {
        if (isRunning() && !hasShellPermission()) Shizuku.requestPermission(REQUEST_CODE)
    }

    fun diagnosticsAsync(context: Context, callback: (String) -> Unit) {
        executor.execute {
            val result = diagnostics(context.applicationContext)
            android.os.Handler(android.os.Looper.getMainLooper()).post { callback(result) }
        }
    }

    private fun diagnostics(context: Context): String {
        if (!isRunning()) {
            return "SHIZUKU: NOT RUNNING\nStart Shizuku on Phone A using Android Wireless debugging."
        }
        if (!hasShellPermission()) {
            return "SHIZUKU: PERMISSION REQUIRED\nApprove DualView's shell access request, then run diagnostics again."
        }

        val latch = CountDownLatch(1)
        @Volatile var remote: IHostShell? = null
        @Volatile var disconnected = false
        val connection = object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
                remote = IHostShell.Stub.asInterface(service)
                latch.countDown()
            }
            override fun onServiceDisconnected(name: ComponentName?) {
                disconnected = true
                latch.countDown()
            }
        }
        val args = Shizuku.UserServiceArgs(
            ComponentName(context, HostShellUserService::class.java)
        ).daemon(false).processNameSuffix("host").tag("dualview-host-diagnostics").version(1)

        return try {
            Shizuku.bindUserService(args, connection)
            if (!latch.await(12, TimeUnit.SECONDS)) {
                Shizuku.unbindUserService(args, connection, true)
                "SHIZUKU USER SERVICE: TIMEOUT\nThe privileged diagnostic service did not connect within 12 seconds."
            } else if (disconnected || remote == null) {
                "SHIZUKU USER SERVICE: DISCONNECTED\nCheck that Shizuku is running and DualView permission is granted."
            } else {
                val result = remote!!.runDiagnostics()
                Shizuku.unbindUserService(args, connection, true)
                result
            }
        } catch (e: Exception) {
            try { Shizuku.unbindUserService(args, connection, true) } catch (_: Exception) {}
            "Host diagnostics failed: ${e.javaClass.simpleName}: ${e.message ?: "unknown error"}"
        }
    }
}
