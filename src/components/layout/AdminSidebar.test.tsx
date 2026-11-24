import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@/i18n";

const viewer = vi.hoisted(() => ({ isSystemAdmin: true, scopedRole: null as null | "COMMUNITY_ADMIN" }));
vi.mock("@/hooks/auth/useAdminAuth", () => ({
  useAdminAuth: () => ({ ...viewer, userEmail: "admin@example.test", adminProfile: null, logout: vi.fn() }),
  getPortalRoleTranslationKey: () => "roles.admin",
}));
vi.mock("@/components/tasks/TasksNavBadge", () => ({ TasksNavBadge: () => null }));

import { AdminSidebarMobile } from "./AdminSidebar";
import { activeNavItemId, resolveNavGroups } from "./navGroups";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AdminSidebarMobile />
    </MemoryRouter>,
  );

const menu = () => screen.getByRole("navigation", { name: "Main menu" });
const hrefs = () => within(menu()).getAllByRole("link").map((l) => l.getAttribute("href"));

describe("AdminSidebar", () => {
  it("groups a system admin's menu into 18 entries under headings", () => {
    viewer.isSystemAdmin = true;
    viewer.scopedRole = null;
    renderAt("/");
    // Headings are the <p> elements; "Communities" is both a heading and an entry.
    expect(Array.from(menu().querySelectorAll("p")).map((p) => p.textContent)).toEqual([
      "People",
      "Communities",
      "Content & safety",
      "Commerce",
      "Support & messaging",
      "Platform",
    ]);
    expect(hrefs()).toEqual([
      "/", "/tasks",
      "/users",
      "/communities", "/associations", "/circles",
      "/moderation", "/events", "/opportunities",
      "/vendors", "/escrow",
      "/support", "/chats", "/notifications",
      "/settings", "/roles", "/audit", "/health",
    ]);
  });

  it.each([
    ["/reports", "/"],
    ["/deletion-requests", "/users"],
    ["/kyc", "/users"],
    ["/users/u-1", "/users"],
    ["/wallet", "/escrow"],
    ["/disputes", "/escrow"],
    ["/moderation/posts", "/moderation"],
    ["/support/case-types", "/support"],
    ["/circles/plans", "/circles"],
    ["/settings/ai", "/settings"],
  ])("on %s it highlights only the %s entry", (path, entry) => {
    viewer.isSystemAdmin = true;
    viewer.scopedRole = null;
    renderAt(path);
    const active = within(menu())
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(active.map((l) => l.getAttribute("href"))).toEqual([entry]);
  });

  it("shows a community admin only the pages its role can use, as before", () => {
    viewer.isSystemAdmin = false;
    viewer.scopedRole = "COMMUNITY_ADMIN";
    renderAt("/communities");
    expect(hrefs()).toEqual(["/communities", "/events", "/opportunities"]);
  });

  it("styles the active entry without a coloured left border", () => {
    const css = readFileSync(resolve(__dirname, "../../index.css"), "utf8");
    const rule = css.slice(css.indexOf(".sidebar-item-active {"), css.indexOf("}", css.indexOf(".sidebar-item-active {")));
    expect(rule).not.toMatch(/border-left/);
  });
});

describe("resolveNavGroups", () => {
  it("opens a merged section on the first tab the admin may see", () => {
    const groups = resolveNavGroups({ isSystemAdmin: false, scopedRole: null });
    const items = groups.flatMap((g) => g.items);
    expect(items.find((i) => i.id === "payments")?.matchPaths).toEqual(["/escrow", "/disputes"]);
    expect(items.find((i) => i.id === "circles")).toBeUndefined();
    expect(activeNavItemId(groups, "/wallet")).toBeNull();
  });
});
