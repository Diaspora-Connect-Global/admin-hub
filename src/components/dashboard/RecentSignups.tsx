import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  status: "active" | "pending" | "suspended";
}

const recentUsers: User[] = [
  { id: "USR-001", name: "Kwame Asante", email: "kwame.a@email.com", joinedAt: "2 hours ago", status: "active" },
  { id: "USR-002", name: "Ama Mensah", email: "ama.m@email.com", joinedAt: "4 hours ago", status: "pending" },
  { id: "USR-003", name: "Kofi Owusu", email: "kofi.o@email.com", joinedAt: "6 hours ago", status: "active" },
  { id: "USR-004", name: "Abena Darko", email: "abena.d@email.com", joinedAt: "8 hours ago", status: "active" },
  { id: "USR-005", name: "Yaw Boateng", email: "yaw.b@email.com", joinedAt: "12 hours ago", status: "pending" },
];

const statusConfig = {
  active: { label: "Active", className: "badge-success" },
  pending: { label: "Pending", className: "badge-warning" },
  suspended: { label: "Suspended", className: "badge-destructive" },
};

export function RecentSignups() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Recent User Signups</h3>
          <p className="text-sm text-muted-foreground">Latest platform registrations</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {recentUsers.map((user) => {
          const status = statusConfig[user.status];
          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{user.joinedAt}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
