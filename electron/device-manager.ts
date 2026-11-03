import { app } from "electron";
import { execFile, spawn, ChildProcess } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { parseAdbDevices } from "./adb-parser";
const execFileAsync = promisify(execFile);
export { parseAdbDevices };
export interface DeviceRecord { id: string; state: "device" | "unauthorized" | "offline" | "unknown"; model?: string }
export interface ToolStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: DeviceRecord[] }
export interface PcResources { totalRamBytes: number; freeRamBytes: number; usedRamBytes: number; cpuCores: number; platform: string }
function toolPath(name: string): string { return app.isPackaged ? path.join(process.resourcesPath, "scrcpy", name) : path.join(process.cwd(), "vendor", "scrcpy", name); }
function command(name: string): string { const bundled=toolPath(name); try { require("node:fs").accessSync(bundled); return bundled; } catch { return name.replace(/\.exe$/, ""); } }
function toolEnv() { const dir=path.dirname(toolPath("scrcpy.exe")); return { ...process.env, PATH: `${dir};${process.env.PATH ?? ""}` }; }
export class DeviceManager {
 private mirrorProcess: ChildProcess|null=null; private secondaryProcess: ChildProcess|null=null;
 getPcResources(): PcResources { const total=os.totalmem(), free=os.freemem(); return { totalRamBytes:total, freeRamBytes:free, usedRamBytes:total-free, cpuCores:os.cpus().length, platform:os.platform() }; }
 async getStatus() {
  let adbAvailable=false,scrcpyAvailable=false,devices:DeviceRecord[]=[];
  try { const {stdout}=await execFileAsync(command("adb.exe"),["devices","-l"],{windowsHide:true,timeout:7000,env:toolEnv()}); adbAvailable=true; devices=parseAdbDevices(stdout); } catch {}
  try { await execFileAsync(command("scrcpy.exe"),["--version"],{windowsHide:true,timeout:7000,env:toolEnv()}); scrcpyAvailable=true; } catch {}
  return {adbAvailable,scrcpyAvailable,devices,mirrorRunning:Boolean(this.mirrorProcess&&!this.mirrorProcess.killed),secondaryRunning:Boolean(this.secondaryProcess&&!this.secondaryProcess.killed),pcResources:this.getPcResources()};
 }
 private async validate(deviceId:string):Promise<string|null> {
  const s=await this.getStatus(); if(!s.adbAvailable||!s.scrcpyAvailable)return "DualView's bundled Android tools are unavailable. Reinstall DualView.";
  const d=s.devices.find(x=>x.id===deviceId); if(!d)return "Phone disconnected. Refresh the device list."; if(d.state==="unauthorized")return "Unlock your phone and approve USB debugging."; if(d.state!=="device")return "Phone is not ready. Reconnect it.";
  try { const {stdout}=await execFileAsync(command("adb.exe"),["-s",deviceId,"shell","getprop","ro.build.version.sdk"],{windowsHide:true,timeout:7000,env:toolEnv()}); if(Number(stdout.trim())<29)return "The secondary virtual display requires Android 10 or newer."; } catch { return "Could not check Android version."; }
  return null;
 }
 private launch(args:string[],assign:(p:ChildProcess|null)=>void,label:string):Promise<{ok:boolean;message:string}> {
  return new Promise(resolve=>{ const child=spawn(command("scrcpy.exe"),args,{windowsHide:false,stdio:"ignore",env:toolEnv()}); assign(child); let settled=false;
   child.once("spawn",()=>{settled=true;resolve({ok:true,message:label});}); child.once("error",e=>{assign(null);if(!settled)resolve({ok:false,message:`Could not start scrcpy: ${e.message}`});}); child.once("exit",()=>assign(null));
  });
 }
 async startMirror(id:string,orientation:"auto"|"portrait"|"landscape"="auto") {
  if(this.mirrorProcess&&!this.mirrorProcess.killed)return {ok:false,message:"Phone screen is already open."};
  const e=await this.validate(id);if(e)return {ok:false,message:e};const args=["--serial",id,"--window-title=DualView Phone Screen"];
  if(orientation==="landscape")args.push("--orientation=90");if(orientation==="portrait")args.push("--orientation=0");
  return this.launch(args,p=>this.mirrorProcess=p,"Phone screen opened.");
 }
 async stopMirror(){if(!this.mirrorProcess||this.mirrorProcess.killed)return {ok:true,message:"Phone screen is not open."};this.mirrorProcess.kill();this.mirrorProcess=null;return {ok:true,message:"Phone screen closed."};}
 async startSecondaryDisplay(id:string){
  if(this.secondaryProcess&&!this.secondaryProcess.killed)return {ok:false,message:"The Android workspace is already open."};
  const e=await this.validate(id);if(e)return {ok:false,message:e};
  // No --start-app: Android displays its own launcher/home screen so the user opens apps inside Android.
  return this.launch(["--serial",id,"--new-display=1280x800/160","--window-title=DualView Android Workspace"],p=>this.secondaryProcess=p,"Android virtual workspace opened. Use the Android launcher inside that window to open apps.");
 }
 async stopSecondaryDisplay(){if(!this.secondaryProcess||this.secondaryProcess.killed)return {ok:true,message:"Android workspace is not open."};this.secondaryProcess.kill();this.secondaryProcess=null;return {ok:true,message:"Android workspace closed."};}
 async stopAll(){await this.stopMirror();await this.stopSecondaryDisplay();}
}
