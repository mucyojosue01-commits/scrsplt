import { describe, expect, it } from "vitest";
import { buildScrcpyArgs, parseAdbDevices } from "../shared/adb";

describe("parseAdbDevices", () => {
  it("parses connected Android devices and their model names", () => {
    expect(parseAdbDevices("List of devices attached\nR58M123456A device product:a06 model:SM_A065F device: a06\n"))
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
  it("targets the selected device and gives the window a DualView title", () => {
    expect(buildScrcpyArgs("device-123")).toEqual(["-s", "device-123", "--window-title", "DualView • Android", "--stay-awake"]);
  });
});
