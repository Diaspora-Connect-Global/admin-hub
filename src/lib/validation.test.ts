import { describe, it, expect } from "vitest";
import { z } from "zod";
import { isoAlpha2, httpUrl, jsonString, futureIso, validate } from "./validation";

describe("isoAlpha2", () => {
  it("accepts two uppercase letters", () => {
    expect(isoAlpha2.safeParse("GH").success).toBe(true);
    expect(isoAlpha2.safeParse("US").success).toBe(true);
  });

  it("rejects lowercase, wrong length, and non-letters", () => {
    expect(isoAlpha2.safeParse("gh").success).toBe(false);
    expect(isoAlpha2.safeParse("GHA").success).toBe(false);
    expect(isoAlpha2.safeParse("G1").success).toBe(false);
    expect(isoAlpha2.safeParse("").success).toBe(false);
  });
});

describe("httpUrl", () => {
  it("accepts http and https URLs", () => {
    expect(httpUrl.safeParse("https://example.com/callback").success).toBe(true);
    expect(httpUrl.safeParse("http://localhost:3000").success).toBe(true);
  });

  it("rejects non-URLs and non-http schemes", () => {
    expect(httpUrl.safeParse("not a url").success).toBe(false);
    expect(httpUrl.safeParse("ftp://example.com").success).toBe(false);
    expect(httpUrl.safeParse("").success).toBe(false);
  });
});

describe("jsonString", () => {
  it("accepts valid JSON", () => {
    expect(jsonString.safeParse('{"merchantId":"abc"}').success).toBe(true);
    expect(jsonString.safeParse("[]").success).toBe(true);
  });

  it("rejects malformed JSON", () => {
    expect(jsonString.safeParse("{not valid}").success).toBe(false);
    expect(jsonString.safeParse("{'single':'quotes'}").success).toBe(false);
  });
});

describe("futureIso", () => {
  it("accepts a future timestamp", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(futureIso.safeParse(future).success).toBe(true);
  });

  it("rejects past timestamps and invalid dates", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(futureIso.safeParse(past).success).toBe(false);
    expect(futureIso.safeParse("nonsense").success).toBe(false);
  });
});

describe("validate()", () => {
  const schema = z.object({
    name: z.string().min(1, "Name required"),
    age: z.number().min(18, "Must be 18+"),
  });

  it("returns null when valid", () => {
    expect(validate(schema, { name: "Ada", age: 30 })).toBeNull();
  });

  it("returns a flat field->message map on failure", () => {
    const errors = validate(schema, { name: "", age: 5 });
    expect(errors).toEqual({ name: "Name required", age: "Must be 18+" });
  });

  it("keeps only the first error per field", () => {
    const errors = validate(schema, { name: "", age: 1 });
    expect(Object.keys(errors ?? {})).toHaveLength(2);
  });
});
