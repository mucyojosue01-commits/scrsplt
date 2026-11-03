export type DeviceState="device"|"unauthorized"|"offline"|"unknown";
export interface AndroidDevice{id:string;state:DeviceState;model?:string}
export interface PcResources{totalRamBytes:number;freeRamBytes:number;usedRamBytes:number;cpuCores:number;platform:string}
export interface DualViewStatus{adbAvailable:boolean;scrcpyAvailable:boolean;devices:AndroidDevice[];mirrorRunning:boolean;secondaryRunning:boolean;pcResources:PcResources}
export interface DesktopBridge{getStatus:()=>Promise<DualViewStatus>;refreshDevices:()=>Promise<DualViewStatus>;getPcResources:()=>Promise<PcResources>;startMirror:(id:string,orientation:"auto"|"portrait"|"landscape")=>Promise<{ok:boolean;message:string}>;stopMirror:()=>Promise<{ok:boolean;message:string}>;startSecondaryDisplay:(id:string)=>Promise<{ok:boolean;message:string}>;stopSecondaryDisplay:()=>Promise<{ok:boolean;message:string}>}
declare global{interface Window{dualview?:DesktopBridge}}
