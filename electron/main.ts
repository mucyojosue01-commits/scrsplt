import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { DeviceManager } from "./device-manager";
import { AndroidEmulatorManager } from "./android-emulator";

const manager = new DeviceManager();
const emulator = new AndroidEmulatorManager();
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
  ipcMain.handle("dualview:emulator-status", () => emulator.getStatus());
  ipcMain.handle("dualview:emulator-start", (_event, avdName: string) => emulator.start(avdName));
  ipcMain.handle("dualview:emulator-stop", () => emulator.stop());
  ipcMain.handle("dualview:open-external", async (_event, url: string) => {
    const allowed = [
      "https://developer.android.com/tools/adb",
      "https://github.com/Genymobile/scrcpy",
      "https://developer.android.com/studio",
      "https://developer.android.com/studio/run/managing-avds",
    ];
    if (allowed.includes(url)) await shell.openExternal(url);
  });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => { void manager.stopMirror(); });
