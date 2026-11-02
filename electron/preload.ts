import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("dualview", {
  getStatus: () => ipcRenderer.invoke("dualview:status"),
  refreshDevices: () => ipcRenderer.invoke("dualview:refresh"),
  startMirror: (deviceId: string) => ipcRenderer.invoke("dualview:start-mirror", deviceId),
  stopMirror: () => ipcRenderer.invoke("dualview:stop-mirror"),
  getEmulatorStatus: () => ipcRenderer.invoke("dualview:emulator-status"),
  startEmulator: (avdName: string) => ipcRenderer.invoke("dualview:emulator-start", avdName),
  stopEmulator: () => ipcRenderer.invoke("dualview:emulator-stop"),
  openExternal: (url: string) => ipcRenderer.invoke("dualview:open-external", url),
});
