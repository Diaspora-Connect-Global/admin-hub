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

  const logout = () => {
    const email = useSessionStore.getState().userEmail ?? "unknown";
    logLogout({ actorId: email, actorLabel: email });
    clearSession();
  };

  return {
    sessionId,
    userEmail,
    adminProfile,
    isSystemAdmin:
      adminProfile?.scopeType === "GLOBAL" &&
      (adminProfile.role?.permissions?.includes("*") ||
        adminProfile.role?.name === "SYSTEM_ADMIN" ||
        adminProfile.role?.name === "SUPER_ADMIN"),
    isAuthenticated: !!sessionId,
    logout,
  };
}
