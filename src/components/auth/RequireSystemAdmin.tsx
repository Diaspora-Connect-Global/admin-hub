import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";

/**
 * Blocks system-admin-only pages for scoped portal admins (community /
 * association admins, moderators). Their backing APIs are
 * `@Roles('SUPER_ADMIN','SYSTEM_ADMIN')` on the gateway, so the pages can
 * only error for scoped roles — mirror that here instead of rendering them.
 * Sessions without a recognizable role fall through (backend still enforces).
 */
export function RequireSystemAdmin() {
  const { isSystemAdmin, isScopedPortalAdmin } = useAdminAuth();

  if (!isSystemAdmin && isScopedPortalAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
