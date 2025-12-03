import { MoreHorizontal, Eye, UserPlus, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Dispute {
  id: string;
  projectId: string;
  user: string;
  amount: string;
  status: "new" | "in_review" | "escalated" | "resolved";
  assignedAdmin: string | null;
  createdAt: string;
}

const mockDisputes: Dispute[] = [
  {
    id: "DSP-1234",
    projectId: "PRJ-5678",
    user: "john.doe@email.com",
    amount: "$2,500",
    status: "new",
    assignedAdmin: null,
    createdAt: "2 hours ago",
  },
  {
    id: "DSP-1233",
    projectId: "PRJ-5677",
    user: "vendor@store.com",
    amount: "$8,750",
    status: "in_review",
    assignedAdmin: "Sarah M.",
    createdAt: "5 hours ago",
  },
  {
    id: "DSP-1232",
    projectId: "PRJ-5676",
    user: "buyer123@mail.com",
    amount: "$1,200",
    status: "escalated",
    assignedAdmin: "Admin Team",
    createdAt: "1 day ago",
  },
  {
    id: "DSP-1231",
    projectId: "PRJ-5675",
    user: "seller@business.com",
    amount: "$15,000",
    status: "in_review",
    assignedAdmin: "Mike R.",
    createdAt: "2 days ago",
  },
  {
    id: "DSP-1230",
    projectId: "PRJ-5674",
    user: "customer@example.com",
    amount: "$500",
    status: "resolved",
    assignedAdmin: "Sarah M.",
    createdAt: "3 days ago",
  },
];

const statusConfig = {
  new: { label: "New", class: "badge-destructive" },
  in_review: { label: "In Review", class: "badge-warning" },
  escalated: { label: "Escalated", class: "badge-info" },
  resolved: { label: "Resolved", class: "badge-success" },
};

export function RecentDisputes() {
  return (
    <div className="table-container animate-fade-in">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Recent Disputes</h3>
            <p className="text-sm text-muted-foreground">Manage and resolve open disputes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Bulk Assign
            </Button>
            <Button variant="ghost" size="sm" className="text-primary">
              View all
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Dispute ID
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Project
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Amount
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Assigned
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Created
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {mockDisputes.map((dispute) => {
              const status = statusConfig[dispute.status];
              return (
                <tr
                  key={dispute.id}
                  className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono text-foreground">{dispute.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-muted-foreground">{dispute.projectId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-foreground">{dispute.user}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-foreground">{dispute.amount}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("badge-status", status.class)}>{status.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-muted-foreground">
                      {dispute.assignedAdmin || "Unassigned"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-muted-foreground">{dispute.createdAt}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <UserPlus className="w-4 h-4" /> Assign
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <ArrowUpRight className="w-4 h-4" /> Escalate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-success">
                          <X className="w-4 h-4" /> Close
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
