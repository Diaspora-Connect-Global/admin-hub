import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  Eye,
  FileText,
  Shield,
  Clock,
  User,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample data
const auditLogs = [
  { 
    id: 1, 
    timestamp: "2024-01-15 14:32:05", 
    adminId: "admin@system.com", 
    action: "user.suspend", 
    objectType: "user", 
    objectId: "USR-1234", 
    summary: "Suspended user account for policy violation",
    ip: "192.168.1.45",
    severity: "high"
  },
  { 
    id: 2, 
    timestamp: "2024-01-15 14:28:12", 
    adminId: "admin@system.com", 
    action: "escrow.release", 
    objectType: "escrow", 
    objectId: "ESC-5678", 
    summary: "Released $2,500 to vendor",
    ip: "192.168.1.45",
    severity: "medium"
  },
  { 
    id: 3, 
    timestamp: "2024-01-15 14:15:00", 
    adminId: "support@system.com", 
    action: "community.approve", 
    objectType: "community", 
    objectId: "COM-001", 
    summary: "Approved new community registration",
    ip: "192.168.1.50",
    severity: "low"
  },
  { 
    id: 4, 
    timestamp: "2024-01-15 13:45:22", 
    adminId: "admin@system.com", 
    action: "settings.update", 
    objectType: "settings", 
    objectId: "escrow_rules", 
    summary: "Updated two-admin approval threshold from $5,000 to $10,000",
    ip: "192.168.1.45",
    severity: "high"
  },
  { 
    id: 5, 
    timestamp: "2024-01-15 13:30:10", 
    adminId: "finance@system.com", 
    action: "vendor.payout", 
    objectType: "vendor", 
    objectId: "VND-9012", 
    summary: "Processed vendor payout of $15,000",
    ip: "192.168.1.60",
    severity: "high"
  },
  { 
    id: 6, 
    timestamp: "2024-01-15 12:55:33", 
    adminId: "support@system.com", 
    action: "user.password_reset", 
    objectType: "user", 
    objectId: "USR-5555", 
    summary: "Reset password for user request",
    ip: "192.168.1.50",
    severity: "low"
  },
  { 
    id: 7, 
    timestamp: "2024-01-15 12:20:45", 
    adminId: "admin@system.com", 
    action: "dispute.resolve", 
    objectType: "dispute", 
    objectId: "DSP-3456", 
    summary: "Resolved dispute in favor of buyer, refunded $800",
    ip: "192.168.1.45",
    severity: "medium"
  },
  { 
    id: 8, 
    timestamp: "2024-01-15 11:45:00", 
    adminId: "security@system.com", 
    action: "auth.login_failed", 
    objectType: "auth", 
    objectId: "admin@system.com", 
    summary: "Failed login attempt detected from unknown IP",
    ip: "45.33.32.156",
    severity: "critical"
  },
];

const getSeverityBadge = (severity: string) => {
  const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
    critical: { bg: "bg-destructive/20 text-destructive border-destructive/30", icon: <XCircle className="w-3 h-3" /> },
    high: { bg: "bg-warning/20 text-warning border-warning/30", icon: <AlertTriangle className="w-3 h-3" /> },
    medium: { bg: "bg-info/20 text-info border-info/30", icon: <Info className="w-3 h-3" /> },
    low: { bg: "bg-success/20 text-success border-success/30", icon: <CheckCircle className="w-3 h-3" /> },
  };
  return styles[severity] || styles.low;
};

const getObjectTypeBadge = (type: string) => {
  const styles: Record<string, string> = {
    user: "bg-primary/20 text-primary border-primary/30",
    escrow: "bg-success/20 text-success border-success/30",
    community: "bg-info/20 text-info border-info/30",
    vendor: "bg-warning/20 text-warning border-warning/30",
    settings: "bg-muted text-muted-foreground border-border",
    dispute: "bg-destructive/20 text-destructive border-destructive/30",
    auth: "bg-secondary text-secondary-foreground border-border",
  };
  return styles[type] || styles.settings;
};

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<typeof auditLogs[0] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDetails = (log: typeof auditLogs[0]) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tamper-proof record of all admin actions and system events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 bg-secondary/50">
              <Shield className="w-3 h-3" />
              Read-only
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem>Export as XLSX</DropdownMenuItem>
                <DropdownMenuItem>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem>Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by admin, action, or object ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Admins</SelectItem>
                <SelectItem value="admin@system.com">admin@system.com</SelectItem>
                <SelectItem value="support@system.com">support@system.com</SelectItem>
                <SelectItem value="finance@system.com">finance@system.com</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="suspend">Suspend</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Object Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Objects</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="escrow">Escrow</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" className="text-muted-foreground">
              Clear All
            </Button>
          </div>
        )}

        {/* Logs Table */}
        <div className="table-container">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-muted-foreground">Admin</TableHead>
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground">Object</TableHead>
                <TableHead className="text-muted-foreground">Summary</TableHead>
                <TableHead className="text-muted-foreground">IP</TableHead>
                <TableHead className="text-muted-foreground">Severity</TableHead>
                <TableHead className="text-muted-foreground text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => {
                const severity = getSeverityBadge(log.severity);
                return (
                  <TableRow key={log.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                    <TableCell className="text-sm">{log.adminId}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">{log.action}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs capitalize", getObjectTypeBadge(log.objectType))}>
                          {log.objectType}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">{log.objectId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{log.summary}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs capitalize gap-1", severity.bg)}>
                        {severity.icon}
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetails(log)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing 1-8 of 1,247 logs</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>

        {/* Details Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] bg-card border-border overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground">Log Details</SheetTitle>
            </SheetHeader>
            {selectedLog && (
              <div className="mt-6 space-y-6">
                {/* Action Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Activity className="w-4 h-4" />
                    Action Details
                  </div>
                  <div className="glass rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Action</span>
                      <code className="text-sm bg-secondary px-2 py-0.5 rounded">{selectedLog.action}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Admin</span>
                      <span className="text-sm">{selectedLog.adminId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Timestamp</span>
                      <span className="text-sm font-mono">{selectedLog.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">IP Address</span>
                      <span className="text-sm font-mono">{selectedLog.ip}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Summary</span>
                      <p className="text-sm mt-1">{selectedLog.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Object Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    Object Information
                  </div>
                  <div className="glass rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Object Type</span>
                      <Badge variant="outline" className={cn("text-xs capitalize", getObjectTypeBadge(selectedLog.objectType))}>
                        {selectedLog.objectType}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Object ID</span>
                      <span className="text-sm font-mono">{selectedLog.objectId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Related Entities</span>
                      <span className="text-sm text-muted-foreground">—</span>
                    </div>
                  </div>
                </div>

                {/* Security Flags */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Security Flags
                  </div>
                  <div className="glass rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Severity</span>
                      <Badge variant="outline" className={cn("text-xs capitalize gap-1", getSeverityBadge(selectedLog.severity).bg)}>
                        {getSeverityBadge(selectedLog.severity).icon}
                        {selectedLog.severity}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fraud Checks</span>
                      <Badge variant="outline" className="text-xs bg-success/20 text-success border-success/30 gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Passed
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Location Mismatch</span>
                      <span className="text-sm">No</span>
                    </div>
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Export JSON
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
