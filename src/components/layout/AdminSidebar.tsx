import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  AlertTriangle,
  CheckSquare,
  BarChart3,
  Settings,
  Bell,
  FileText,
  HeadphonesIcon,
  Shield,
  Store,
  Key,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

const navItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "user_management", title: "User Management", icon: Users, path: "/users" },
  { id: "escrow_management", title: "Escrow Management", icon: Wallet, path: "/escrow" },
  { id: "disputes", title: "Disputes", icon: AlertTriangle, path: "/disputes" },
  { id: "communities", title: "Communities", icon: Users, path: "/communities" },
  { id: "reports_analytics", title: "Reports & Analytics", icon: BarChart3, path: "/reports" },
  { id: "system_settings", title: "System Settings", icon: Settings, path: "/settings" },
  { id: "notifications", title: "Notifications", icon: Bell, path: "/notifications" },
  { id: "audit_logs", title: "Audit Logs", icon: FileText, path: "/audit" },
  { id: "support_ticketing", title: "Support", icon: HeadphonesIcon, path: "/support" },
  { id: "content_moderation", title: "Content Moderation", icon: Shield, path: "/moderation" },
  { id: "vendor_management", title: "Vendors", icon: Store, path: "/vendors" },
  { id: "roles_permissions", title: "Roles & Permissions", icon: Key, path: "/roles" },
  { id: "system_health", title: "System Health", icon: Activity, path: "/health" },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={logo} alt="Diaspo Plug" className="w-8 h-8" />
            <span className="font-semibold text-foreground">Diaspo Plug</span>
          </div>
        )}
        {collapsed && (
          <img src={logo} alt="Diaspo Plug" className="w-8 h-8 mx-auto" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={cn(
                    "sidebar-item",
                    active ? "sidebar-item-active" : "sidebar-item-inactive"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                  {!collapsed && <span>{item.title}</span>}
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
              <p className="text-sm font-medium text-foreground truncate">System Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@system.com</p>
            </div>
          )}
          {!collapsed && (
            <button className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
