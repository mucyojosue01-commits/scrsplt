import type { ScrcpySettings } from "../src/shared/types";
import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("dualview", {
  openVideoBridge: (url: string) => ipcRenderer.invoke("dualview:open-video-bridge", url),
  closeVideoBridge: () => ipcRenderer.invoke("dualview:close-video-bridge"),
  getStatus: () => ipcRenderer.invoke("dualview:status"),
  refreshDevices: () => ipcRenderer.invoke("dualview:refresh"),
  getResourceStats: (id?: string) => ipcRenderer.invoke("dualview:resources", id),
  stopBackgroundApp: (id: string, packageName: string) => ipcRenderer.invoke("dualview:stop-background-app", id, packageName),
  startMirror: (id: string, settings: ScrcpySettings) => ipcRenderer.invoke("dualview:start-mirror", id, settings),
  stopMirror: () => ipcRenderer.invoke("dualview:stop-mirror"),
  startSecondaryDisplay: (id: string, settings: ScrcpySettings) => ipcRenderer.invoke("dualview:start-secondary", id, settings),
  enableMultiWindow: (id: string) => ipcRenderer.invoke("dualview:enable-multi-window", id),
  sendFiles: (id: string) => ipcRenderer.invoke("dualview:send-files", id),
  stopSecondaryDisplay: () => ipcRenderer.invoke("dualview:stop-secondary"),
});
