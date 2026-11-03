import { app } from "electron";
import { execFile, spawn, ChildProcess } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { buildScrcpyArgs, parseAdbDevices } from "./adb-parser";
const execFileAsync = promisify(execFile);
export { buildScrcpyArgs, parseAdbDevices };
export interface DeviceRecord { id: string; state: "device" | "unauthorized" | "offline" | "unknown"; model?: string }
export interface ToolStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: DeviceRecord[] }
export interface ResourceStats {
  pc: { totalMemory: number; freeMemory: number; appMemory: number; cpuCount: number };
  phone: { totalMemory: number | null; availableMemory: number | null; thermal: string | null };
}
function toolPath(name: string): string {
  return app.isPackaged ? path.join(process.resourcesPath, "scrcpy", name) : path.join(process.cwd(), "vendor", "scrcpy", name);
}
function command(name: string): string {
  const bundled = toolPath(name);
  try { require("node:fs").accessSync(bundled); return bundled; } catch { return name.replace(/\.exe$/, ""); }
}
function toolEnv() { const dir = path.dirname(toolPath("scrcpy.exe")); return { ...process.env, PATH: `${dir};${process.env.PATH ?? ""}` }; }
function parseKb(text: string, key: string): number | null {
  const match = text.match(new RegExp(`^${key}:\\s+(\\d+)\\s+kB`, "mi"));
  return match ? Number(match[1]) * 1024 : null;
}
export class DeviceManager {
  private mirrorProcess: ChildProcess | null = null;
  private secondaryProcess: ChildProcess | null = null;
  async getStatus(): Promise<ToolStatus & { mirrorRunning: boolean; secondaryRunning: boolean }> {
    let adbAvailable = false, scrcpyAvailable = false, devices: DeviceRecord[] = [];
    try { const { stdout } = await execFileAsync(command("adb.exe"), ["devices", "-l"], { windowsHide: true, timeout: 7000, env: toolEnv() }); adbAvailable = true; devices = parseAdbDevices(stdout); } catch {}
    try { await execFileAsync(command("scrcpy.exe"), ["--version"], { windowsHide: true, timeout: 7000, env: toolEnv() }); scrcpyAvailable = true; } catch {}
    return { adbAvailable, scrcpyAvailable, devices, mirrorRunning: Boolean(this.mirrorProcess && !this.mirrorProcess.killed), secondaryRunning: Boolean(this.secondaryProcess && !this.secondaryProcess.killed) };
  }
  async getResourceStats(deviceId?: string): Promise<ResourceStats> {
    let phone: ResourceStats["phone"] = { totalMemory: null, availableMemory: null, thermal: null };
    if (deviceId) {
      try {
        const { stdout } = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "cat", "/proc/meminfo"], { windowsHide: true, timeout: 5000, env: toolEnv() });
        phone.totalMemory = parseKb(stdout, "MemTotal");
        phone.availableMemory = parseKb(stdout, "MemAvailable");
      } catch {}
      try {
        const { stdout } = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "dumpsys", "thermalservice"], { windowsHide: true, timeout: 5000, env: toolEnv() });
        const temps = [...stdout.matchAll(/(?:Temperature|mValue)=\s*(-?\d+(?:\.\d+)?)/gi)].map(m => Number(m[1])).filter(n => n > 0 && n < 150);
        if (temps.length) phone.thermal = `${Math.max(...temps).toFixed(1)} °C (highest reported sensor)`;
      } catch {}
    }
    const memory = process.memoryUsage();
    return { pc: { totalMemory: os.totalmem(), freeMemory: os.freemem(), appMemory: memory.rss, cpuCount: os.cpus().length }, phone };
  }
  private async validate(deviceId: string): Promise<string | null> {
    const status = await this.getStatus();
    if (!status.adbAvailable || !status.scrcpyAvailable) return "DualView's bundled Android tools are unavailable. Reinstall DualView.";
    const device = status.devices.find((item) => item.id === deviceId);
    if (!device) return "That phone is no longer connected. Refresh the device list.";
    if (device.state === "unauthorized") return "Unlock your phone and approve the USB debugging permission prompt.";
    if (device.state !== "device") return "The phone is not ready. Check the connection and reconnect it.";
    try {
      const { stdout } = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "getprop", "ro.build.version.sdk"], { windowsHide: true, timeout: 7000, env: toolEnv() });
      if (Number(stdout.trim()) < 29) return "A separate Android display requires Android 10 (API 29) or newer.";
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
    const args = ["--serial", deviceId, "--stay-awake", "--max-fps=30", "--video-bit-rate=4M"];
    if (orientation === "landscape") args.push("--orientation=90");
    if (orientation === "portrait") args.push("--orientation=0");
    return this.launch(args, p => { this.mirrorProcess = p; }, "Phone screen opened with balanced streaming settings.");
  }
  async stopMirror() {
    if (!this.mirrorProcess || this.mirrorProcess.killed) return { ok: true, message: "Phone screen is not open." };
    this.mirrorProcess.kill(); this.mirrorProcess = null; return { ok: true, message: "Phone screen closed." };
  }
  async startSecondaryDisplay(deviceId: string, width: number, height: number) {
    if (this.secondaryProcess && !this.secondaryProcess.killed) return { ok: false, message: "The DualView desktop is already running." };
    const error = await this.validate(deviceId); if (error) return { ok: false, message: error };
    const w = Math.max(800, Math.min(3840, Math.round(width)));
    const h = Math.max(600, Math.min(2160, Math.round(height)));
    let launcherPackage = "";
    try {
      const { stdout } = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "cmd", "package", "resolve-activity", "--brief", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.HOME"], { windowsHide: true, timeout: 10000, env: toolEnv() });
      const component = stdout.split(/\r?\n/).map(line => line.trim()).find(line => line.includes("/") && /^[a-zA-Z0-9_.]+\//.test(line));
      if (component) launcherPackage = component.split("/")[0];
    } catch {}
    const args = ["--serial", deviceId, `--new-display=${w}x${h}`, "--fullscreen", "--window-title=DualView Android Desktop", "--video-bit-rate=4M", "--max-fps=30", "--stay-awake"];
    if (launcherPackage) args.push(`--start-app=${launcherPackage}`);
    return this.launch(args, p => { this.secondaryProcess = p; }, launcherPackage
      ? "Android desktop opened full-screen with your phone's default launcher. Open apps from its app drawer."
      : "Android desktop opened full-screen. This phone did not expose a default HOME launcher to Android's secondary display.");
  }
  async stopSecondaryDisplay() {
    if (!this.secondaryProcess || this.secondaryProcess.killed) return { ok: true, message: "DualView desktop is not open." };
    this.secondaryProcess.kill(); this.secondaryProcess = null; return { ok: true, message: "DualView desktop closed." };
  }
  async sendFiles(deviceId: string, files: string[]) {
    const error = await this.validate(deviceId); if (error) return { ok: false, message: error };
    try {
      await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "mkdir", "-p", "/sdcard/Download/DualView"], { windowsHide: true, timeout: 10000, env: toolEnv() });
      for (const file of files) await execFileAsync(command("adb.exe"), ["-s", deviceId, "push", file, "/sdcard/Download/DualView/"], { windowsHide: true, timeout: 120000, env: toolEnv(), maxBuffer: 4 * 1024 * 1024 });
      return { ok: true, message: `Transferred ${files.length} file(s) to Download/DualView on your phone.` };
    } catch (e) { return { ok: false, message: e instanceof Error ? e.message : "File transfer failed." }; }
  }
  async stopAll() { await this.stopMirror(); await this.stopSecondaryDisplay(); }
}
