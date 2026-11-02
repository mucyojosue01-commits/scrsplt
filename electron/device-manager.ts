import { app } from "electron";
import { execFile, spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { buildScrcpyArgs, parseAdbDevices } from "./adb-parser";
const execFileAsync = promisify(execFile);
export { buildScrcpyArgs, parseAdbDevices };
export interface DeviceRecord { id: string; state: "device" | "unauthorized" | "offline" | "unknown"; model?: string }
export interface ToolStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: DeviceRecord[] }

function toolPath(name: string): string {
  const bundled = app.isPackaged
    ? path.join(process.resourcesPath, "scrcpy", name)
    : path.join(process.cwd(), "vendor", "scrcpy", name);
  return bundled;
}
function command(name: string): string {
  const bundled = toolPath(name);
  try { require("node:fs").accessSync(bundled); return bundled; } catch { return name.replace(/\.exe$/, ""); }
}
function toolEnv() {
  const dir = path.dirname(toolPath("scrcpy.exe"));
  return { ...process.env, PATH: `${dir};${process.env.PATH ?? ""}` };
}

export class DeviceManager {
  private mirrorProcess: ChildProcess | null = null;
  async getStatus(): Promise<ToolStatus & { mirrorRunning: boolean }> {
    let adbAvailable = false, scrcpyAvailable = false;
    let devices: DeviceRecord[] = [];
    try {
      const { stdout } = await execFileAsync(command("adb.exe"), ["devices", "-l"], { windowsHide: true, timeout: 7000, env: toolEnv() });
      adbAvailable = true;
      devices = parseAdbDevices(stdout);
    } catch { /* The bundled tools are checked first; PATH is a development fallback. */ }
    try {
      await execFileAsync(command("scrcpy.exe"), ["--version"], { windowsHide: true, timeout: 7000, env: toolEnv() });
      scrcpyAvailable = true;
    } catch { /* Missing tools are reported in the UI. */ }
    return { adbAvailable, scrcpyAvailable, devices, mirrorRunning: Boolean(this.mirrorProcess && !this.mirrorProcess.killed) };
  }
  async startMirror(deviceId: string): Promise<{ ok: boolean; message: string }> {
    if (this.mirrorProcess && !this.mirrorProcess.killed) return { ok: false, message: "A mirroring session is already running." };
    const status = await this.getStatus();
    if (!status.adbAvailable) return { ok: false, message: "The bundled ADB runtime could not start. Reinstall DualView." };
    if (!status.scrcpyAvailable) return { ok: false, message: "The bundled screen-mirroring runtime could not start. Reinstall DualView." };
    const device = status.devices.find((item) => item.id === deviceId);
    if (!device) return { ok: false, message: "That phone is no longer connected. Refresh the device list." };
    if (device.state === "unauthorized") return { ok: false, message: "Unlock your phone and approve the USB debugging permission prompt." };
    if (device.state !== "device") return { ok: false, message: "The phone is not ready. Check the USB cable and reconnect it." };
    return new Promise((resolve) => {
      const child = spawn(command("scrcpy.exe"), buildScrcpyArgs(deviceId), { windowsHide: false, stdio: "ignore", env: toolEnv() });
      this.mirrorProcess = child;
      let settled = false;
      child.once("spawn", () => { settled = true; resolve({ ok: true, message: "Phone video window started. Keep DualView open while using it." }); });
      child.once("error", (error) => { this.mirrorProcess = null; if (!settled) resolve({ ok: false, message: `Could not start screen mirroring: ${error.message}` }); });
      child.once("exit", () => { this.mirrorProcess = null; });
    });
  }
  async stopMirror(): Promise<{ ok: boolean; message: string }> {
    if (!this.mirrorProcess || this.mirrorProcess.killed) return { ok: true, message: "No mirroring session is running." };
    this.mirrorProcess.kill(); this.mirrorProcess = null;
    return { ok: true, message: "Mirroring process stopped." };
  }
}
