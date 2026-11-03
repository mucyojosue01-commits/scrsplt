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
export interface MemoryProcess { packageName: string; label: string; memoryKb: number; isForeground: boolean; safeToStop: boolean }\nexport interface ResourceStats {\n  memoryProcesses: MemoryProcess[];
  pc: { totalMemory: number; freeMemory: number; appMemory: number; cpuCount: number; cpuPercent: number | null; disks: Array<{ name: string; total: number; free: number }> };
  phone: { totalMemory: number | null; availableMemory: number | null; thermal: string | null; storageTotal: number | null; storageFree: number | null; foregroundApp: string | null; foregroundAppMemory: string | null }; workloads: Array<{ name: string; device: "PC" | "PHONE"; detail: string; active: boolean }>; sampledAt: number;
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
  private previousCpu: { idle: number; total: number } | null = null;
  async getResourceStats(deviceId?: string): Promise<ResourceStats> {
    const memoryProcesses = deviceId ? await this.getMemoryProcesses(deviceId).catch(() => []) : [];\n    const phone: ResourceStats["phone"] = { totalMemory: null, availableMemory: null, thermal: null, storageTotal: null, storageFree: null, foregroundApp: null, foregroundAppMemory: null };
    if (deviceId) {
      try { const r = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "cat", "/proc/meminfo"], { windowsHide: true, timeout: 5000, env: toolEnv() }); phone.totalMemory = parseKb(r.stdout, "MemTotal"); phone.availableMemory = parseKb(r.stdout, "MemAvailable"); } catch {}
      try { const r = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "df", "-k", "/data"], { windowsHide: true, timeout: 7000, env: toolEnv() }); const row = r.stdout.trim().split(/\r?\n/).filter(Boolean).slice(-1)[0]?.trim().split(/\s+/); if (row && row.length >= 4) { phone.storageTotal = Number(row[1]) * 1024; phone.storageFree = Number(row[3]) * 1024; } } catch {}
      try { const r = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "dumpsys", "thermalservice"], { windowsHide: true, timeout: 5000, env: toolEnv() }); const values = [...r.stdout.matchAll(/(?:Temperature|mValue)=\s*(-?\d+(?:\.\d+)?)/gi)].map(m => Number(m[1])).filter(n => n > 0 && n < 150); if (values.length) phone.thermal = Math.max(...values).toFixed(1) + " °C (highest reported sensor)"; } catch {}
      try { const r = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "dumpsys", "activity", "activities"], { windowsHide: true, timeout: 7000, env: toolEnv() }); const m = r.stdout.match(/mResumedActivity:.*? ([a-zA-Z0-9_.]+)\//) || r.stdout.match(/topResumedActivity=ActivityRecord\{[^ ]+ ([a-zA-Z0-9_.]+)\//); if (m) { phone.foregroundApp = m[1]; const mem = await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "dumpsys", "meminfo", m[1]], { windowsHide: true, timeout: 7000, env: toolEnv() }); const total = mem.stdout.match(/TOTAL\s+(\d+)/); if (total) phone.foregroundAppMemory = Math.round(Number(total[1]) / 1024) + " MB PSS"; } } catch {}
    }
    const memory = process.memoryUsage(), cpus = os.cpus();
    const totals = cpus.reduce((a, cpu) => ({ idle: a.idle + cpu.times.idle, total: a.total + Object.values(cpu.times).reduce((x, y) => x + y, 0) }), { idle: 0, total: 0 });
    let cpuPercent: number | null = null; if (this.previousCpu) { const delta = totals.total - this.previousCpu.total; if (delta > 0) cpuPercent = Math.max(0, Math.min(100, (1 - (totals.idle - this.previousCpu.idle) / delta) * 100)); } this.previousCpu = totals;
    let disks: ResourceStats["pc"]["disks"] = [];
    if (process.platform === "win32") { try { const r = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_LogicalDisk -Filter \"DriveType=3\" | Select-Object DeviceID,Size,FreeSpace | ConvertTo-Json -Compress"], { windowsHide: true, timeout: 7000, maxBuffer: 1048576 }); const parsed = JSON.parse(r.stdout || "[]"); const rows = Array.isArray(parsed) ? parsed : [parsed]; disks = rows.filter((d: any) => Number(d.Size) > 0).map((d: any) => ({ name: String(d.DeviceID), total: Number(d.Size), free: Number(d.FreeSpace) })); } catch {} }
    return { memoryProcesses, pc: { totalMemory: os.totalmem(), freeMemory: os.freemem(), appMemory: memory.rss, cpuCount: cpus.length, cpuPercent, disks }, phone, sampledAt: Date.now(), workloads: [
      { name: "Android apps and system", device: "PHONE", detail: "Application execution, services and app memory", active: Boolean(deviceId) },
      { name: "Video decode and desktop rendering", device: "PC", detail: "scrcpy video decode and Windows window rendering", active: Boolean(this.mirrorProcess || this.secondaryProcess) },
      { name: "Virtual Android display", device: "PHONE", detail: "Android creates and runs the secondary display", active: Boolean(this.secondaryProcess) },
      { name: "File source and storage", device: "PC", detail: "Files selected and staged from Windows; transfer runs on demand", active: Boolean(deviceId) }
    ] };
  }
  async getMemoryProcesses(deviceId: string): Promise<MemoryProcess[]> {
    const error = await this.validate(deviceId);
    if (error) throw new Error(error);
    const [{ stdout: packagesOut }, { stdout: memOut }, { stdout: activityOut }] = await Promise.all([
      execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "pm", "list", "packages", "-3"], { windowsHide: true, timeout: 12000, env: toolEnv() }),
      execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "dumpsys", "meminfo"], { windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024, env: toolEnv() }),
      execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "dumpsys", "activity", "activities"], { windowsHide: true, timeout: 8000, env: toolEnv() })
    ]);
    const allowed = new Set(packagesOut.split(/\r?\n/).map(line => line.trim().replace(/^package:/, "")).filter(name => /^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/.test(name)));
    const foregroundMatch = activityOut.match(/mResumedActivity:.*? ([a-zA-Z0-9_.]+)\//) || activityOut.match(/topResumedActivity=ActivityRecord\{[^ ]+ ([a-zA-Z0-9_.]+)\//);
    const foreground = foregroundMatch?.[1] ?? "";
    const memory = new Map<string, number>();
    for (const line of memOut.split(/\r?\n/)) {
      const match = line.match(/^\s*([\d,]+)K:\s+([a-zA-Z0-9_.]+)(?:\s+\(pid\s+\d+\))?/);
      if (!match) continue;
      const pkg = match[2], kb = Number(match[1].replace(/,/g, ""));
      if (allowed.has(pkg) && Number.isFinite(kb)) memory.set(pkg, Math.max(memory.get(pkg) ?? 0, kb));
    }
    return [...memory.entries()].map(([packageName, memoryKb]) => ({
      packageName, label: packageName.split(".").pop()!.replace(/[_-]+/g, " "),
      memoryKb, isForeground: packageName === foreground, safeToStop: packageName !== foreground
    })).sort((a, b) => b.memoryKb - a.memoryKb).slice(0, 20);
  }
  async stopBackgroundApp(deviceId: string, packageName: string) {
    const error = await this.validate(deviceId);
    if (error) return { ok: false, message: error };
    if (!/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/.test(packageName)) return { ok: false, message: "Invalid Android package name." };
    try {
      const [{ stdout: packagesOut }, { stdout: activityOut }] = await Promise.all([
        execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "pm", "list", "packages", "-3"], { windowsHide: true, timeout: 10000, env: toolEnv() }),
        execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "dumpsys", "activity", "activities"], { windowsHide: true, timeout: 8000, env: toolEnv() })
      ]);
      const allowed = packagesOut.split(/\r?\n/).some(line => line.trim() === "package:" + packageName);
      const foregroundMatch = activityOut.match(/mResumedActivity:.*? ([a-zA-Z0-9_.]+)\//) || activityOut.match(/topResumedActivity=ActivityRecord\{[^ ]+ ([a-zA-Z0-9_.]+)\//);
      if (!allowed) return { ok: false, message: "Only installed third-party apps can be stopped by DualView. System apps are protected." };
      if (foregroundMatch?.[1] === packageName) return { ok: false, message: "This is the foreground app. Switch to another app before stopping it." };
      await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "am", "force-stop", packageName], { windowsHide: true, timeout: 10000, env: toolEnv() });
      return { ok: true, message: packageName + " was stopped. Android may restart it if a service or notification requires it." };
    } catch (e) { return { ok: false, message: e instanceof Error ? e.message : "Could not stop this app." }; }
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
  async enableMultiWindow(deviceId: string) {
    const error = await this.validate(deviceId);
    if (error) return { ok: false, message: error };
    try {
      await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "settings", "put", "global", "enable_freeform_support", "1"], { windowsHide: true, timeout: 7000, env: toolEnv() });
      await execFileAsync(command("adb.exe"), ["-s", deviceId, "shell", "settings", "put", "global", "force_resizable_activities", "1"], { windowsHide: true, timeout: 7000, env: toolEnv() });
      return { ok: true, message: "Android multi-window preferences enabled where supported. Reopen the Android desktop; actual split-screen availability depends on your phone's Android build and launcher." };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "This Android version does not allow DualView to change multi-window settings." };
    }
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
