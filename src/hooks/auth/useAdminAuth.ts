/**
 * Auth state and actions for the admin session (Zustand store).
 * Use for protected routes and header logout.
 */

import { useSessionStore } from "@/stores/sessionStore";
import { clearSession } from "@/stores/session";
import { logLogout } from "@/services/core/audit";

export function useAdminAuth() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const userEmail = useSessionStore((s) => s.userEmail);
  const adminProfile = useSessionStore((s) => s.adminProfile);
  const roleName = adminProfile?.role?.name?.toUpperCase();
  const hasWildcardPermission = adminProfile?.role?.permissions?.includes("*") ?? false;
  const hasSystemRole = roleName === "SYSTEM_ADMIN" || roleName === "SUPER_ADMIN";
  const hasGlobalScope = adminProfile?.scopeType === "GLOBAL" || adminProfile?.role?.scopeType === "GLOBAL";

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
    isAuthenticated: !!sessionId,
    logout,
  };
}
