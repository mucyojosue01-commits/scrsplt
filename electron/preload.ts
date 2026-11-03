import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("dualview", {
  getStatus: () => ipcRenderer.invoke("dualview:status"),
  refreshDevices: () => ipcRenderer.invoke("dualview:refresh"),
  getResourceStats: (id?: string) => ipcRenderer.invoke("dualview:resources", id),
  startMirror: (id: string, orientation: "auto" | "portrait" | "landscape") => ipcRenderer.invoke("dualview:start-mirror", id, orientation),
  stopMirror: () => ipcRenderer.invoke("dualview:stop-mirror"),
  startSecondaryDisplay: (id: string) => ipcRenderer.invoke("dualview:start-secondary", id),
  sendFiles: (id: string) => ipcRenderer.invoke("dualview:send-files", id),
  stopSecondaryDisplay: () => ipcRenderer.invoke("dualview:stop-secondary"),
});
