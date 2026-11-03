export type DeviceState = "device" | "unauthorized" | "offline" | "unknown";
export interface AndroidDevice { id: string; state: DeviceState; model?: string }
export interface InstalledAndroidApp { packageName: string; label: string }
export interface ResourceStats {
  pc: { totalMemory: number; freeMemory: number; appMemory: number; cpuCount: number };
  phone: { totalMemory: number | null; availableMemory: number | null; thermal: string | null };
}
export interface DualViewStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: AndroidDevice[]; mirrorRunning: boolean; secondaryRunning: boolean }
export interface DesktopBridge {
  getStatus: () => Promise<DualViewStatus>;
  refreshDevices: () => Promise<DualViewStatus>;
  getResourceStats: (id?: string) => Promise<ResourceStats>;
  startMirror: (id: string, orientation: "auto" | "portrait" | "landscape") => Promise<{ ok: boolean; message: string }>;
  getInstalledApps: (id: string) => Promise<InstalledAndroidApp[]>;
  stopMirror: () => Promise<{ ok: boolean; message: string }>;
  startSecondaryDisplay: (id: string) => Promise<{ ok: boolean; message: string }>;
  sendFiles: (id: string) => Promise<{ ok: boolean; message: string }>;
  stopSecondaryDisplay: () => Promise<{ ok: boolean; message: string }>;
}
declare global { interface Window { dualview?: DesktopBridge } }
