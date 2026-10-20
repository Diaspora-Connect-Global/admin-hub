import { describe, expect, it } from "vitest";
import { MAX_MINOR_UNITS, isValidMajorText, majorTextToMinor, minorToMajorText } from "./minorUnits";

describe("minorUnits", () => {
  it("multiplies by 100 once on input", () => {
    expect(majorTextToMinor("50000")).toBe(5000000);
    expect(majorTextToMinor("19.99")).toBe(1999);
    expect(majorTextToMinor("19.9")).toBe(1990);
    expect(majorTextToMinor(".5")).toBe(50);
    expect(majorTextToMinor("5.")).toBe(500);
  });

  it("handles amounts past int32 exactly (64-bit backend, GraphQL Float)", () => {
    // GHS 500,000,000 (an investment) -> 5e10 minor units, beyond the old 32-bit Int.
    expect(majorTextToMinor("500000000")).toBe(50_000_000_000);
    expect(majorTextToMinor("90071992547409.91")).toBe(MAX_MINOR_UNITS);
    // Number("90071992547409.91") * 100 would not be exact; text parsing is.
    expect(majorTextToMinor("12345678901234.57")).toBe(1234567890123457);
  });

  it("blank / invalid / negative / too-large / >2 decimals input is undefined", () => {
    expect(majorTextToMinor("")).toBeUndefined();
    expect(majorTextToMinor("  ")).toBeUndefined();
    expect(majorTextToMinor("abc")).toBeUndefined();
    expect(majorTextToMinor("-5")).toBeUndefined();
    expect(majorTextToMinor("1e5")).toBeUndefined();
    expect(majorTextToMinor("19.999")).toBeUndefined();
    expect(majorTextToMinor(".")).toBeUndefined();
    expect(majorTextToMinor("90071992547409.92")).toBeUndefined(); // 2^53 minor units
    expect(majorTextToMinor("100000000000000")).toBeUndefined();
  });

  it("isValidMajorText: blank is fine (no amount), garbage is not", () => {
    expect(isValidMajorText("")).toBe(true);
    expect(isValidMajorText("1500.50")).toBe(true);
    expect(isValidMajorText("1500.505")).toBe(false);
    expect(isValidMajorText("100000000000000")).toBe(false);
  });

  it("divides by 100 once for display / edit prefill", () => {
    expect(minorToMajorText(5000000)).toBe("50000");
    expect(minorToMajorText(1999)).toBe("19.99");
    expect(minorToMajorText(5)).toBe("0.05");
    expect(minorToMajorText(50_000_000_000)).toBe("500000000");
    expect(minorToMajorText(null)).toBe("");
    expect(minorToMajorText(0)).toBe("0");
    expect(minorToMajorText(12.5)).toBe(""); // never a non-integer on the wire
  });

  it("round-trips", () => {
    for (const v of [123456, 1, 99, 50_000_000_000, MAX_MINOR_UNITS]) {
      expect(majorTextToMinor(minorToMajorText(v))).toBe(v);
    }
  });
});
