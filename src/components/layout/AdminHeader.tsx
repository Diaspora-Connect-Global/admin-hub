import { Search, ChevronDown, LogOut, User, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import { AdminNotificationBell } from "./AdminNotificationBell";

interface AdminHeaderProps {
  onOpenMobileNav?: () => void;
}

export function AdminHeader({ onOpenMobileNav }: AdminHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userEmail, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Mobile nav trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0"
          onClick={onOpenMobileNav}
          aria-label={t("nav.openMenu")}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Global Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search') + "..."}
            className="pl-10 bg-secondary border-border focus:border-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <AdminNotificationBell />

          {/* User menu with logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[140px] truncate">
                  {userEmail ?? "Admin"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem disabled className="font-normal">
                {userEmail ?? "Admin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
