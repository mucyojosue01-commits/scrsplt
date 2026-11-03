import { describe, expect, it } from "vitest";
import { buildScrcpySessionArgs, DEFAULT_SCRCPY_SETTINGS, parseScrcpyHelpFlags, validateScrcpySettings } from "./scrcpy-options";
describe("scrcpy session settings", () => {
  it("keeps phone audio local by default", () => {
    const args = buildScrcpySessionArgs("device-1", "mirror", DEFAULT_SCRCPY_SETTINGS);
    expect(args).toContain("--no-audio");
    expect(args).not.toContain("--audio");
  });
  it("forwards audio when explicitly enabled", () => {
    const args = buildScrcpySessionArgs("device-1", "mirror", { ...DEFAULT_SCRCPY_SETTINGS, audio: true });
    expect(args).not.toContain("--no-audio");
  });
  it("adds desktop display and fullscreen flags", () => {
    const args = buildScrcpySessionArgs("device-1", "desktop", DEFAULT_SCRCPY_SETTINGS);
    expect(args).toContain("--fullscreen");
    expect(args).toContain("--new-display=1280x720/160");
  });
  it("omits optional flags unsupported by the bundled CLI", () => {
    const args = buildScrcpySessionArgs("device-1", "mirror", { ...DEFAULT_SCRCPY_SETTINGS, stayAwake: true }, new Set(["--max-size", "--max-fps"]));
    expect(args).not.toContain("--stay-awake");
    expect(args).toContain("--max-fps=30");
  });
  it("uses the selected virtual display dimensions", () => {
    const args = buildScrcpySessionArgs("device-1", "desktop", { ...DEFAULT_SCRCPY_SETTINGS, displayResolution: "1600x900" });
    expect(args).toContain("--new-display=1600x900/160");
  });
  it("rejects invalid values rather than passing arbitrary CLI input", () => {
    expect(validateScrcpySettings({ ...DEFAULT_SCRCPY_SETTINGS, maxFps: 999 })).toMatch(/frame rate/);
    expect(() => buildScrcpySessionArgs("device-1", "mirror", { ...DEFAULT_SCRCPY_SETTINGS, videoBitRate: "1M; del *" })).toThrow();
  });
  it("discovers supported flags from scrcpy help output", () => {
    expect(parseScrcpyHelpFlags(" --stay-awake  --no-audio --max-fps=value ")).toEqual(new Set(["--stay-awake", "--no-audio", "--max-fps"]));
  });
});
