import { describe, expect, it } from "vitest";
import { majorTextToMinor, minorToMajorText } from "./minorUnits";

describe("minorUnits", () => {
  it("multiplies by 100 once on input", () => {
    expect(majorTextToMinor("50000")).toBe(5000000);
    expect(majorTextToMinor("19.99")).toBe(1999);
  });
  it("blank / invalid / negative input is undefined", () => {
    expect(majorTextToMinor("")).toBeUndefined();
    expect(majorTextToMinor("  ")).toBeUndefined();
    expect(majorTextToMinor("abc")).toBeUndefined();
    expect(majorTextToMinor("-5")).toBeUndefined();
  });
  it("divides by 100 once for display / edit prefill", () => {
    expect(minorToMajorText(5000000)).toBe("50000");
    expect(minorToMajorText(1999)).toBe("19.99");
    expect(minorToMajorText(null)).toBe("");
    expect(minorToMajorText(0)).toBe("0");
  });
  it("round-trips", () => {
    expect(majorTextToMinor(minorToMajorText(123456))).toBe(123456);
  });
});
