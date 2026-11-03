export type ScreenOrientation = "auto" | "portrait" | "landscape";
export interface ScrcpySettings {
  audio: boolean;
  stayAwake: boolean;
  orientation: ScreenOrientation;
  maxSize: number;
  maxFps: number;
  videoBitRate: string;
  fullscreen: boolean;
  turnScreenOff: boolean;
  showTouches: boolean;
  alwaysOnTop: boolean;
  windowBorderless: boolean;
}
export const DEFAULT_SCRCPY_SETTINGS: ScrcpySettings = {
  audio: false, stayAwake: true, orientation: "auto", maxSize: 1920,
  maxFps: 30, videoBitRate: "4M", fullscreen: false, turnScreenOff: false,
  showTouches: false, alwaysOnTop: false, windowBorderless: false
};
const supportedBitRates = new Set(["2M", "4M", "6M", "8M", "12M", "16M"]);
export function validateScrcpySettings(input: ScrcpySettings): string | null {
  if (![1024, 1280, 1600, 1920, 2560].includes(input.maxSize)) return "Choose a supported maximum video size.";
  if (![15, 24, 30, 45, 60].includes(input.maxFps)) return "Choose a supported frame rate.";
  if (!supportedBitRates.has(input.videoBitRate)) return "Choose a supported video bitrate.";
  return null;
}
export function buildScrcpySessionArgs(
  deviceId: string,
  mode: "mirror" | "desktop",
  settings: ScrcpySettings,
  supportedFlags?: ReadonlySet<string>
): string[] {
  const invalid = validateScrcpySettings(settings);
  if (invalid) throw new Error(invalid);
  const args = ["--serial", deviceId, `--max-size=${settings.maxSize}`, `--max-fps=${settings.maxFps}`, `--video-bit-rate=${settings.videoBitRate}`];
  const add = (flag: string, enabled: boolean) => {
    if (enabled && (!supportedFlags || supportedFlags.has(flag))) args.push(flag);
  };
  add("--stay-awake", settings.stayAwake);
  add("--fullscreen", settings.fullscreen || mode === "desktop");
  add("--turn-screen-off", settings.turnScreenOff);
  add("--show-touches", settings.showTouches);
  add("--always-on-top", settings.alwaysOnTop);
  add("--window-borderless", settings.windowBorderless);
  add("--no-audio", !settings.audio);
  if (settings.orientation === "landscape") args.push("--orientation=90");
  if (settings.orientation === "portrait") args.push("--orientation=0");
  if (mode === "desktop") args.push("--new-display=1280x720/160", "--window-title=DualView Android Desktop");
  return args;
}
export function parseScrcpyHelpFlags(helpText: string): Set<string> {
  return new Set([...helpText.matchAll(/(?:^|\s)(--[a-z][a-z0-9-]*)/g)].map(match => match[1]));
}
