import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessionStore } from "@/stores/sessionStore";
import { logRouteAccessDenied } from "@/services/core/audit";

/**
 * Protects routes that require an authenticated admin session (Zustand store).
 * If not authenticated, audits the attempt and redirects to /login.
 */
export function ProtectedRoute() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const location = useLocation();
  const path = location.pathname + location.search;

  if (!sessionId) {
    logRouteAccessDenied({ path });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
