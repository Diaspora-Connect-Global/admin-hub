import { useNavigate } from "react-router-dom";
import { Users, Building2, Landmark, Wallet, Shield, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { label: "User Management", icon: Users, path: "/users" },
  { label: "Communities", icon: Building2, path: "/communities" },
  { label: "Associations", icon: Landmark, path: "/associations" },
  { label: "Escrow Dashboard", icon: Wallet, path: "/escrow" },
  { label: "Roles & Permissions", icon: Shield, path: "/roles" },
  { label: "Audit Logs", icon: FileText, path: "/audit-logs" },
  { label: "System Settings", icon: Settings, path: "/settings" },
];

export function QuickLinks() {
  const navigate = useNavigate();

  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <h3 className="font-semibold text-foreground mb-4">Quick Navigation</h3>
      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Button
              key={link.path}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(link.path)}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
