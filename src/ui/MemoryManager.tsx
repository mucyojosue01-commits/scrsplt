import { useState } from "react";
import { ShieldCheck, MemoryStick, RefreshCw, OctagonAlert } from "lucide-react";
import type { MemoryProcess } from "../shared/types";
interface Props { processes: MemoryProcess[]; deviceId: string; onStop: (packageName: string) => Promise<void>; busy: boolean }
const mb=(kb:number)=>kb>=1024? (kb/1024).toFixed(0)+" MB":kb+" KB";
export default function MemoryManager({processes,deviceId,onStop,busy}:Props){
 const [confirming,setConfirming]=useState<string|null>(null);
 return <section className="panel memory-manager">
  <div className="memory-manager-head"><div><span className="eyebrow">HYBRID MEMORY MANAGER</span><h3><MemoryStick size={18}/> Background app memory</h3><p>Shows running third-party apps and their reported memory use. Android system processes are excluded.</p></div><span className="memory-safe"><ShieldCheck size={15}/> SYSTEM PROTECTED</span></div>
  {!deviceId?<div className="memory-empty">Connect and select your Android phone to inspect app memory.</div>:processes.length===0?<div className="memory-empty">No running third-party apps with readable memory data were found. Refreshing automatically.</div>:
   <div className="memory-list">{processes.map(p=><div className="memory-row" key={p.packageName}><div className="memory-app"><b>{p.label}</b><small>{p.packageName}</small></div><div className="memory-usage"><b>{mb(p.memoryKb)}</b><small>reported PSS</small></div>{p.isForeground?<span className="memory-badge foreground">IN USE</span>:<span className="memory-badge">BACKGROUND</span>}
    {p.safeToStop?<button className="memory-stop" disabled={busy} onClick={()=>setConfirming(p.packageName)}>Stop app</button>:<span className="memory-protected">Protected</span>}
    {confirming===p.packageName&&<div className="memory-confirm"><OctagonAlert size={16}/><span>Stop {p.packageName}? It may lose unsaved work and can restart later.</span><button onClick={()=>{setConfirming(null);void onStop(p.packageName)}} disabled={busy}>Confirm stop</button><button className="cancel" onClick={()=>setConfirming(null)}>Cancel</button></div>}
   </div>)}</div>}
  <div className="memory-manager-foot"><span><ShieldCheck size={14}/> DualView only offers stop controls for detected third-party background apps—not Android system apps or the foreground app.</span><span><RefreshCw size={13}/> Updates every 5 seconds</span></div>
 </section>;
}
