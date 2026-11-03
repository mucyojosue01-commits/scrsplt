package com.dualview.mobile

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private val ink = Color.rgb(25, 39, 31)
    private val green = Color.rgb(37, 91, 57)
    private val muted = Color.rgb(105, 119, 109)
    private val paper = Color.rgb(245, 247, 243)
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = paper
        window.navigationBarColor = paper
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(28), dp(22), dp(20))
            setBackgroundColor(paper)
        }
        root.addView(text("DUALVIEW  /  MOBILE", 12f, green, true))
        root.addView(gap(28))
        root.addView(text("One phone.
A second display.", 31f, ink, true))
        root.addView(gap(10))
        root.addView(text("Run apps from Phone A on Phone B as a separate Android display. Your apps and private data stay on Phone A.", 15f, muted, false))
        root.addView(gap(24))
        root.addView(section("01  ·  PHONE A", "Host device", "Creates the independent Android virtual device and launches selected installed apps."))
        root.addView(gap(10))
        root.addView(section("02  ·  PHONE B", "Display device", "Receives the display stream and returns touch, keyboard and navigation input."))
        root.addView(gap(20))
        status = text("", 13f, muted, false)
        root.addView(status)
        root.addView(gap(16))
        root.addView(Button(this).apply {
            text = "Check this phone"
            setOnClickListener { showCompatibility() }
        })
        root.addView(gap(12))
        root.addView(text("CONNECTION", 11f, green, true))
        root.addView(text("Wi-Fi first · USB/OTG where supported · Bluetooth for pairing only", 13f, muted, false))
        root.addView(gap(18))
        root.addView(text("MOBILE APP · 0.1.0 FOUNDATION", 10f, muted, true))
        setContentView(root)
        showCompatibility()
    }

    private fun showCompatibility() {
        val sdk = Build.VERSION.SDK_INT
        val supportedClient = sdk >= 33
        status.text = if (supportedClient) {
            "This phone meets the Android 13+ client baseline. Host capability is checked separately and depends on privileged Android virtual-device support."
        } else {
            "This phone is below the Android 13 client baseline for the reference virtual-device streaming stack."
        }
    }

    private fun section(kicker: String, title: String, body: String): View {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(15), dp(16), dp(15))
            setBackgroundColor(Color.WHITE)
        }
        box.addView(text(kicker, 10f, green, true))
        box.addView(gap(7))
        box.addView(text(title, 18f, ink, true))
        box.addView(gap(4))
        box.addView(text(body, 13f, muted, false))
        return box
    }

    private fun text(value: String, size: Float, color: Int, bold: Boolean) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
        if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
        setLineSpacing(dp(3).toFloat(), 1f)
    }

    private fun gap(height: Int) = View(this).apply {
        layoutParams = LinearLayout.LayoutParams(1, dp(height))
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
