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

  const logout = () => {
    const email = useSessionStore.getState().userEmail ?? "unknown";
    logLogout({ actorId: email, actorLabel: email });
    clearSession();
  };

  return {
    sessionId,
    userEmail,
    isAuthenticated: !!sessionId,
    logout,
  };
}
