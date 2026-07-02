import { describe, expect, it } from "vitest";
import { isNavItemVisible, type NavVisibilityRules } from "./navVisibility";

const systemOnly: NavVisibilityRules = {};
const systemAdminOnly: NavVisibilityRules = { systemAdminOnly: true };
const communityPage: NavVisibilityRules = { scopedRoles: ["COMMUNITY_ADMIN", "MODERATOR"] };
const associationPage: NavVisibilityRules = { scopedRoles: ["ASSOCIATION_ADMIN"] };

describe("isNavItemVisible", () => {
  it("shows everything to system admins", () => {
    const viewer = { isSystemAdmin: true, scopedRole: null };
    expect(isNavItemVisible(systemOnly, viewer)).toBe(true);
    expect(isNavItemVisible(systemAdminOnly, viewer)).toBe(true);
    expect(isNavItemVisible(communityPage, viewer)).toBe(true);
  });

  it("shows everything to a scoped-named role with system-level access (e.g. wildcard permission)", () => {
    const viewer = { isSystemAdmin: true, scopedRole: "COMMUNITY_ADMIN" as const };
    expect(isNavItemVisible(systemAdminOnly, viewer)).toBe(true);
    expect(isNavItemVisible(associationPage, viewer)).toBe(true);
  });

  it("limits scoped portal admins to their allowlisted pages", () => {
    const community = { isSystemAdmin: false, scopedRole: "COMMUNITY_ADMIN" as const };
    expect(isNavItemVisible(communityPage, community)).toBe(true);
    expect(isNavItemVisible(associationPage, community)).toBe(false);
    expect(isNavItemVisible(systemOnly, community)).toBe(false);
    expect(isNavItemVisible(systemAdminOnly, community)).toBe(false);

    const moderator = { isSystemAdmin: false, scopedRole: "MODERATOR" as const };
    expect(isNavItemVisible(communityPage, moderator)).toBe(true);
    expect(isNavItemVisible(systemOnly, moderator)).toBe(false);
  });

  it("keeps legacy behavior for sessions without a recognizable role", () => {
    const viewer = { isSystemAdmin: false, scopedRole: null };
    expect(isNavItemVisible(systemOnly, viewer)).toBe(true);
    expect(isNavItemVisible(communityPage, viewer)).toBe(true);
    expect(isNavItemVisible(systemAdminOnly, viewer)).toBe(false);
  });
});
