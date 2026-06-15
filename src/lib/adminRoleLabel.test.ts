import { describe, it, expect } from "vitest";
import { formatRoleType, formatAdminRole } from "./adminRoleLabel";

describe("formatRoleType", () => {
  it("converts role enums into friendly labels", () => {
    expect(formatRoleType("COMMUNITY_ADMIN")).toBe("Community admin");
    expect(formatRoleType("ASSOCIATION_ADMIN")).toBe("Association admin");
    expect(formatRoleType("SYSTEM_ADMIN")).toBe("System admin");
  });

  it("falls back to 'Admin' for nullish or empty input", () => {
    expect(formatRoleType(undefined)).toBe("Admin");
    expect(formatRoleType(null)).toBe("Admin");
    expect(formatRoleType("")).toBe("Admin");
    expect(formatRoleType("   ")).toBe("Admin");
  });
});

describe("formatAdminRole", () => {
  const scopeNames = new Map<string, string>([
    ["6ba028da", "Tigray Community"],
    ["a2753664", "Mekelle Association"],
  ]);

  it("appends the resolved scope name when known", () => {
    expect(
      formatAdminRole(
        { roleType: "COMMUNITY_ADMIN", scopeType: "COMMUNITY", scopeId: "6ba028da" },
        scopeNames,
      ),
    ).toBe("Community admin — Tigray Community");
  });

  it("returns the role label alone (no scopeType/UUID) when scopeId is unresolved", () => {
    const result = formatAdminRole(
      { roleType: "ASSOCIATION_ADMIN", scopeType: "ASSOCIATION", scopeId: "unknown-uuid" },
      scopeNames,
    );
    expect(result).toBe("Association admin");
    expect(result).not.toContain("unknown-uuid");
    expect(result).not.toContain("ASSOCIATION");
  });

  it("returns the role label alone when there is no scopeId", () => {
    expect(formatAdminRole({ roleType: "COMMUNITY_ADMIN" }, scopeNames)).toBe(
      "Community admin",
    );
  });
});
