import { contextBridge, ipcRenderer } from "electron";
import type { DesktopBridge } from "../src/shared/types";

const bridge: DesktopBridge = {
  getStatus: () => ipcRenderer.invoke("dualview:status"),
  refreshDevices: () => ipcRenderer.invoke("dualview:refresh"),
  startMirror: (deviceId) => ipcRenderer.invoke("dualview:start-mirror", deviceId),
  stopMirror: () => ipcRenderer.invoke("dualview:stop-mirror"),
  openExternal: (url) => ipcRenderer.invoke("dualview:open-external", url),
};
contextBridge.exposeInMainWorld("dualview", bridge);
