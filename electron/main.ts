import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { DeviceManager } from "./device-manager";
const manager = new DeviceManager();
const isDev = !app.isPackaged;
function createWindow() {
  const window = new BrowserWindow({ width: 1180, height: 780, minWidth: 900, minHeight: 620, backgroundColor: "#101713", title: "DualView", autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  if (isDev) void window.loadURL("http://localhost:5173"); else void window.loadFile(path.join(__dirname, "../dist/index.html"));
}
app.whenReady().then(() => {
  ipcMain.handle("dualview:status", () => manager.getStatus());
  ipcMain.handle("dualview:refresh", () => manager.getStatus());
  ipcMain.handle("dualview:start-mirror", (_event, id: string) => manager.startMirror(id));
  ipcMain.handle("dualview:stop-mirror", () => manager.stopMirror());
  ipcMain.handle("dualview:start-secondary", (_event, id: string, pkg: string) => manager.startSecondaryDisplay(id, pkg));
  ipcMain.handle("dualview:stop-secondary", () => manager.stopSecondaryDisplay());
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("before-quit", () => { void manager.stopAll(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
