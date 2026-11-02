export type AdbDeviceState = "device" | "unauthorized" | "offline" | "unknown";
export interface AdbDevice { id: string; state: AdbDeviceState; model?: string }

export function parseAdbDevices(output: string): AdbDevice[] {
  return output.split(/\r?\n/).slice(1).map((line) => line.trim()).filter(Boolean)
    .filter((line) => !line.startsWith("*") && !line.startsWith("List of devices"))
    .map((line) => {
      const [id, rawState] = line.split(/\s+/);
      const state: AdbDeviceState = rawState === "device" || rawState === "unauthorized" || rawState === "offline" ? rawState : "unknown";
      const modelMatch = line.match(/model:([^\s]+)/);
      return { id, state, ...(modelMatch ? { model: modelMatch[1].replace(/_/g, " ") } : {}) };
    });
}

export function buildScrcpyArgs(deviceId: string): string[] {
  return ["-s", deviceId, "--window-title", "DualView • Android", "--stay-awake"];
}
