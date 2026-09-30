import { Navigate } from "react-router-dom";
import { Send } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { OtpDeliverySettingsCard } from "@/components/settings/OtpDeliverySettingsCard";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";

/**
 * "OTP delivery" — per-country EMAIL/SMS policy for one-time verification
 * codes. System-admin only: the underlying GraphQL operations are server-gated
 * (`@Roles('SYSTEM_ADMIN','SUPER_ADMIN')`), and this route sits behind
 * RequireSystemAdmin in App.tsx. The extra client-side check below (mirroring
 * AiConfiguration) keeps a scoped portal admin whose role didn't match a known
 * scoped role from briefly seeing the page before a Forbidden error would land.
 */
export default function OtpDeliverySettings() {
  const { isSystemAdmin, isAuthenticated } = useAdminAuth();
  const shouldRedirect = isAuthenticated && !isSystemAdmin;

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Send className="w-6 h-6 text-primary" />
              OTP Delivery
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose which countries receive sign-in verification codes by email and which by
              SMS.
            </p>
          </div>
        </div>

        <SettingsTabs />

        <OtpDeliverySettingsCard />
      </div>
    </AdminLayout>
  );
}
