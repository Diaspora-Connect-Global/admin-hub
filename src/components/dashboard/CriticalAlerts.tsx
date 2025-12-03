import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  source: string;
  message: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    timestamp: "2 min ago",
    severity: "critical",
    source: "Escrow System",
    message: "Large transaction ($50,000) pending approval",
  },
  {
    id: "2",
    timestamp: "15 min ago",
    severity: "warning",
    source: "Payment Gateway",
    message: "Stripe webhook failures detected (3 in last hour)",
  },
  {
    id: "3",
    timestamp: "1 hour ago",
    severity: "info",
    source: "User Management",
    message: "Bulk import completed: 150 new users added",
  },
];

const severityConfig = {
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

export function CriticalAlerts() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Critical Alerts</h3>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {mockAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
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
                  <span className={cn("text-xs font-medium", config.text)}>
                    {alert.source}
                  </span>
                  <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                </div>
                <p className="text-sm text-foreground">{alert.message}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
