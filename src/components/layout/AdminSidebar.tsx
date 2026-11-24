import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { TasksNavBadge } from "@/components/tasks/TasksNavBadge";
import { cn } from "@/lib/utils";
import { activeNavItemId, resolveNavGroups } from "./navGroups";
import logo from "@/assets/logo.svg";
import { useAdminAuth, getPortalRoleTranslationKey } from "@/hooks/auth/useAdminAuth";

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
  const { userEmail, adminProfile, isSystemAdmin, scopedRole, logout } = useAdminAuth();
  const roleTitleKey = getPortalRoleTranslationKey(adminProfile?.role?.name);

  const visibleNavGroups = resolveNavGroups({ isSystemAdmin, scopedRole });
  const activeId = activeNavItemId(visibleNavGroups, location.pathname);

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
      <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin" aria-label={t("navSection.menu")}>
        {visibleNavGroups.map((group, groupIndex) => (
          <div key={group.id} className={cn(groupIndex > 0 && "mt-4")}>
            {group.headingKey &&
              (collapsed ? (
                <div className="mx-3 mb-2 border-t border-sidebar-border" aria-hidden="true" />
              ) : (
                <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(group.headingKey)}
                </p>
              ))}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.id === activeId;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? t(item.titleKey) : undefined}
                      className={cn("sidebar-item", active ? "sidebar-item-active" : "sidebar-item-inactive", item.id === "tasks" && collapsed && "relative")}
                    >
                      <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                      {!collapsed && <span>{t(item.titleKey)}</span>}
                      {item.id === "tasks" && <TasksNavBadge collapsed={collapsed} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
