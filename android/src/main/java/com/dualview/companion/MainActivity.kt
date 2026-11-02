package com.dualview.companion

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private val ink = Color.rgb(24, 39, 29)
    private val green = Color.rgb(39, 83, 53)
    private val muted = Color.rgb(112, 128, 116)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(244, 247, 243)
        window.navigationBarColor = Color.rgb(244, 247, 243)
        window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(30), dp(24), dp(24))
            setBackgroundColor(Color.rgb(244, 247, 243))
        }
        root.addView(label("DUALVIEW", 12f, green, true))
        root.addView(space(34))
        root.addView(label("Your phone.\nYour second screen.", 30f, ink, true))
        root.addView(space(12))
        root.addView(label("Connect this Android phone to your Windows computer using a USB cable.", 15f, muted, false))
        root.addView(space(30))
        root.addView(card("01", "Connect USB", "Use a data-capable USB cable and keep your phone unlocked."))
        root.addView(space(12))
        root.addView(card("02", "Allow USB debugging", "Enable Developer options → USB debugging, then approve the computer."))
        root.addView(space(12))
        root.addView(card("03", "Open DualView on Windows", "The Windows app detects your phone and starts the local screen session."))
        root.addView(space(24))
        root.addView(label("PRIVATE CONNECTION", 10f, green, true))
        root.addView(space(5))
        root.addView(label("Your phone and PC communicate directly over USB. No hotspot or cloud account is required for screen mirroring.", 13f, muted, false))
        root.addView(space(20))
        root.addView(label("DUALVIEW COMPANION · 0.1.0", 10f, muted, true))
        setContentView(root)
    }

    private fun card(number: String, title: String, body: String): View {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(16))
            setBackgroundColor(Color.WHITE)
        }
        val badge = TextView(this).apply {
            text = number
            textSize = 12f
            setTextColor(green)
            gravity = Gravity.CENTER
            setBackgroundColor(Color.rgb(234, 243, 235))
            width = dp(38)
            height = dp(38)
        }
        val text = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(13), 0, 0, 0) }
        text.addView(label(title, 14f, ink, true))
        text.addView(space(4))
        text.addView(label(body, 12f, muted, false))
        box.addView(badge)
        box.addView(text, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        return box
    }

    private fun label(value: String, size: Float, color: Int, bold: Boolean) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
        if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
        setLineSpacing(dp(3).toFloat(), 1f)
    }

    private fun space(height: Int) = View(this).apply { layoutParams = LinearLayout.LayoutParams(1, dp(height)) }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
