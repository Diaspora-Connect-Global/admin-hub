import { describe, it, expect } from "vitest";
import { looksLikeId, resourceLabel, userLabel } from "./userLabel";

const FALLBACK = "Unknown user";
const UUID = "3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c";

describe("userLabel", () => {
  it("prefers the name, then email, then @username", () => {
    expect(userLabel({ name: "Ama Mensah", email: "ama@x.com", username: "ama" }, FALLBACK)).toBe("Ama Mensah");
    expect(userLabel({ email: "ama@x.com", username: "ama" }, FALLBACK)).toBe("ama@x.com");
    expect(userLabel({ username: "ama" }, FALLBACK)).toBe("@ama");
    expect(userLabel({ username: "@ama" }, FALLBACK)).toBe("@ama");
  });

  it("returns the fallback, never an id, when no human identity is known", () => {
    expect(userLabel({}, FALLBACK)).toBe(FALLBACK);
    expect(userLabel({ name: "  ", email: null }, FALLBACK)).toBe(FALLBACK);
  });

  it("skips a name that is really a user id or a fragment of one", () => {
    expect(userLabel({ name: UUID }, FALLBACK)).toBe(FALLBACK);
    expect(userLabel({ name: "3f2b8c1e…", email: "ama@x.com" }, FALLBACK)).toBe("ama@x.com");
    expect(userLabel({ name: "3f2b8c1e" }, FALLBACK)).toBe(FALLBACK);
  });
});

describe("looksLikeId", () => {
  it("flags UUIDs and hex fragments", () => {
    expect(looksLikeId(UUID)).toBe(true);
    expect(looksLikeId("3f2b8c1e-9a4d")).toBe(true);
    expect(looksLikeId("3f2b8c1e...")).toBe(true);
  });

  it("does not flag ordinary names", () => {
    expect(looksLikeId("Ama Mensah")).toBe(false);
    expect(looksLikeId("facade")).toBe(false);
    expect(looksLikeId("Kofi 2")).toBe(false);
  });
});

describe("resourceLabel", () => {
  it("never renders the id of a person-typed resource", () => {
    expect(resourceLabel({ resourceType: "USER", resourceId: UUID }, FALLBACK)).toBe(FALLBACK);
    expect(resourceLabel({ resourceType: "ADMIN_ACCOUNT", resourceId: UUID }, FALLBACK)).toBe(FALLBACK);
  });

  it("prefers a resolved label and shortens non-person record ids", () => {
    expect(resourceLabel({ resourceType: "USER", resourceLabel: "ama@x.com", resourceId: UUID }, FALLBACK)).toBe("ama@x.com");
    expect(resourceLabel({ resourceType: "ESCROW", resourceId: UUID }, FALLBACK)).toBe("3f2b8c1e…");
    expect(resourceLabel({ resourceType: "ESCROW" }, FALLBACK)).toBe("—");
  });
});
