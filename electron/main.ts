import { app, BrowserWindow, dialog, ipcMain, screen } from "electron";
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
  ipcMain.handle("dualview:resources", (_event, id?: string) => manager.getResourceStats(id));
  ipcMain.handle("dualview:start-mirror", (_event, id: string, orientation: "auto" | "portrait" | "landscape", profile: "cool" | "balanced" | "quality") => manager.startMirror(id, orientation, profile));
  ipcMain.handle("dualview:stop-mirror", () => manager.stopMirror());
  ipcMain.handle("dualview:start-secondary", (_event, id: string, profile: "cool" | "balanced" | "quality") => {
    const { width, height } = screen.getPrimaryDisplay().size;
    return manager.startSecondaryDisplay(id, width, height, profile);
  });
  ipcMain.handle("dualview:enable-multi-window", (_event, id: string) => manager.enableMultiWindow(id));
  ipcMain.handle("dualview:send-files", async (_event, id: string) => {
    const picked = await dialog.showOpenDialog({ title: "Choose files to transfer to Android", properties: ["openFile", "multiSelections"] });
    if (picked.canceled || !picked.filePaths.length) return { ok: false, message: "File transfer cancelled." };
    return manager.sendFiles(id, picked.filePaths);
  });
  ipcMain.handle("dualview:stop-secondary", () => manager.stopSecondaryDisplay());
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("before-quit", () => { void manager.stopAll(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
