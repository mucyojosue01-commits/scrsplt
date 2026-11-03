import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { DeviceManager } from "./device-manager";
const manager=new DeviceManager();const isDev=!app.isPackaged;
function createWindow(){const w=new BrowserWindow({width:1180,height:780,minWidth:900,minHeight:620,backgroundColor:"#101713",title:"DualView",autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false,sandbox:true}});if(isDev)void w.loadURL("http://localhost:5173");else void w.loadFile(path.join(__dirname,"../dist/index.html"));}
app.whenReady().then(()=>{ipcMain.handle("dualview:status",()=>manager.getStatus());ipcMain.handle("dualview:refresh",()=>manager.getStatus());ipcMain.handle("dualview:resources",()=>manager.getPcResources());ipcMain.handle("dualview:start-mirror",(_e,id:string,o:"auto"|"portrait"|"landscape")=>manager.startMirror(id,o));ipcMain.handle("dualview:stop-mirror",()=>manager.stopMirror());ipcMain.handle("dualview:start-secondary",(_e,id:string)=>manager.startSecondaryDisplay(id));ipcMain.handle("dualview:stop-secondary",()=>manager.stopSecondaryDisplay());createWindow();app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on("before-quit",()=>{void manager.stopAll();});app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit();});
