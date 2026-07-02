import type { ScopedPortalRole } from "@/hooks/auth/useAdminAuth";

/** Visibility rules a nav item (or route) can declare. */
export interface NavVisibilityRules {
  /** Never shown unless the session is a system admin. */
  systemAdminOnly?: boolean;
  /**
   * Scoped portal roles that can also use this page. Omit to make the page
   * system-admin-only for scoped sessions — the backing admin APIs are
   * `@Roles('SUPER_ADMIN','SYSTEM_ADMIN')` and only error for scoped roles.
   */
  scopedRoles?: readonly ScopedPortalRole[];
}

export interface NavViewer {
  isSystemAdmin: boolean;
  scopedRole: ScopedPortalRole | null;
}

/** Whether the current admin should see a nav item / reach its route. */
export function isNavItemVisible(item: NavVisibilityRules, viewer: NavViewer): boolean {
  if (viewer.isSystemAdmin) return true;
  if (viewer.scopedRole) return item.scopedRoles?.includes(viewer.scopedRole) ?? false;
  // Unrecognized role (e.g. session predates profile storage): keep the
  // legacy behavior — everything except explicitly system-admin-only items.
  return !item.systemAdminOnly;
}
