import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("dualview", {
  getStatus: () => ipcRenderer.invoke("dualview:status"),
  refreshDevices: () => ipcRenderer.invoke("dualview:refresh"),
  startMirror: (id: string) => ipcRenderer.invoke("dualview:start-mirror", id),
  stopMirror: () => ipcRenderer.invoke("dualview:stop-mirror"),
  startSecondaryDisplay: (id: string, pkg: string) => ipcRenderer.invoke("dualview:start-secondary", id, pkg),
  stopSecondaryDisplay: () => ipcRenderer.invoke("dualview:stop-secondary"),
});
