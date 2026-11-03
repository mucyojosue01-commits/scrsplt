import { app } from "electron";
import { execFile, spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { buildScrcpyArgs, parseAdbDevices } from "./adb-parser";
const execFileAsync = promisify(execFile);
export { buildScrcpyArgs, parseAdbDevices };
export interface DeviceRecord { id: string; state: "device" | "unauthorized" | "offline" | "unknown"; model?: string }
export interface ToolStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: DeviceRecord[] }
export interface InstalledApp { packageName: string; label: string }
function toolPath(name: string): string {
  return app.isPackaged ? path.join(process.resourcesPath, "scrcpy", name) : path.join(process.cwd(), "vendor", "scrcpy", name);
}
function command(name: string): string {
  const bundled = toolPath(name);
  try { require("node:fs").accessSync(bundled); return bundled; } catch { return name.replace(/\.exe$/, ""); }
}
function toolEnv() { const dir = path.dirname(toolPath("scrcpy.exe")); return { ...process.env, PATH: `${dir};${process.env.PATH ?? ""}` }; }
export class DeviceManager {
  private mirrorProcess: ChildProcess | null = null;
  private secondaryProcess: ChildProcess | null = null;
  async getStatus(): Promise<ToolStatus & { mirrorRunning: boolean; secondaryRunning: boolean }> {
    let adbAvailable = false, scrcpyAvailable = false, devices: DeviceRecord[] = [];
    try { const { stdout } = await execFileAsync(command("adb.exe"), ["devices", "-l"], { windowsHide: true, timeout: 7000, env: toolEnv() }); adbAvailable = true; devices = parseAdbDevices(stdout); } catch {}
    try { await execFileAsync(command("scrcpy.exe"), ["--version"], { windowsHide: true, timeout: 7000, env: toolEnv() }); scrcpyAvailable = true; } catch {}
    return { adbAvailable, scrcpyAvailable, devices, mirrorRunning: Boolean(this.mirrorProcess && !this.mirrorProcess.killed), secondaryRunning: Boolean(this.secondaryProcess && !this.secondaryProcess.killed) };
  }
  async getInstalledApps(deviceId: string): Promise<InstalledApp[]> {
    const error = await this.validate(deviceId); if (error) throw new Error(error);
    const { stdout } = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "cmd", "package", "query-activities", "--brief", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER"], { windowsHide: true, timeout: 15000, env: toolEnv() });
    const packages = new Set<string>();
    for (const line of stdout.split(/\\r?\\n/)) {
      const match = line.trim().match(/(?:ComponentInfo\\{)?([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)+)\\//);
      if (match) packages.add(match[1]);
    }
    return [...packages].map(packageName => ({ packageName, label: packageName.split(".").pop()!.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\\b\\w/g, c => c.toUpperCase()) })).sort((a,b)=>a.label.localeCompare(b.label));\n  }
  private async validate(deviceId: string): Promise<string | null> {
    const status = await this.getStatus();
    if (!status.adbAvailable || !status.scrcpyAvailable) return "DualView's bundled Android tools are unavailable. Reinstall DualView.";
    const device = status.devices.find((item) => item.id === deviceId);
    if (!device) return "That phone is no longer connected. Refresh the device list.";
    if (device.state === "unauthorized") return "Unlock your phone and approve the USB debugging permission prompt.";
    if (device.state !== "device") return "The phone is not ready. Check the connection and reconnect it.";
    try {
      const { stdout } = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "getprop", "ro.build.version.sdk"], { windowsHide: true, timeout: 7000, env: toolEnv() });
      if (Number(stdout.trim()) < 29) return "A separate Android display requires Android 10 (API 29) or newer. Your phone can still use normal mirroring.";
    } catch { return "Could not check Android version. Reconnect the phone and try again."; }
    return null;
  }
  private launch(args: string[], assign: (child: ChildProcess | null) => void, label: string): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) => {
      const child = spawn(command("scrcpy.exe"), args, { windowsHide: false, stdio: "ignore", env: toolEnv() });
      assign(child); let settled = false;
      child.once("spawn", () => { settled = true; resolve({ ok: true, message: label }); });
      child.once("error", (error) => { assign(null); if (!settled) resolve({ ok: false, message: `Could not start scrcpy: ${error.message}` }); });
      child.once("exit", () => assign(null));
    });
  }
  async startMirror(deviceId: string, orientation: "auto" | "portrait" | "landscape" = "auto") {
    if (this.mirrorProcess && !this.mirrorProcess.killed) return { ok: false, message: "The phone screen is already open." };
    const error = await this.validate(deviceId); if (error) return { ok: false, message: error };
    const args = ["--serial", deviceId];
    if (orientation === "landscape") args.push("--orientation=90");
    if (orientation === "portrait") args.push("--orientation=0");
    return this.launch(args, (p) => { this.mirrorProcess = p; }, `Phone screen opened in ${orientation} orientation.`);
  }
  async stopMirror() {
    if (!this.mirrorProcess || this.mirrorProcess.killed) return { ok: true, message: "Phone screen is not open." };
    this.mirrorProcess.kill(); this.mirrorProcess = null; return { ok: true, message: "Phone screen closed." };
  }
  async startSecondaryDisplay(deviceId: string, packageName: string) {
    if (this.secondaryProcess && !this.secondaryProcess.killed) return { ok: false, message: "The second Android screen is already running." };
    const error = await this.validate(deviceId); if (error) return { ok: false, message: error };
    const pkg = String(packageName ?? "").trim();
    if (!/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/.test(pkg)) return { ok: false, message: "Enter a valid Android app package name, for example com.android.settings." };
    return this.launch(["--serial", deviceId, "--new-display=1024x768/160", `--start-app=${pkg}`, "--window-title=DualView Second Android Screen"], (p) => { this.secondaryProcess = p; }, `Opening ${pkg} on a separate Android display. Your phone's current screen stays independent.`);
  }
  async stopSecondaryDisplay() {
    if (!this.secondaryProcess || this.secondaryProcess.killed) return { ok: true, message: "Second Android screen is not open." };
    this.secondaryProcess.kill(); this.secondaryProcess = null; return { ok: true, message: "Second Android screen closed." };
  }
  async stopAll() { await this.stopMirror(); await this.stopSecondaryDisplay(); }
}
