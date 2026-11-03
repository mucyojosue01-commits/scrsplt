package com.dualview.mobile

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.content.Context
import android.graphics.Color
import android.view.View
import android.widget.*
import android.net.wifi.WifiManager
import java.net.NetworkInterface

class MainActivity : Activity() {
    private val ink = Color.rgb(24, 38, 30)
    private val green = Color.rgb(32, 104, 65)
    private val muted = Color.rgb(101, 116, 106)
    private val paper = Color.rgb(245, 247, 243)
    private val line = Color.rgb(224, 231, 224)
    private lateinit var content: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = paper
        window.navigationBarColor = paper
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        val scroll = ScrollView(this).apply { setBackgroundColor(paper) }
        content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(24), dp(22), dp(28))
        }
        scroll.addView(content)
        setContentView(scroll)
        home()
    }

    private fun home() {
        content.removeAllViews()
        label("DUALVIEW  /  MOBILE")
        space(22)
        title("Your apps.\nA second screen.", 32)
        body("Use two Android phones together. Choose the role for this device to begin.")
        space(22)
        card("PHONE A  ·  HOST", "Run apps from this phone", "The host keeps its installed apps and private data. A true independent Android display requires supported system-level virtual-device capability.") {
            host()
        }
        space(12)
        card("PHONE B  ·  DISPLAY", "Join another phone", "Connect to a host over the same local Wi-Fi network. The display phone receives the picture and returns user input.") {
            client()
        }
        space(18)
        label("DISPLAY MODES")
        space(8)
        card("B  ·  INDEPENDENT DISPLAY", "Separate Android session", "Runs selected host apps on a virtual display. Requires a compatible privileged host backend; not available on ordinary Android phones by app permissions alone.") { requirements() }
        space(10)
        card("C  ·  SCREEN MIRRORING", "Show the host screen", "A separate, simpler mode that duplicates the host screen after Android screen-capture consent. It is not the independent-display feature.") { mirroringInfo() }
        space(20)
        label("DEVICE")
        body("Android ${Build.VERSION.RELEASE}  ·  API ${Build.VERSION.SDK_INT}\nLocal address: ${localIp()}")
        space(12)
        smallButton("Refresh device information") { home() }
        space(16)
        body("DUALVIEW MOBILE  ·  FIRST VERSION")
    }

    private fun host() {
        content.removeAllViews()
        back()
        title("Phone A · Host", 28)
        body("Phone A runs the apps and keeps their private data. DualView first checks whether this Android build exposes the shell capabilities needed for a scrcpy-style host service.")
        space(16)
        card("STEP 1 · PREPARE HOST", "Enable Wireless debugging", "On Phone A: Settings → About phone → tap Build number 7 times. Open Developer options → Wireless debugging. Keep this phone and Phone B on the same trusted Wi-Fi network.") {}
        space(10)
        card("STEP 2 · START SHELL BRIDGE", "Install and start Shizuku", "Install the official Shizuku app on Phone A. Start it using Wireless debugging pairing. This is an explicit owner-controlled ADB bridge; DualView cannot silently enable it.") {}
        space(10)
        card("STEP 3 · AUTHORIZE DUALVIEW", "Grant shell access", "When Shizuku is running, approve the permission request. You can revoke it from Shizuku at any time.") {
            try {
                if (!HostBridge.isRunning()) {
                    showDiagnostic("Shizuku is not running yet. Start it on this phone, then return and try again.")
                } else if (HostBridge.hasShellPermission()) {
                    runHostDiagnostics()
                } else {
                    HostBridge.requestPermission()
                    showDiagnostic("Permission request sent. Approve the Shizuku prompt, then tap Run host diagnostics.")
                }
            } catch (e: Exception) {
                showDiagnostic("Bridge error: ${e.message ?: "unknown"}")
            }
        }
        space(10)
        card("STEP 4 · VERIFY ANDROID CAPABILITIES", "Run host diagnostics", "Checks the shell identity, Android build type and available display commands. It does not change system settings or launch apps.") {
            showDiagnostic(HostBridge.diagnostics())
        }
        space(10)
        card("HOST LIMITATION", "Independent display is not active yet", "Shizuku shell access is a stepping stone, not a guarantee. The next stage must verify whether this exact firmware permits virtual-display creation, app launch on that display, video capture and input injection. We will not claim success until those operations work.") {}
        space(16)
        label("LIVE DIAGNOSTIC")
        diagnosticView = TextView(this).apply {
            text = "No host diagnostic has been run."
            textSize = 12f
            setTextColor(ink)
            setPadding(dp(14), dp(14), dp(14), dp(14))
            setBackgroundColor(Color.WHITE)
        }
        content.addView(diagnosticView)
    }

    private var diagnosticView: TextView? = null

    private fun runHostDiagnostics() {
        showDiagnostic("Running read-only host diagnostics…")
        HostBridge.diagnosticsAsync(this) { result -> showDiagnostic(result) }
    }

    private fun showDiagnostic(message: String) {
        val view = diagnosticView
        if (view != null) view.text = message else {
            val box = TextView(this).apply {
                text = message
                textSize = 12f
                setTextColor(ink)
                setPadding(dp(14), dp(14), dp(14), dp(14))
                setBackgroundColor(Color.WHITE)
            }
            content.addView(box)
            diagnosticView = box
        }
    }

    private fun client() {
        content.removeAllViews()
        back()
        title("Phone B · Display", 28)
        body("Prepare this phone as the receiving screen. Both phones should be on the same local Wi-Fi network.")
        space(16)
        card("THIS DEVICE", "Client baseline", if (Build.VERSION.SDK_INT >= 33) "Android 13+ baseline met for the AOSP reference client." else "This device is below Android 13, the AOSP reference client baseline.") {}
        space(12)
        card("NETWORK", "Your local address: ${localIp()}", "Host discovery and secure pairing will use the local network in a later connection build. No server is advertised until a real host backend is available.") {}
        space(12)
        card("PAIRING", "Not connected", "A host has not been paired. This first build does not pretend to connect to a phone when no compatible streaming service is running.") {}
        space(18)
        smallButton("View connection requirements") { requirements() }
    }

    private fun requirements() {
        content.removeAllViews()
        back()
        title("Compatibility", 28)
        body("The independent-display mode is different from screen mirroring. Android restricts who can create virtual devices and launch other apps on them.")
        space(12)
        card("HOST REQUIREMENT", "Privileged Android host", "The AOSP reference implementation documents a rooted Android 14+ userdebug/eng host with its host component installed as a privileged system app. Normal runtime permissions are not enough.") {}
        space(10)
        card("CLIENT REQUIREMENT", "Android 13+ reference client", "The reference client uses the companion streaming stack and Wi-Fi Aware. Both devices must support the required networking features.") {}
        space(10)
        card("YOUR DEVICE", "API ${Build.VERSION.SDK_INT}", "Android version is only one check. Manufacturer firmware, system services, Wi-Fi Aware and privileged installation determine actual compatibility.") {}
        space(16)
        body("Technical reference: AOSP VirtualDeviceManager demo\nhttps://android.googlesource.com/platform/development/+/main/samples/VirtualDeviceManager/README.md")
    }

    private fun mirroringInfo() {
        content.removeAllViews()
        back()
        title("Mirroring mode · C", 28)
        body("Mirroring duplicates the host phone's existing screen. It does not create a separate Android workspace and does not let the host keep using different apps independently.")
        space(12)
        card("ANDROID CONSENT", "Screen capture permission", "A future mirroring session must request Android's official MediaProjection consent on the host. The user can stop capture at any time.") {}
        space(10)
        card("INPUT", "Touch forwarding", "Remote touch requires a separately supported input method and explicit setup. This app will not request hidden or privileged access without explaining it.") {}
        space(16)
        body("Mirroring is planned as a separate mode. It will never be labelled as the independent display.")
    }

    private fun back() {
        smallButton("←  Back to DualView") { home() }
        space(20)
        label("DUALVIEW  /  MOBILE")
        space(12)
    }

    private fun card(kicker: String, heading: String, description: String, action: (() -> Unit)? = null) {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(15), dp(16), dp(15))
            setBackgroundColor(Color.WHITE)
        }
        val border = android.graphics.drawable.GradientDrawable().apply {
            setColor(Color.WHITE); cornerRadius = dp(15).toFloat(); setStroke(dp(1), line)
        }
        box.background = border
        box.addView(labelView(kicker))
        box.addView(spaceView(7))
        box.addView(textView(heading, 18f, ink, true))
        box.addView(spaceView(5))
        box.addView(textView(description, 13f, muted, false))
        if (action != null) {
            box.addView(spaceView(12))
            box.addView(Button(this).apply {
                text = "Continue  →"
                setTextColor(Color.WHITE)
                backgroundTintList = android.content.res.ColorStateList.valueOf(green)
                setOnClickListener { action() }
            })
        }
        content.addView(box)
    }

    private fun label(value: String) { content.addView(labelView(value)) }
    private fun labelView(value: String) = textView(value, 10f, green, true)
    private fun title(value: String, size: Int) { content.addView(textView(value, size.toFloat(), ink, true)) }
    private fun body(value: String) { content.addView(textView(value, 14f, muted, false)) }
    private fun textView(value: String, size: Float, color: Int, bold: Boolean) = TextView(this).apply {
        text = value; textSize = size; setTextColor(color)
        if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
        setLineSpacing(dp(3).toFloat(), 1f)
    }
    private fun space(value: Int) { content.addView(spaceView(value)) }
    private fun spaceView(value: Int) = View(this).apply { layoutParams = LinearLayout.LayoutParams(1, dp(value)) }
    private fun smallButton(value: String, click: () -> Unit) {
        content.addView(Button(this).apply { text = value; setOnClickListener { click() } })
    }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun localIp(): String {
        return try {
            NetworkInterface.getNetworkInterfaces().toList().flatMap { it.inetAddresses.toList() }
                .firstOrNull { !it.isLoopbackAddress && it is java.net.Inet4Address }?.hostAddress ?: "Not available"
        } catch (_: Exception) { "Not available" }
    }
}
