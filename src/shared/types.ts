export type DeviceState = "device" | "unauthorized" | "offline" | "unknown";
export interface AndroidDevice { id: string; state: DeviceState; model?: string }
export interface MemoryProcess { packageName: string; label: string; memoryKb: number; isForeground: boolean; safeToStop: boolean }
export interface ResourceStats { memoryProcesses: MemoryProcess[]; workloads: WorkloadInfo[]; sampledAt: number;
  pc: { totalMemory: number; freeMemory: number; appMemory: number; cpuCount: number; cpuPercent: number | null; disks: Array<{ name: string; total: number; free: number }> };
  phone: { totalMemory: number | null; availableMemory: number | null; thermal: string | null; storageTotal: number | null; storageFree: number | null; foregroundApp: string | null; foregroundAppMemory: string | null };
}
export interface WorkloadInfo { name: string; device: "PC" | "PHONE"; detail: string; active: boolean }
export interface DualViewStatus { adbAvailable: boolean; scrcpyAvailable: boolean; devices: AndroidDevice[]; mirrorRunning: boolean; secondaryRunning: boolean }
export interface DesktopBridge {
  getStatus: () => Promise<DualViewStatus>;
  refreshDevices: () => Promise<DualViewStatus>;
  getResourceStats: (id?: string) => Promise<ResourceStats>;
  stopBackgroundApp: (id: string, packageName: string) => Promise<{ ok: boolean; message: string }>;
  startMirror: (id: string, orientation: "auto" | "portrait" | "landscape") => Promise<{ ok: boolean; message: string }>;
  stopMirror: () => Promise<{ ok: boolean; message: string }>;
  startSecondaryDisplay: (id: string) => Promise<{ ok: boolean; message: string }>;
  enableMultiWindow: (id: string) => Promise<{ ok: boolean; message: string }>;
  sendFiles: (id: string) => Promise<{ ok: boolean; message: string }>;
  stopSecondaryDisplay: () => Promise<{ ok: boolean; message: string }>;
}
declare global { interface Window { dualview?: DesktopBridge } }
