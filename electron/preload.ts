import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("dualview", {
  getStatus: () => ipcRenderer.invoke("dualview:status"),
  refreshDevices: () => ipcRenderer.invoke("dualview:refresh"),
  startMirror: (deviceId: string) => ipcRenderer.invoke("dualview:start-mirror", deviceId),
  stopMirror: () => ipcRenderer.invoke("dualview:stop-mirror"),
  openExternal: (url: string) => ipcRenderer.invoke("dualview:open-external", url),
});
