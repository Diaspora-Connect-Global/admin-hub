/**
 * Auth state and actions for the admin session (Zustand store).
 * Use for protected routes and header logout.
 */

import { useSessionStore } from "@/stores/sessionStore";
import { clearSession } from "@/stores/session";
import { logLogout } from "@/services/core/audit";

/** Roles that can use this admin portal (system-wide or scoped to a community / association). */
const SCOPED_PORTAL_ROLES = new Set(["COMMUNITY_ADMIN", "ASSOCIATION_ADMIN", "MODERATOR"]);

export function useAdminAuth() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const userEmail = useSessionStore((s) => s.userEmail);
  const adminProfile = useSessionStore((s) => s.adminProfile);
  const roleName = adminProfile?.role?.name?.toUpperCase();
  const hasWildcardPermission = adminProfile?.role?.permissions?.includes("*") ?? false;
  const hasSystemRole = roleName === "SYSTEM_ADMIN" || roleName === "SUPER_ADMIN";
  const hasGlobalScope = adminProfile?.scopeType === "GLOBAL" || adminProfile?.role?.scopeType === "GLOBAL";
  const isCommunityAdmin = roleName === "COMMUNITY_ADMIN";
  const isAssociationAdmin = roleName === "ASSOCIATION_ADMIN";
  const isModerator = roleName === "MODERATOR";
  const isScopedPortalAdmin = !!roleName && SCOPED_PORTAL_ROLES.has(roleName);

  const logout = () => {
    const email = useSessionStore.getState().userEmail ?? "unknown";
    logLogout({ actorId: email, actorLabel: email });
    clearSession();
  };

  return {
    sessionId,
    userEmail,
    adminProfile,
    isSystemAdmin: hasSystemRole || hasWildcardPermission || hasGlobalScope,
    /** Community, association, or moderator admin (non–system-wide). */
    isCommunityAdmin,
    isAssociationAdmin,
    isModerator,
    isScopedPortalAdmin,
    isAuthenticated: !!sessionId,
    logout,
  };
}

/** i18n key under `roles.*` for the current admin role label in the shell. */
export function getPortalRoleTranslationKey(
  roleName: string | undefined
): "roles.systemAdmin" | "roles.communityAdmin" | "roles.associationAdmin" | "roles.moderator" {
  const n = roleName?.toUpperCase() ?? "";
  if (n === "COMMUNITY_ADMIN") return "roles.communityAdmin";
  if (n === "ASSOCIATION_ADMIN") return "roles.associationAdmin";
  if (n === "MODERATOR") return "roles.moderator";
  return "roles.systemAdmin";
}
