import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import Dashboard from "./Dashboard";

/**
 * Landing page. The dashboard's stats/health/analytics APIs are
 * system-admin-only, so scoped portal admins are sent to their home page
 * (the entity they administer) instead of a dashboard full of errors.
 */
const Index = () => {
  const { isSystemAdmin, scopedRole } = useAdminAuth();

  if (!isSystemAdmin && scopedRole) {
    return <Navigate to={scopedRole === "ASSOCIATION_ADMIN" ? "/associations" : "/communities"} replace />;
  }

  return <Dashboard />;
};

export default Index;
