import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Wallet, AlertTriangle, BarChart3, Settings, Bell, FileText, HeadphonesIcon, Shield, Store, Key, Activity, ChevronLeft, ChevronRight, LogOut, MessageSquare, Calendar, Briefcase, Landmark, Brain, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";
import { useAdminAuth, getPortalRoleTranslationKey } from "@/hooks/auth/useAdminAuth";

const navItems = [
  { id: "dashboard", titleKey: "nav.dashboard", icon: LayoutDashboard, path: "/" },
  { id: "user_management", titleKey: "nav.users", icon: Users, path: "/users" },
  { id: "chat_management", titleKey: "nav.chat", icon: MessageSquare, path: "/chats" },
  { id: "escrow_management", titleKey: "nav.escrow", icon: Wallet, path: "/escrow" },
  { id: "disputes", titleKey: "nav.disputes", icon: AlertTriangle, path: "/disputes" },
  { id: "communities", titleKey: "nav.communities", icon: Users, path: "/communities" },
  { id: "associations", titleKey: "nav.associations", icon: Landmark, path: "/associations" },
  { id: "events", titleKey: "nav.events", icon: Calendar, path: "/events" },
  { id: "opportunities", titleKey: "nav.opportunities", icon: Briefcase, path: "/opportunities" },
  { id: "reports_analytics", titleKey: "nav.reports", icon: BarChart3, path: "/reports" },
  { id: "system_settings", titleKey: "nav.settings", icon: Settings, path: "/settings" },
  { id: "ai_configuration", titleKey: "nav.aiConfig", icon: Brain, path: "/settings/ai", systemAdminOnly: true },
  { id: "payment_keys", titleKey: "nav.paymentKeys", icon: CreditCard, path: "/settings/payment-keys", systemAdminOnly: true },
  { id: "kyc_keys", titleKey: "nav.kycKeys", icon: ShieldCheck, path: "/settings/kyc-keys", systemAdminOnly: true },
  { id: "notifications", titleKey: "nav.notifications", icon: Bell, path: "/notifications" },
  { id: "audit_logs", titleKey: "nav.audit", icon: FileText, path: "/audit" },
  { id: "support_ticketing", titleKey: "nav.support", icon: HeadphonesIcon, path: "/support" },
  { id: "content_moderation", titleKey: "nav.content", icon: Shield, path: "/moderation" },
  { id: "vendor_management", titleKey: "nav.vendors", icon: Store, path: "/vendors" },
  { id: "roles_permissions", titleKey: "nav.roles", icon: Key, path: "/roles" },
  { id: "system_health", titleKey: "nav.systemHealth", icon: Activity, path: "/health" },
];

interface SidebarContentProps {
  /** When true, render the narrow icon-only rail (desktop only). */
  collapsed?: boolean;
  /** Toggle handler for the collapse button; omit to hide the button (mobile). */
  onToggleCollapse?: () => void;
  /** Called when a nav link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/**
 * The actual sidebar UI (logo, nav, user section). Shared between the fixed
 * desktop `<aside>` and the mobile `Sheet` drawer so the nav lives in one place.
 */
function SidebarContent({ collapsed = false, onToggleCollapse, onNavigate }: SidebarContentProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { userEmail, adminProfile, isSystemAdmin, logout } = useAdminAuth();
  const roleTitleKey = getPortalRoleTranslationKey(adminProfile?.role?.name);

  const visibleNavItems = navItems.filter((item) => !item.systemAdminOnly || isSystemAdmin);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    // Prefer the most specific match — e.g. /settings/ai should only highlight
    // the AI Configuration item, not the parent /settings item.
    const candidates = visibleNavItems
      .map((it) => it.path)
      .filter((p) => p !== "/" && location.pathname.startsWith(p))
      .sort((a, b) => b.length - a.length);
    return candidates[0] === path;
  };

  return (
    <div className="h-full bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img alt="S Admin" className="w-10 h-10" src="/lovable-uploads/fba46bab-a266-43e0-b596-b69b740daf43.svg" />
            <span className="font-semibold text-foreground">S Admin</span>
          </div>
        )}
        {collapsed && <img src={logo} alt="S Admin" className="w-10 h-10 mx-auto" />}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={onNavigate}
                  className={cn("sidebar-item", active ? "sidebar-item-active" : "sidebar-item-inactive")}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                  {!collapsed && <span>{t(item.titleKey)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">SA</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{t(roleTitleKey)}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail ?? "Admin"}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              aria-label={t("common.logout")}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** Fixed sidebar for desktop (md and up). Hidden on mobile — see AdminLayout's Sheet. */
export function AdminSidebar({ collapsed, onToggleCollapse }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen border-r border-sidebar-border z-40 transition-all duration-300 hidden md:block",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
    </aside>
  );
}

/** Sidebar body for the mobile drawer (never collapsed; closes on navigate). */
export function AdminSidebarMobile({ onNavigate }: { onNavigate?: () => void }) {
  return <SidebarContent onNavigate={onNavigate} />;
}
