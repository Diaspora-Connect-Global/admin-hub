import { isNavItemVisible, type NavViewer, type NavVisibilityRules } from "@/lib/navVisibility";

/**
 * Merged sections of the console: one sidebar entry, several pages shown as
 * tabs. Each tab keeps its own route (old links and bookmarks still work) and
 * its own visibility rule, copied from the sidebar entry it replaced, so a
 * merge never shows a page to someone who could not open it before.
 *
 * Pure data + helpers (no React), so the sidebar and the tab bar read the
 * same definition and it can be unit-tested directly.
 */

export interface SectionTab extends NavVisibilityRules {
  /** Route the tab opens. */
  path: string;
  /** i18n key of the tab label. */
  titleKey: string;
}

export type SectionId = "dashboard" | "users" | "circles" | "moderation" | "payments" | "support";

export const SECTION_TABS: Record<SectionId, readonly SectionTab[]> = {
  // Dashboard stats/health/analytics APIs are system-admin-only (no scopedRoles).
  dashboard: [
    { path: "/", titleKey: "sectionTabs.dashboard.overview" },
    { path: "/reports", titleKey: "sectionTabs.dashboard.analytics" },
  ],
  users: [
    { path: "/users", titleKey: "sectionTabs.users.all" },
    { path: "/deletion-requests", titleKey: "sectionTabs.users.deletionRequests", systemAdminOnly: true },
    // KYC/KYB review queue — every kyc review op is @Roles('SUPER_ADMIN','SYSTEM_ADMIN').
    { path: "/kyc", titleKey: "sectionTabs.users.verifications", systemAdminOnly: true },
  ],
  // The whole CircleAdminService tier is @Roles('SUPER_ADMIN','SYSTEM_ADMIN').
  circles: [
    { path: "/circles", titleKey: "sectionTabs.circles.circles", systemAdminOnly: true },
    { path: "/circles/plans", titleKey: "sectionTabs.circles.plans", systemAdminOnly: true },
  ],
  moderation: [
    { path: "/moderation", titleKey: "sectionTabs.moderation.reported" },
    // `adminListPosts` returns posts at EVERY visibility — system admins only.
    { path: "/moderation/posts", titleKey: "sectionTabs.moderation.posts", systemAdminOnly: true },
  ],
  payments: [
    { path: "/escrow", titleKey: "sectionTabs.payments.escrows" },
    { path: "/disputes", titleKey: "sectionTabs.payments.disputes" },
    // Escrow Wallet / Ledger / Payout (escrow-service) — admin-only.
    { path: "/payouts", titleKey: "sectionTabs.payments.payouts", systemAdminOnly: true },
    { path: "/wallet", titleKey: "sectionTabs.payments.wallets", systemAdminOnly: true },
  ],
  support: [
    { path: "/support", titleKey: "sectionTabs.support.cases" },
    { path: "/support/case-types", titleKey: "sectionTabs.support.caseTypes" },
  ],
};

/** True when `pathname` is `path` itself or a page below it (`/` matches only itself). */
export function pathMatches(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * The tab that is active for `pathname`. The most specific match wins, so
 * `/circles/plans` selects "Plans" while `/circles/abc` stays on "Circles".
 */
export function activeTabPath(tabs: readonly SectionTab[], pathname: string): string | null {
  let best: string | null = null;
  for (const tab of tabs) {
    if (pathMatches(pathname, tab.path) && (!best || tab.path.length > best.length)) best = tab.path;
  }
  return best;
}

/** The tabs of `section` this admin may open. */
export function visibleSectionTabs(section: SectionId, viewer: NavViewer): SectionTab[] {
  return SECTION_TABS[section].filter((tab) => isNavItemVisible(tab, viewer));
}

/** Every route of a section (what its sidebar entry lights up on). */
export function sectionPaths(section: SectionId): string[] {
  return SECTION_TABS[section].map((tab) => tab.path);
}
