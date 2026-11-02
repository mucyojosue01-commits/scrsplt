import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { DeviceManager } from "./device-manager";

const manager = new DeviceManager();
const isDev = !app.isPackaged;

function createWindow() {
  const window = new BrowserWindow({
    width: 1180, height: 780, minWidth: 900, minHeight: 620,
    backgroundColor: "#101713",
    title: "DualView",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  if (isDev) void window.loadURL("http://localhost:5173");
  else void window.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("dualview:status", () => manager.getStatus());
  ipcMain.handle("dualview:refresh", () => manager.getStatus());
  ipcMain.handle("dualview:start-mirror", (_event, deviceId: string) => manager.startMirror(deviceId));
  ipcMain.handle("dualview:stop-mirror", () => manager.stopMirror());
  ipcMain.handle("dualview:open-external", async (_event, url: string) => {
    if (url === "https://developer.android.com/tools/adb" || url === "https://github.com/Genymobile/scrcpy") await shell.openExternal(url);
  });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => { void manager.stopMirror(); });
