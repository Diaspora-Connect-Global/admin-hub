import { describe, it, expect } from "vitest";
import { majorToMinor, minorToMajorInput, formatMinorUnits } from "./money";

describe("majorToMinor", () => {
  it("converts major units to integer minor units", () => {
    expect(majorToMinor("50")).toBe(5000);
    expect(majorToMinor("50.00")).toBe(5000);
    expect(majorToMinor(0)).toBe(0);
  });

  it("rounds away float drift rather than emitting a fraction", () => {
    // 19.99 * 100 is 1998.9999999999998 in IEEE-754 — a truncating conversion
    // would silently undercharge by a cent.
    expect(majorToMinor("19.99")).toBe(1999);
    expect(Number.isInteger(majorToMinor("19.99") as number)).toBe(true);
  });

  it("refuses unusable input instead of producing NaN", () => {
    expect(majorToMinor("")).toBeNull();
    expect(majorToMinor("abc")).toBeNull();
    expect(majorToMinor("-5")).toBeNull();
  });
});

describe("minorToMajorInput", () => {
  it("divides by 100 exactly once, for a form field", () => {
    expect(minorToMajorInput(5000)).toBe("50.00");
    expect(minorToMajorInput(1999)).toBe("19.99");
    expect(minorToMajorInput(0)).toBe("0.00");
  });
});

describe("formatMinorUnits", () => {
  it("renders minor units as a major-unit currency string", () => {
    expect(formatMinorUnits(5000, "USD")).toContain("50.00");
    expect(formatMinorUnits(1999, "USD")).toContain("19.99");
  });

  it("falls back to a plain number for an unknown ISO code", () => {
    // A currency added backend-side before this client knows about it must not
    // throw inside a table cell.
    expect(formatMinorUnits(5000, "ZZZ")).toContain("50.00");
  });
});
