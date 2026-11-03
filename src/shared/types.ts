export type DeviceState = "device" | "unauthorized" | "offline" | "unknown";
export interface AndroidDevice { id: string; state: DeviceState; model?: string }
export interface DualViewStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: AndroidDevice[]; mirrorRunning: boolean; secondaryRunning: boolean }
export interface DesktopBridge {
  getStatus: () => Promise<DualViewStatus>;
  refreshDevices: () => Promise<DualViewStatus>;
  startMirror: (id: string) => Promise<{ ok: boolean; message: string }>;
  stopMirror: () => Promise<{ ok: boolean; message: string }>;
  startSecondaryDisplay: (id: string, pkg: string) => Promise<{ ok: boolean; message: string }>;
  stopSecondaryDisplay: () => Promise<{ ok: boolean; message: string }>;
}
declare global { interface Window { dualview?: DesktopBridge } }
