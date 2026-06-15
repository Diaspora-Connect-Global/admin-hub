import { ReactNode, useState } from "react";
import { AdminSidebar, AdminSidebarMobile } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar — collapse state is owned here so the main margin stays in sync */}
      <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((v) => !v)} />

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-sidebar-border md:hidden">
          <AdminSidebarMobile onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("transition-all duration-300 ml-0", sidebarCollapsed ? "md:ml-16" : "md:ml-64")}>
        <AdminHeader onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
