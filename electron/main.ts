import { app, BrowserWindow, dialog, ipcMain, screen } from "electron";
import path from "node:path";
import { DeviceManager } from "./device-manager";
const manager = new DeviceManager();
let videoBridgeWindow: BrowserWindow | null = null;
function openVideoBridge(rawUrl: string) {
  let target: URL;
  try { target = new URL(rawUrl.includes("://") ? rawUrl : `https://${rawUrl}`); } catch { return { ok: false, message: "Enter a valid video website address." }; }
  if (!["http:", "https:"].includes(target.protocol)) return { ok: false, message: "Only secure web video addresses are supported." };
  if (videoBridgeWindow && !videoBridgeWindow.isDestroyed()) { videoBridgeWindow.focus(); void videoBridgeWindow.loadURL(target.toString()); return { ok: true, message: "Video Bridge opened on the PC. Play the video in that window." }; }
  videoBridgeWindow = new BrowserWindow({ width: 1280, height: 800, minWidth: 800, minHeight: 500, title: "DualView Video Bridge · PC Audio", autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  videoBridgeWindow.on("closed", () => { videoBridgeWindow = null; });
  void videoBridgeWindow.loadURL(target.toString());
  return { ok: true, message: "Video Bridge opened on the PC. Play the video in that window." };
}
const isDev = !app.isPackaged;
function createWindow() {
  const window = new BrowserWindow({ width: 1180, height: 780, minWidth: 900, minHeight: 620, backgroundColor: "#101713", title: "DualView", autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  if (isDev) void window.loadURL("http://localhost:5173"); else void window.loadFile(path.join(__dirname, "../dist/index.html"));
}
app.whenReady().then(() => {
  ipcMain.handle("dualview:open-video-bridge", (_event, url: string) => openVideoBridge(url));
  ipcMain.handle("dualview:close-video-bridge", () => { if (videoBridgeWindow && !videoBridgeWindow.isDestroyed()) videoBridgeWindow.close(); videoBridgeWindow = null; return { ok: true, message: "Video Bridge closed." }; });
  ipcMain.handle("dualview:status", () => manager.getStatus());
  ipcMain.handle("dualview:refresh", () => manager.getStatus());
  ipcMain.handle("dualview:resources", (_event, id?: string) => manager.getResourceStats(id));
  ipcMain.handle("dualview:stop-background-app", (_event, id: string, packageName: string) => manager.stopBackgroundApp(id, packageName));
  ipcMain.handle("dualview:start-mirror", (_event, id: string, orientation: "auto" | "portrait" | "landscape") => manager.startMirror(id, orientation));
  ipcMain.handle("dualview:stop-mirror", () => manager.stopMirror());
  ipcMain.handle("dualview:start-secondary", (_event, id: string) => {
    const { width, height } = screen.getPrimaryDisplay().size;
    return manager.startSecondaryDisplay(id, width, height);
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
