import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";

const execFileAsync = promisify(execFile);

export interface EmulatorStatus {
  available: boolean;
  avds: string[];
  running: string[];
  sdkPath: string | null;
}

function sdkCandidates(): string[] {
  const candidates = [
    process.env.ANDROID_SDK_ROOT,
    process.env.ANDROID_HOME,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk") : undefined,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, "AppData", "Local", "Android", "Sdk") : undefined,
  ];
  return [...new Set(candidates.filter((value): value is string => Boolean(value)))];
}

function findSdk(): string | null {
  return sdkCandidates().find((candidate) =>
    fs.existsSync(path.join(candidate, "emulator", "emulator.exe")) &&
    fs.existsSync(path.join(candidate, "platform-tools", "adb.exe"))
  ) ?? null;
}

export class AndroidEmulatorManager {
  private get sdkPath(): string | null { return findSdk(); }
  private get emulatorPath(): string | null {
    return this.sdkPath ? path.join(this.sdkPath, "emulator", "emulator.exe") : null;
  }
  private get adbPath(): string | null {
    return this.sdkPath ? path.join(this.sdkPath, "platform-tools", "adb.exe") : null;
  }

  async getStatus(): Promise<EmulatorStatus> {
    const sdkPath = this.sdkPath;
    const emulatorPath = this.emulatorPath;
    const adbPath = this.adbPath;
    if (!sdkPath || !emulatorPath || !adbPath) {
      return { available: false, avds: [], running: [], sdkPath: null };
    }
    try {
      const [avdResult, deviceResult] = await Promise.all([
        execFileAsync(emulatorPath, ["-list-avds"], { windowsHide: true, timeout: 10000 }),
        execFileAsync(adbPath, ["devices"], { windowsHide: true, timeout: 10000 }),
      ]);
      const avds = avdResult.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const running = deviceResult.stdout.split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/)[0])
        .filter((id) => /^emulator-\d+$/.test(id));
      return { available: true, avds, running, sdkPath };
    } catch {
      return { available: false, avds: [], running: [], sdkPath };
    }
  }

  async start(avdName: string): Promise<{ ok: boolean; message: string }> {
    const status = await this.getStatus();
    if (!status.available || !this.emulatorPath) {
      return { ok: false, message: "Android Emulator was not found. Install Android Studio and create an Android Virtual Device (AVD), then refresh." };
    }
    if (!status.avds.includes(avdName)) {
      return { ok: false, message: "That virtual device is no longer available. Refresh the list." };
    }
    if (status.running.length) {
      return { ok: false, message: "An Android emulator is already running." };
    }
    try {
      const child = spawn(this.emulatorPath, ["-avd", avdName], {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
        env: process.env,
      });
      child.once("error", () => undefined);
      child.unref();
      return { ok: true, message: `Starting Android on PC: ${avdName}. The emulator may take a minute to boot.` };
    } catch (error) {
      return { ok: false, message: `Could not start the Android emulator: ${error instanceof Error ? error.message : "Unknown error"}` };
    }
  }

  async stop(): Promise<{ ok: boolean; message: string }> {
    const status = await this.getStatus();
    if (!status.available || !this.adbPath) {
      return { ok: false, message: "Android Emulator tools are not available." };
    }
    if (!status.running.length) return { ok: true, message: "No Android emulator is running." };
    const results = await Promise.all(status.running.map(async (serial) => {
      try {
        await execFileAsync(this.adbPath!, ["-s", serial, "emu", "kill"], { windowsHide: true, timeout: 10000 });
        return true;
      } catch { return false; }
    }));
    return results.every(Boolean)
      ? { ok: true, message: "Android emulator closed." }
      : { ok: false, message: "Could not close every emulator. Close it from its own window and refresh." };
  }
}
