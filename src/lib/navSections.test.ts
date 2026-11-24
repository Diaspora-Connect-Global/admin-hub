import { describe, it, expect } from "vitest";
import { SECTION_TABS, activeTabPath, pathMatches, sectionPaths, visibleSectionTabs } from "./navSections";
import type { NavViewer } from "./navVisibility";

const SYSTEM: NavViewer = { isSystemAdmin: true, scopedRole: null };
const LEGACY: NavViewer = { isSystemAdmin: false, scopedRole: null };
const COMMUNITY: NavViewer = { isSystemAdmin: false, scopedRole: "COMMUNITY_ADMIN" };

describe("pathMatches / activeTabPath", () => {
  it("matches a route and the pages below it, not a look-alike", () => {
    expect(pathMatches("/users/u-1", "/users")).toBe(true);
    expect(pathMatches("/usersx", "/users")).toBe(false);
    expect(pathMatches("/reports", "/")).toBe(false);
  });

  it("keeps circle detail pages on Circles and the plans page on Plans", () => {
    expect(activeTabPath(SECTION_TABS.circles, "/circles/abc")).toBe("/circles");
    expect(activeTabPath(SECTION_TABS.circles, "/circles/plans")).toBe("/circles/plans");
  });

  it("selects Posts & comments on /moderation/posts, not Reported content", () => {
    expect(activeTabPath(SECTION_TABS.moderation, "/moderation/posts")).toBe("/moderation/posts");
  });
});

describe("visibleSectionTabs keeps each page's old visibility rule", () => {
  it("shows a system admin every tab", () => {
    expect(visibleSectionTabs("payments", SYSTEM).map((t) => t.path)).toEqual(["/escrow", "/disputes", "/payouts", "/wallet"]);
  });

  it("hides system-admin-only tabs from a session without a known role", () => {
    expect(visibleSectionTabs("payments", LEGACY).map((t) => t.path)).toEqual(["/escrow", "/disputes"]);
    expect(visibleSectionTabs("users", LEGACY).map((t) => t.path)).toEqual(["/users"]);
    expect(visibleSectionTabs("circles", LEGACY)).toEqual([]);
  });

  it("shows a community admin none of the platform sections", () => {
    for (const section of Object.keys(SECTION_TABS) as (keyof typeof SECTION_TABS)[]) {
      expect(visibleSectionTabs(section, COMMUNITY)).toEqual([]);
    }
  });
});

describe("sections", () => {
  it("cover every page that used to have its own menu entry, once", () => {
    const all = Object.values(SECTION_TABS).flatMap((tabs) => tabs.map((t) => t.path));
    for (const path of ["/deletion-requests", "/kyc", "/wallet", "/payouts", "/disputes", "/moderation/posts", "/support/case-types", "/circles/plans", "/reports"]) {
      expect(all).toContain(path);
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it("list a section's routes", () => {
    expect(sectionPaths("support")).toEqual(["/support", "/support/case-types"]);
  });
});
