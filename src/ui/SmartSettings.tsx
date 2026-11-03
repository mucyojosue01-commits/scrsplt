import { AudioLines, BatteryCharging, Monitor, Settings2, Smartphone, Zap } from "lucide-react";
import type { ScrcpySettings } from "../shared/types";
interface Props { settings: ScrcpySettings; onChange: (settings: ScrcpySettings) => void; mode: "phone" | "desktop" }
const presets: {name:string; icon:typeof Zap; patch:Partial<ScrcpySettings>}[] = [
  {name:"Balanced",icon:Monitor,patch:{maxSize:1920,maxFps:30,videoBitRate:"4M",audio:false,stayAwake:true}},
  {name:"Low data",icon:BatteryCharging,patch:{maxSize:1024,maxFps:24,videoBitRate:"2M",audio:false}},
  {name:"Smooth",icon:Zap,patch:{maxSize:1920,maxFps:60,videoBitRate:"8M",audio:true}},
];
export default function SmartSettings({settings,onChange,mode}:Props){
 const set=<K extends keyof ScrcpySettings>(key:K,value:ScrcpySettings[K])=>onChange({...settings,[key]:value});
 const flags=["--serial <connected-device>",`--max-size=${settings.maxSize}`,`--max-fps=${settings.maxFps}`,`--video-bit-rate=${settings.videoBitRate}`,...(settings.stayAwake?["--stay-awake"]:[]),...(mode==="desktop"?["--fullscreen","--new-display=1280x720/160"]:settings.fullscreen?["--fullscreen"]:[]),...(settings.audio?[]:["--no-audio"]),...(settings.orientation==="auto"?[]:[`--orientation=${settings.orientation==="landscape"?90:0}`]),...(settings.turnScreenOff?["--turn-screen-off"]:[]),...(settings.showTouches?["--show-touches"]:[]),...(settings.alwaysOnTop?["--always-on-top"]:[]),...(settings.windowBorderless?["--window-borderless"]:[])].join(" ");
 return <section className="panel smart-settings">
  <div className="smart-settings-head"><div><span className="eyebrow">SCRCPY CONTROL CENTER</span><h3><Settings2 size={18}/> Smart display settings</h3><p>Choose how scrcpy starts before opening this display. Settings apply to the selected {mode==="phone"?"phone screen":"Android desktop"} session.</p></div><span className="settings-live">CLI CONFIGURATION</span></div>
  <div className="settings-presets">{presets.map(p=><button key={p.name} onClick={()=>onChange({...settings,...p.patch})}><p.icon size={15}/>{p.name}</button>)}</div>
  <div className="settings-grid">
   <label className="setting-toggle audio-setting"><span><AudioLines size={17}/><b>Forward phone audio to PC</b><small>{settings.audio?"Phone audio will play through Windows.":"Phone audio stays on the phone."}</small></span><input type="checkbox" checked={settings.audio} onChange={e=>set("audio",e.target.checked)}/></label>
   <label className="setting-toggle"><span><Smartphone size={17}/><b>Keep phone awake</b><small>Prevent screen sleep while connected.</small></span><input type="checkbox" checked={settings.stayAwake} onChange={e=>set("stayAwake",e.target.checked)}/></label>
   <label className="setting-field"><span>Orientation</span><select value={settings.orientation} onChange={e=>set("orientation",e.target.value as ScrcpySettings["orientation"])}><option value="auto">Follow device</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
   <label className="setting-field"><span>Maximum resolution</span><select value={settings.maxSize} onChange={e=>set("maxSize",Number(e.target.value))}>{[1024,1280,1600,1920,2560].map(n=><option key={n} value={n}>{n}px</option>)}</select></label>
   <label className="setting-field"><span>Frame rate</span><select value={settings.maxFps} onChange={e=>set("maxFps",Number(e.target.value))}>{[15,24,30,45,60].map(n=><option key={n} value={n}>{n} FPS</option>)}</select></label>
   <label className="setting-field"><span>Video bitrate</span><select value={settings.videoBitRate} onChange={e=>set("videoBitRate",e.target.value)}>{["2M","4M","6M","8M","12M","16M"].map(n=><option key={n}>{n}</option>)}</select></label>
  </div>
  <details className="advanced-settings"><summary>Advanced display options</summary><div className="advanced-grid">
   {([["fullscreen","Fullscreen"],["turnScreenOff","Turn off phone screen"],["showTouches","Show touch indicators"],["alwaysOnTop","Keep window on top"],["windowBorderless","Borderless window"]] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={settings[key]} onChange={e=>set(key,e.target.checked)}/>{label}</label>)}
  </div><div className="cli-preview"><span>SCRCPY COMMAND PREVIEW · GENERATED SAFELY</span><code>scrcpy {flags}</code></div></details>
 </section>;
}
