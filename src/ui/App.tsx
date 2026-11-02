import { useCallback, useEffect, useState } from "react";
import { Cable, CircleHelp, Monitor, RefreshCw, Smartphone, Wifi, Play, Square, ShieldCheck, ArrowUpRight, Video, AppWindow } from "lucide-react";
import type { DualViewStatus } from "../shared/types";

const empty: DualViewStatus = { adbAvailable: false, scrcpyAvailable: false, devices: [], mirrorRunning: false };

export default function App() {
  const [status, setStatus] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Connect your Android phone with a USB data cable to begin.");
  const [selected, setSelected] = useState("");

  const refresh = useCallback(async () => {
    if (!window.dualview) { setLoading(false); return; }
    setLoading(true);
    try {
      const next = await window.dualview.refreshDevices();
      setStatus(next);
      setSelected((current) => next.devices.some((d) => d.id === current) ? current : next.devices.find((d) => d.state === "device")?.id ?? next.devices[0]?.id ?? "");
      if (!next.adbAvailable) setNotice("Android Platform Tools (ADB) are not installed or are not on PATH.");
      else if (!next.scrcpyAvailable) setNotice("ADB is ready. Install scrcpy to enable phone mirroring.");
      else if (!next.devices.length) setNotice("ADB and scrcpy are ready. Connect your phone and enable USB debugging.");
      else setNotice("Phone detected. Select it and start mirroring.");
    } catch { setNotice("Could not read device status. Restart DualView and try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 5000); return () => window.clearInterval(timer); }, [refresh]);

  async function start() {
    if (!selected || !window.dualview) return;
    setBusy(true);
    const result = await window.dualview.startMirror(selected);
    setNotice(result.message);
    setBusy(false);
    await refresh();
  }
  async function stop() {
    if (!window.dualview) return;
    setBusy(true);
    const result = await window.dualview.stopMirror();
    setNotice(result.message);
    setBusy(false);
    await refresh();
  }

  const readyDevice = status.devices.find((d) => d.id === selected && d.state === "device");
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span /><span /></div><div><strong>dualview</strong><small>PHONE × PC</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><Monitor size={17} /> Phone screen <span className="nav-dot" /></button>
      <button className="nav-item" disabled><Video size={17} /> Video bridge <em>SOON</em></button>
      <button className="nav-item" disabled><AppWindow size={17} /> Android on PC <em>SOON</em></button>
      <div className="sidebar-bottom"><ShieldCheck size={16} /><span>Local connection<br /><b>No cloud relay</b></span></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div><span className="eyebrow">DEVICE WORKSPACE</span><h1>Your phone, on a bigger screen.</h1></div><div className="top-actions"><span className="connection-pill"><i /> USB CONNECTION</span><button className="icon-button" onClick={() => void refresh()} aria-label="Refresh devices"><RefreshCw size={17} /></button></div></header>
      <div className="content">
        <section className="hero-card">
          <div className="hero-copy"><span className="eyebrow light">DUALVIEW · USB MODE</span><h2>One phone.<br /><span>Two screens.</span></h2><p>Use your Android phone from Windows with a direct USB connection. Your PC does not need internet for local mirroring.</p><div className="hero-tags"><span><Cable size={14} /> USB first</span><span><ShieldCheck size={14} /> Private by design</span></div></div>
          <div className="device-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="phone-frame"><div className="phone-camera" /><div className="phone-screen"><div className="screen-top">DUALVIEW <b>●</b></div><div className="screen-time">09:41</div><div className="screen-caption">Connected<br />to Windows</div><div className="screen-bars"><i /><i /><i /></div></div></div><div className="pc-frame"><div className="pc-screen"><div className="pc-line" /><div className="pc-line short" /><div className="pc-wave" /></div><div className="pc-stand" /></div><div className="link-glow" /></div>
        </section>
        <div className="section-heading"><div><span className="eyebrow">CONNECTION</span><h3>Connect your Android</h3></div><span className="live-status"><i /> LIVE DEVICE CHECK</span></div>
        <section className="connection-grid">
          <article className="panel device-panel"><div className="panel-head"><div className="panel-icon"><Smartphone size={19} /></div><div><h4>Android device</h4><p>USB debugging connection</p></div><button className="icon-button small" onClick={() => void refresh()} aria-label="Refresh"><RefreshCw size={15} /></button></div>
            {status.devices.length ? <div className="device-list">{status.devices.map((device) => <button key={device.id} className={selected === device.id ? "device-row selected" : "device-row"} onClick={() => setSelected(device.id)}><span className="device-glyph"><Smartphone size={20} /></span><span className="device-meta"><b>{device.model || "Android phone"}</b><small>{device.id} · {device.state}</small></span><span className={device.state === "device" ? "state-ready" : "state-wait"}>{device.state === "device" ? "READY" : device.state.toUpperCase()}</span></button>)}</div> : <div className="empty-device"><div className="empty-icon"><Smartphone size={23} /></div><b>No phone detected yet</b><span>Connect your phone using a USB data cable.</span></div>}
            <div className="device-actions">{status.mirrorRunning ? <button className="primary-button stop" onClick={() => void stop()} disabled={busy}><Square size={16} /> Stop mirroring</button> : <button className="primary-button" onClick={() => void start()} disabled={!readyDevice || !status.scrcpyAvailable || busy}><Play size={16} fill="currentColor" /> {busy ? "Starting…" : "Start phone screen"}</button>}<span className="helper-text">{loading ? "Checking devices…" : notice}</span></div>
          </article>
          <article className="panel setup-panel"><div className="panel-head"><div className="panel-icon muted"><CircleHelp size={19} /></div><div><h4>One-time setup</h4><p>Prepare Windows and your phone</p></div></div>
            <div className="setup-step"><span className={status.adbAvailable ? "step-check done" : "step-check"}>{status.adbAvailable ? "✓" : "1"}</span><div><b>Install Android Platform Tools</b><small>Provides ADB for USB communication.</small><button className="text-link" onClick={() => void window.dualview?.openExternal("https://developer.android.com/tools/adb")}>Get ADB <ArrowUpRight size={13} /></button></div></div>
            <div className="setup-step"><span className={status.scrcpyAvailable ? "step-check done" : "step-check"}>{status.scrcpyAvailable ? "✓" : "2"}</span><div><b>Install scrcpy</b><small>Streams and controls the phone screen.</small><button className="text-link" onClick={() => void window.dualview?.openExternal("https://github.com/Genymobile/scrcpy")}>Get scrcpy <ArrowUpRight size={13} /></button></div></div>
            <div className="setup-step"><span className="step-check">3</span><div><b>Enable USB debugging</b><small>Settings → About phone → Software information → tap Build number 7 times, then Developer options → USB debugging.</small></div></div>
          </article>
        </section>
        <section className="bottom-note"><Wifi size={17} /><p><b>USB keeps the connection local.</b> Mirroring sends the phone display to your PC over the cable; it does not turn on a hotspot or use PC internet.</p></section>
      </div>
      <footer><span>DUALVIEW DESKTOP · v0.1.0</span><span>BUILT FOR ANDROID + WINDOWS</span></footer>
    </section>
  </main>;
}
