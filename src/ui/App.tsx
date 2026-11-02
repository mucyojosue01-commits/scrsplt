import { useCallback, useEffect, useState } from "react";
import { Cable, CircleHelp, Monitor, RefreshCw, Smartphone, Wifi, Play, Square, ShieldCheck, ArrowUpRight, Video, AppWindow, Cpu, ExternalLink } from "lucide-react";
import type { DualViewStatus, EmulatorStatus } from "../shared/types";

const empty: DualViewStatus = { adbAvailable: false, scrcpyAvailable: false, devices: [], mirrorRunning: false };
const emptyEmulator: EmulatorStatus = { available: false, avds: [], running: [], sdkPath: null };

export default function App() {
  const [status, setStatus] = useState(empty);
  const [emulator, setEmulator] = useState(emptyEmulator);
  const [activeView, setActiveView] = useState<"phone" | "emulator">("phone");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Connect your Android phone with a USB data cable to begin.");
  const [emulatorNotice, setEmulatorNotice] = useState("Checking for Android Emulator…");
  const [selected, setSelected] = useState("");
  const [selectedAvd, setSelectedAvd] = useState("");

  const refresh = useCallback(async () => {
    if (!window.dualview) { setLoading(false); return; }
    setLoading(true);
    try {
      const next = await window.dualview.refreshDevices();
      setStatus(next);
      setSelected((current) => next.devices.some((d) => d.id === current) ? current : next.devices.find((d) => d.state === "device")?.id ?? next.devices[0]?.id ?? "");
      if (!next.adbAvailable) setNotice("Bundled Android Platform Tools could not start. Reinstall DualView.");
      else if (!next.scrcpyAvailable) setNotice("ADB is ready. The screen-mirroring runtime is unavailable.");
      else if (!next.devices.length) setNotice("Ready. Connect your phone and enable USB debugging.");
      else setNotice("Phone detected. Select it and start mirroring.");
    } catch { setNotice("Could not read device status. Restart DualView and try again."); }
    finally { setLoading(false); }
  }, []);

  const refreshEmulator = useCallback(async () => {
    if (!window.dualview) return;
    try {
      const next = await window.dualview.getEmulatorStatus();
      setEmulator(next);
      setSelectedAvd((current) => next.avds.includes(current) ? current : next.avds[0] ?? "");
      if (!next.available) setEmulatorNotice("Android Emulator was not found. Install Android Studio and its Emulator component, then create a virtual device.");
      else if (!next.avds.length) setEmulatorNotice("Android Emulator is installed, but no virtual device exists yet. Create one in Device Manager.");
      else if (next.running.length) setEmulatorNotice("Android is running on this PC.");
      else setEmulatorNotice("Choose a virtual device and start Android on this PC.");
    } catch { setEmulatorNotice("Could not check Android Emulator. Try refreshing."); }
  }, []);

  useEffect(() => {
    void refresh();
    void refreshEmulator();
    const timer = window.setInterval(() => { void refresh(); void refreshEmulator(); }, 7000);
    return () => window.clearInterval(timer);
  }, [refresh, refreshEmulator]);

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
  async function startEmulator() {
    if (!selectedAvd || !window.dualview) return;
    setBusy(true);
    const result = await window.dualview.startEmulator(selectedAvd);
    setEmulatorNotice(result.message);
    setBusy(false);
    await refreshEmulator();
  }
  async function stopEmulator() {
    if (!window.dualview) return;
    setBusy(true);
    const result = await window.dualview.stopEmulator();
    setEmulatorNotice(result.message);
    setBusy(false);
    await refreshEmulator();
  }

  const readyDevice = status.devices.find((d) => d.id === selected && d.state === "device");
  const emulatorRunning = emulator.running.length > 0;
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span /><span /></div><div><strong>dualview</strong><small>PHONE × PC</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className={activeView === "phone" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("phone")}><Monitor size={17} /> Phone screen {activeView === "phone" && <span className="nav-dot" />}</button>
      <button className="nav-item" disabled><Video size={17} /> Video bridge <em>SOON</em></button>
      <button className={activeView === "emulator" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("emulator")}><AppWindow size={17} /> Android on PC {activeView === "emulator" && <span className="nav-dot" />}</button>
      <div className="sidebar-bottom"><ShieldCheck size={16} /><span>Local connection<br /><b>No cloud relay</b></span></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div><span className="eyebrow">{activeView === "phone" ? "DEVICE WORKSPACE" : "VIRTUAL ANDROID"}</span><h1>{activeView === "phone" ? "Your phone, on a bigger screen." : "Run Android directly on your PC."}</h1></div><div className="top-actions"><span className="connection-pill"><i /> {activeView === "phone" ? "USB CONNECTION" : "LOCAL EMULATOR"}</span><button className="icon-button" onClick={() => { void refresh(); void refreshEmulator(); }} aria-label="Refresh"><RefreshCw size={17} /></button></div></header>
      {activeView === "phone" ? <div className="content">
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
            <div className="setup-step"><span className={status.adbAvailable ? "step-check done" : "step-check"}>{status.adbAvailable ? "✓" : "1"}</span><div><b>Android Platform Tools</b><small>ADB is bundled with DualView.</small></div></div>
            <div className="setup-step"><span className={status.scrcpyAvailable ? "step-check done" : "step-check"}>{status.scrcpyAvailable ? "✓" : "2"}</span><div><b>Screen mirroring runtime</b><small>scrcpy is bundled with DualView.</small></div></div>
            <div className="setup-step"><span className="step-check">3</span><div><b>Enable USB debugging</b><small>Developer options → USB debugging, then approve this PC on your phone.</small></div></div>
          </article>
        </section>
        <section className="bottom-note"><Wifi size={17} /><p><b>USB keeps the connection local.</b> Mirroring sends the phone display to your PC over the cable; it does not turn on a hotspot or use PC internet.</p></section>
      </div> : <div className="content emulator-content">
        <section className="emulator-hero"><div><span className="eyebrow light">DUALVIEW · PC MODE</span><h2>A separate Android device,<br /><span>running inside Windows.</span></h2><p>Launch an Android virtual phone on your PC. It runs independently of your physical phone.</p></div><div className="emulator-visual"><div className="emulator-device"><div className="emu-camera" /><div className="emu-screen"><Cpu size={34} /><b>ANDROID</b><small>VIRTUAL DEVICE</small></div></div></div></section>
        <div className="section-heading"><div><span className="eyebrow">ANDROID VIRTUAL DEVICE</span><h3>Start Android on this PC</h3></div><span className="live-status"><i /> {emulatorRunning ? "EMULATOR RUNNING" : "LOCAL DEVICE CHECK"}</span></div>
        <section className="emulator-grid">
          <article className="panel emulator-panel"><div className="panel-head"><div className="panel-icon"><AppWindow size={19} /></div><div><h4>Available virtual devices</h4><p>Android Emulator / Android Studio AVDs</p></div><button className="icon-button small" onClick={() => void refreshEmulator()} aria-label="Refresh virtual devices"><RefreshCw size={15} /></button></div>
            {!emulator.available ? <div className="emulator-empty"><b>Android Emulator not found</b><span>Install Android Studio with the Android Emulator component, then create a virtual device in Device Manager.</span><button className="text-link" onClick={() => void window.dualview?.openExternal("https://developer.android.com/studio")}>Get Android Studio <ExternalLink size={13} /></button></div> : !emulator.avds.length ? <div className="emulator-empty"><b>No virtual devices created</b><span>Open Android Studio → Tools → Device Manager → Create device. Download a system image once, then DualView can launch it offline.</span><button className="text-link" onClick={() => void window.dualview?.openExternal("https://developer.android.com/studio/run/managing-avds")}>AVD setup guide <ExternalLink size={13} /></button></div> : <div className="avd-list">{emulator.avds.map((avd) => <button key={avd} className={selectedAvd === avd ? "avd-row selected" : "avd-row"} onClick={() => setSelectedAvd(avd)}><span className="device-glyph"><Smartphone size={19} /></span><span className="device-meta"><b>{avd}</b><small>Android virtual device</small></span><span className="state-ready">{emulator.running.length ? "AVAILABLE" : "READY"}</span></button>)}</div>}
            <div className="device-actions">{emulatorRunning ? <button className="primary-button stop" onClick={() => void stopEmulator()} disabled={busy}><Square size={16} /> Close Android on PC</button> : <button className="primary-button" onClick={() => void startEmulator()} disabled={!emulator.available || !selectedAvd || busy}><Play size={16} fill="currentColor" /> {busy ? "Starting…" : "Start Android on PC"}</button>}<span className="helper-text">{emulatorNotice}</span></div>
          </article>
          <article className="panel setup-panel"><div className="panel-head"><div className="panel-icon muted"><CircleHelp size={19} /></div><div><h4>One-time PC setup</h4><p>Required only once on this computer</p></div></div>
            <div className="setup-step"><span className={emulator.available ? "step-check done" : "step-check"}>{emulator.available ? "✓" : "1"}</span><div><b>Install Android Studio</b><small>Include Android Emulator and Android SDK Platform-Tools.</small><button className="text-link" onClick={() => void window.dualview?.openExternal("https://developer.android.com/studio")}>Android Studio <ArrowUpRight size={13} /></button></div></div>
            <div className="setup-step"><span className={emulator.avds.length ? "step-check done" : "step-check"}>{emulator.avds.length ? "✓" : "2"}</span><div><b>Create a virtual phone</b><small>Use Tools → Device Manager → Create device. Download its Android system image once.</small><button className="text-link" onClick={() => void window.dualview?.openExternal("https://developer.android.com/studio/run/managing-avds")}>Device Manager guide <ArrowUpRight size={13} /></button></div></div>
            <div className="setup-step"><span className="step-check">3</span><div><b>Launch it from DualView</b><small>Select the virtual device and press Start Android on PC.</small></div></div>
          </article>
        </section>
        <section className="bottom-note"><Wifi size={17} /><p><b>Internet note.</b> Android on PC uses the PC's network connection. If your PC has no internet, enable USB tethering on your phone; emulator networking can then use the phone's mobile data through Windows. First-time Android system-image downloads are large, so prepare the virtual device before going offline.</p></section>
      </div>}
      <footer><span>DUALVIEW DESKTOP · v0.3.0</span><span>BUILT FOR ANDROID + WINDOWS</span></footer>
    </section>
  </main>;
}
