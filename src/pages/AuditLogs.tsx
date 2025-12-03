import { useState } from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  Download,
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample data matching new spec
const auditLogs = [
  { 
    id: 1, 
    timestamp: "2024-01-15 14:32:05", 
    user: "admin@system.com",
    role: "System Admin",
    action: "Login", 
    entity: "Auth", 
    entityId: "SESSION-001", 
    description: "Admin logged in successfully",
    ip: "192.168.1.45",
    oldValue: null,
    newValue: null,
    device: "MacBook Pro",
    browser: "Chrome 120.0",
    location: "Lagos, Nigeria",
    serverNotes: null
  },
  { 
    id: 2, 
    timestamp: "2024-01-15 14:28:12", 
    user: "admin@system.com",
    role: "System Admin",
    action: "Escrow Action", 
    entity: "Escrow", 
    entityId: "ESC-5678", 
    description: "Released $2,500 to vendor after buyer confirmation",
    ip: "192.168.1.45",
    oldValue: "Held",
    newValue: "Released",
    device: "MacBook Pro",
    browser: "Chrome 120.0",
    location: "Lagos, Nigeria",
    serverNotes: "Auto-approved based on buyer confirmation"
  },
  { 
    id: 3, 
    timestamp: "2024-01-15 14:15:00", 
    user: "support@system.com",
    role: "Community Admin",
    action: "Approval", 
    entity: "Community", 
    entityId: "COM-001", 
    description: "Approved new community registration for Ghana Belgium Diaspora",
    ip: "192.168.1.50",
    oldValue: "Pending",
    newValue: "Active",
    device: "Windows PC",
    browser: "Firefox 121.0",
    location: "Accra, Ghana",
    serverNotes: null
  },
  { 
    id: 4, 
    timestamp: "2024-01-15 13:45:22", 
    user: "admin@system.com",
    role: "System Admin",
    action: "Settings Change", 
    entity: "Settings", 
    entityId: "escrow_rules", 
    description: "Updated two-admin approval threshold",
    ip: "192.168.1.45",
    oldValue: "$5,000",
    newValue: "$10,000",
    device: "MacBook Pro",
    browser: "Chrome 120.0",
    location: "Lagos, Nigeria",
    serverNotes: "Changed per compliance review"
  },
  { 
    id: 5, 
    timestamp: "2024-01-15 13:30:10", 
    user: "finance@system.com",
    role: "Finance Admin",
    action: "Create", 
    entity: "Vendor", 
    entityId: "VND-9012", 
    description: "Created new vendor account for TechSupply Ltd",
    ip: "192.168.1.60",
    oldValue: null,
    newValue: "Active",
    device: "Windows PC",
    browser: "Edge 120.0",
    location: "Nairobi, Kenya",
    serverNotes: "KYC verified"
  },
  { 
    id: 6, 
    timestamp: "2024-01-15 12:55:33", 
    user: "support@system.com",
    role: "Community Admin",
    action: "Update", 
    entity: "User", 
    entityId: "USR-5555", 
    description: "Reset password for user upon request",
    ip: "192.168.1.50",
    oldValue: "********",
    newValue: "********",
    device: "Windows PC",
    browser: "Firefox 121.0",
    location: "Accra, Ghana",
    serverNotes: "User verified via support ticket #12345"
  },
  { 
    id: 7, 
    timestamp: "2024-01-15 12:20:45", 
    user: "admin@system.com",
    role: "System Admin",
    action: "Delete", 
    entity: "Post", 
    entityId: "PST-3456", 
    description: "Deleted post for violating community guidelines",
    ip: "192.168.1.45",
    oldValue: "Published",
    newValue: "Deleted",
    device: "MacBook Pro",
    browser: "Chrome 120.0",
    location: "Lagos, Nigeria",
    serverNotes: "Multiple user reports"
  },
  { 
    id: 8, 
    timestamp: "2024-01-15 11:45:00", 
    user: "admin@system.com",
    role: "System Admin",
    action: "Role Change", 
    entity: "User", 
    entityId: "USR-7890", 
    description: "Promoted user to Community Admin role",
    ip: "192.168.1.45",
    oldValue: "User",
    newValue: "Community Admin",
    device: "MacBook Pro",
    browser: "Chrome 120.0",
    location: "Lagos, Nigeria",
    serverNotes: null
  },
  { 
    id: 9, 
    timestamp: "2024-01-15 10:30:00", 
    user: "support@system.com",
    role: "Community Admin",
    action: "Link/Unlink", 
    entity: "Association", 
    entityId: "ASC-001", 
    description: "Linked Ghana Youth Association to Accra Community",
    ip: "192.168.1.50",
    oldValue: null,
    newValue: "Linked to COM-002",
    device: "Windows PC",
    browser: "Firefox 121.0",
    location: "Accra, Ghana",
    serverNotes: null
  },
  { 
    id: 10, 
    timestamp: "2024-01-15 09:15:00", 
    user: "moderator@system.com",
    role: "Moderator",
    action: "Post Moderation", 
    entity: "Post", 
    entityId: "PST-9999", 
    description: "Flagged post for review - potential spam content",
    ip: "192.168.1.70",
    oldValue: "Published",
    newValue: "Under Review",
    device: "iPhone 15",
    browser: "Safari Mobile",
    location: "London, UK",
    serverNotes: "AI flagged as 85% spam probability"
  },
];

const actionTypes = [
  "Login",
  "Create",
  "Update",
  "Delete",
  "Approval",
  "Escrow Action",
  "Settings Change",
  "Role Change",
  "Link/Unlink",
  "Post Moderation"
];

const users = [
  "admin@system.com",
  "support@system.com",
  "finance@system.com",
  "moderator@system.com"
];

const getRoleBadge = (role: string) => {
  const styles: Record<string, string> = {
    "System Admin": "bg-primary/20 text-primary border-primary/30",
    "Community Admin": "bg-info/20 text-info border-info/30",
    "Finance Admin": "bg-success/20 text-success border-success/30",
    "Moderator": "bg-warning/20 text-warning border-warning/30",
  };
  return styles[role] || "bg-muted text-muted-foreground border-border";
};

const getActionBadge = (action: string) => {
  const styles: Record<string, string> = {
    "Login": "bg-secondary text-secondary-foreground border-border",
    "Create": "bg-success/20 text-success border-success/30",
    "Update": "bg-info/20 text-info border-info/30",
    "Delete": "bg-destructive/20 text-destructive border-destructive/30",
    "Approval": "bg-success/20 text-success border-success/30",
    "Escrow Action": "bg-warning/20 text-warning border-warning/30",
    "Settings Change": "bg-primary/20 text-primary border-primary/30",
    "Role Change": "bg-primary/20 text-primary border-primary/30",
    "Link/Unlink": "bg-info/20 text-info border-info/30",
    "Post Moderation": "bg-warning/20 text-warning border-warning/30",
  };
  return styles[action] || "bg-muted text-muted-foreground border-border";
};

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [selectedLog, setSelectedLog] = useState<typeof auditLogs[0] | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const openDetails = (log: typeof auditLogs[0]) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const exportCsv = () => {
    // Implementation for CSV export
    console.log("Exporting CSV...");
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUser = userFilter === "all" || log.user === userFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesUser && matchesAction;
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor platform activity and admin actions.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[180px] justify-start">
                <CalendarIcon className="w-4 h-4" />
                {dateRange === "all" ? "All Time" : 
                 dateRange === "today" ? "Today" :
                 dateRange === "7days" ? "Last 7 Days" :
                 dateRange === "30days" ? "Last 30 Days" :
                 selectedDate ? format(selectedDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
              <div className="p-2 border-b border-border space-y-1">
                <Button 
                  variant={dateRange === "today" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setDateRange("today")}
                >
                  Today
                </Button>
                <Button 
                  variant={dateRange === "7days" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setDateRange("7days")}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant={dateRange === "30days" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setDateRange("30days")}
                >
                  Last 30 Days
                </Button>
                <Button 
                  variant={dateRange === "all" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setDateRange("all")}
                >
                  All Time
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setDateRange("custom");
                }}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* User Filter */}
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="bg-secondary border-border w-[200px]">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user} value={user}>{user}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-secondary border-border w-[180px]">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 ml-auto" onClick={exportCsv}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Logs Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent bg-muted/50">
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground">Entity</TableHead>
                <TableHead className="text-muted-foreground">Entity ID</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <Collapsible key={log.id} asChild open={expandedRows.includes(log.id)}>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow 
                        className="border-border hover:bg-secondary/50 cursor-pointer"
                        onClick={() => toggleRow(log.id)}
                      >
                        <TableCell className="w-8">
                          {expandedRows.includes(log.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                        <TableCell className="text-sm">{log.user}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", getRoleBadge(log.role))}>
                            {log.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", getActionBadge(log.action))}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.entity}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{log.description}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30 border-border hover:bg-muted/30">
                        <TableCell colSpan={9} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Full Action Description</span>
                              <span>{log.description}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Old Value</span>
                              <span className="font-mono">{log.oldValue || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">New Value</span>
                              <span className="font-mono">{log.newValue || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Device</span>
                              <span>{log.device}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Browser</span>
                              <span>{log.browser}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Location (approx)</span>
                              <span>{log.location}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground block text-xs mb-1">Server Notes</span>
                              <span>{log.serverNotes || "—"}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => openDetails(log)}>
                              View Full Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing {filteredLogs.length} of {auditLogs.length} logs</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>

        {/* Log Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle>Log Details</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Timestamp</span>
                    <span className="font-mono">{selectedLog.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Action</span>
                    <Badge variant="outline" className={cn("text-xs", getActionBadge(selectedLog.action))}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Performed By</span>
                    <span>{selectedLog.user}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Role</span>
                    <Badge variant="outline" className={cn("text-xs", getRoleBadge(selectedLog.role))}>
                      {selectedLog.role}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Device</span>
                    <span>{selectedLog.device}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">IP Address</span>
                    <span className="font-mono">{selectedLog.ip}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Entity</span>
                    <span>{selectedLog.entity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Entity ID</span>
                    <span className="font-mono">{selectedLog.entityId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Old Value</span>
                    <span className="font-mono">{selectedLog.oldValue || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">New Value</span>
                    <span className="font-mono">{selectedLog.newValue || "—"}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <span className="text-muted-foreground block text-xs mb-1">Metadata</span>
                  <div className="bg-muted/50 rounded-md p-3 text-sm font-mono text-xs">
                    <div>Browser: {selectedLog.browser}</div>
                    <div>Location: {selectedLog.location}</div>
                    {selectedLog.serverNotes && <div>Notes: {selectedLog.serverNotes}</div>}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
