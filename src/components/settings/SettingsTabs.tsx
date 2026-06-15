import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings, Brain, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";

/**
 * Shared sub-navigation for the Settings section. Rendered at the top of each
 * settings page (SystemSettings, AiConfiguration, PaymentProviderKeys,
 * KycProviderKeys) so the four routes read as one tabbed area. The provider-key
 * / AI tabs are system-admin only, mirroring the sidebar gating.
 */
const SETTINGS_TABS = [
  { titleKey: "nav.settings", icon: Settings, path: "/settings", exact: true },
  { titleKey: "nav.aiConfig", icon: Brain, path: "/settings/ai", systemAdminOnly: true },
  { titleKey: "nav.paymentKeys", icon: CreditCard, path: "/settings/payment-keys", systemAdminOnly: true },
  { titleKey: "nav.kycKeys", icon: ShieldCheck, path: "/settings/kyc-keys", systemAdminOnly: true },
];

export function SettingsTabs() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isSystemAdmin } = useAdminAuth();

  const tabs = SETTINGS_TABS.filter((tab) => !tab.systemAdminOnly || isSystemAdmin);

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="border-b border-border overflow-x-auto">
      <nav className="flex gap-1 -mb-px" aria-label="Settings sections">
        {tabs.map((tab) => {
          const active = isActive(tab.path, tab.exact);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
              aria-current={active ? "page" : undefined}
            >
              <tab.icon className="w-4 h-4" />
              {t(tab.titleKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
