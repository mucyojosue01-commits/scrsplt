import { execFile, spawn, ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { buildScrcpyArgs, parseAdbDevices } from "../src/shared/adb";
const execFileAsync = promisify(execFile);
export { buildScrcpyArgs, parseAdbDevices };
export interface DeviceRecord { id: string; state: "device" | "unauthorized" | "offline" | "unknown"; model?: string }
export interface ToolStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: DeviceRecord[] }

export class DeviceManager {
  private mirrorProcess: ChildProcess | null = null;
  async getStatus(): Promise<ToolStatus & { mirrorRunning: boolean }> {
    let adbAvailable = false, scrcpyAvailable = false;
    let devices: DeviceRecord[] = [];
    try {
      const { stdout } = await execFileAsync("adb", ["devices", "-l"], { windowsHide: true, timeout: 5000 });
      adbAvailable = true;
      devices = parseAdbDevices(stdout);
    } catch { /* ADB is optional until installed. */ }
    try {
      await execFileAsync("scrcpy", ["--version"], { windowsHide: true, timeout: 5000 });
      scrcpyAvailable = true;
    } catch { /* scrcpy is optional until installed. */ }
    return { adbAvailable, scrcpyAvailable, devices, mirrorRunning: Boolean(this.mirrorProcess && !this.mirrorProcess.killed) };
  }
  async startMirror(deviceId: string): Promise<{ ok: boolean; message: string }> {
    if (this.mirrorProcess && !this.mirrorProcess.killed) return { ok: false, message: "A mirroring session is already running." };
    const status = await this.getStatus();
    if (!status.adbAvailable) return { ok: false, message: "ADB was not found. Install Android Platform Tools and add its folder to PATH." };
    if (!status.scrcpyAvailable) return { ok: false, message: "scrcpy was not found. Install scrcpy and add it to PATH." };
    const device = status.devices.find((item) => item.id === deviceId);
    if (!device) return { ok: false, message: "That phone is no longer connected. Refresh the device list." };
    if (device.state === "unauthorized") return { ok: false, message: "Unlock your phone and approve the USB debugging permission prompt." };
    if (device.state !== "device") return { ok: false, message: "The phone is not ready. Check the USB cable and reconnect it." };
    return new Promise((resolve) => {
      const child = spawn("scrcpy", buildScrcpyArgs(deviceId), { windowsHide: false, stdio: "ignore" });
      this.mirrorProcess = child;
      let settled = false;
      child.once("spawn", () => { settled = true; resolve({ ok: true, message: "Mirroring window started." }); });
      child.once("error", (error) => { this.mirrorProcess = null; if (!settled) resolve({ ok: false, message: `Could not start scrcpy: ${error.message}` }); });
      child.once("exit", () => { this.mirrorProcess = null; });
    });
  }
  async stopMirror(): Promise<{ ok: boolean; message: string }> {
    if (!this.mirrorProcess || this.mirrorProcess.killed) return { ok: true, message: "No mirroring session is running." };
    this.mirrorProcess.kill(); this.mirrorProcess = null;
    return { ok: true, message: "Mirroring process stopped." };
  }
}
