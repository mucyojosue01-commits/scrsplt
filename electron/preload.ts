import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("dualview", {
  getStatus: () => ipcRenderer.invoke("dualview:status"),
  refreshDevices: () => ipcRenderer.invoke("dualview:refresh"),
  getResourceStats: (id?: string) => ipcRenderer.invoke("dualview:resources", id),
  startMirror: (id: string, orientation: "auto" | "portrait" | "landscape", profile: "cool" | "balanced" | "quality") => ipcRenderer.invoke("dualview:start-mirror", id, orientation, profile),
  stopMirror: () => ipcRenderer.invoke("dualview:stop-mirror"),
  startSecondaryDisplay: (id: string, profile: "cool" | "balanced" | "quality") => ipcRenderer.invoke("dualview:start-secondary", id, profile),
  enableMultiWindow: (id: string) => ipcRenderer.invoke("dualview:enable-multi-window", id),
  sendFiles: (id: string) => ipcRenderer.invoke("dualview:send-files", id),
  stopSecondaryDisplay: () => ipcRenderer.invoke("dualview:stop-secondary"),
});
