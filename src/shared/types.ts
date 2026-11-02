export type DeviceState = "device" | "unauthorized" | "offline" | "unknown";
export interface AndroidDevice {
  id: string;
  state: DeviceState;
  model?: string;
}
export interface DualViewStatus {
  adbAvailable: boolean;
  scrcpyAvailable: boolean;
  devices: AndroidDevice[];
  mirrorRunning: boolean;
}
export interface DesktopBridge {
  getStatus: () => Promise<DualViewStatus>;
  refreshDevices: () => Promise<DualViewStatus>;
  startMirror: (deviceId: string) => Promise<{ ok: boolean; message: string }>;
  stopMirror: () => Promise<{ ok: boolean; message: string }>;
  openExternal: (url: string) => Promise<void>;
}
declare global {
  interface Window { dualview?: DesktopBridge }
}
