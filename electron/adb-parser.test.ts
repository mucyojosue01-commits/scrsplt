import { describe, expect, it } from "vitest";
import { buildScrcpyArgs, parseAdbDevices } from "./adb-parser";
import { parseThermalStatus } from "./adb-parser";

describe("parseAdbDevices", () => {
  it("parses connected Android devices and their model names", () => {
    expect(parseAdbDevices("List of devices attached\nR58M123456A device product:a06 model:SM_A065F device:a06\n"))
      .toEqual([{ id: "R58M123456A", state: "device", model: "SM A065F" }]);
  });
  it("preserves unauthorized and offline states", () => {
    expect(parseAdbDevices("List of devices attached\nabc unauthorized\ndef offline\n"))
      .toEqual([{ id: "abc", state: "unauthorized" }, { id: "def", state: "offline" }]);
  });
  it("ignores daemon messages and empty rows", () => {
    expect(parseAdbDevices("* daemon started successfully *\nList of devices attached\n\n")).toEqual([]);
  });
});

describe("buildScrcpyArgs", () => {
  it("targets the selected phone and opens its video window on the left", () => {
    expect(buildScrcpyArgs("device-123")).toEqual([
      "-s", "device-123",
      "--window-title", "DualView • Phone Video",
      "--window-x", "0", "--window-y", "0",
      "--stay-awake", "--max-size", "1920", "--video-bit-rate", "8M"
    ]);
  });
});


describe("parseThermalStatus", () => {
  it("maps Android thermal service status levels", () => {
    expect(parseThermalStatus("mThermalStatus: 0")).toBe("none");
    expect(parseThermalStatus("mThermalStatus: 2")).toBe("moderate");
    expect(parseThermalStatus("mThermalStatus: 6")).toBe("shutdown");
  });
  it("does not invent a thermal status when Android omits it", () => {
    expect(parseThermalStatus("No thermal status available")).toBe("unknown");
  });
});
