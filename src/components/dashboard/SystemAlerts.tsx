import { AlertTriangle, AlertCircle, Info, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  entity: string;
  message: string;
  timestamp: string;
  status: "new" | "acknowledged";
}

const systemAlerts: Alert[] = [
  {
    id: "ALT-001",
    type: "critical",
    entity: "Escrow #ESC-4521",
    message: "Large transaction dispute ($25,000) requires review",
    timestamp: "5 min ago",
    status: "new",
  },
  {
    id: "ALT-002",
    type: "warning",
    entity: "User USR-8734",
    message: "Multiple failed login attempts detected",
    timestamp: "15 min ago",
    status: "new",
  },
  {
    id: "ALT-003",
    type: "warning",
    entity: "Association ASC-234",
    message: "Document verification pending for 7+ days",
    timestamp: "1 hour ago",
    status: "acknowledged",
  },
  {
    id: "ALT-004",
    type: "info",
    entity: "Community CM-089",
    message: "New community reached 1,000 members milestone",
    timestamp: "2 hours ago",
    status: "acknowledged",
  },
];

const typeConfig = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
  },
  info: {
    icon: Info,
    bg: "bg-info/10",
    border: "border-info/30",
    text: "text-info",
  },
};

export function SystemAlerts() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">System Alerts</h3>
          <p className="text-sm text-muted-foreground">Critical notifications & warnings</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {systemAlerts.map((alert) => {
          const config = typeConfig[alert.type];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                config.bg,
                config.border
              )}
            >
              <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.text)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs font-medium", config.text)}>{alert.entity}</span>
                  <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                  {alert.status === "new" && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-destructive/20 text-destructive rounded">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success">
                  <CheckCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
