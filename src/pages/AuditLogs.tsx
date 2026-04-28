import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useGetAuditLogs } from "@/hooks/admin";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

const logger_ = logger.child("AuditLogs");

interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  ipAddress?: string | null;
}

const getActionBadge = (action: string) => {
  const styles: Record<string, string> = {
    LOGIN: "bg-secondary text-secondary-foreground border-border",
    CREATE: "bg-success/20 text-success border-success/30",
    UPDATE: "bg-info/20 text-info border-info/30",
    DELETE: "bg-destructive/20 text-destructive border-destructive/30",
    BAN: "bg-destructive/20 text-destructive border-destructive/30",
    UNBAN: "bg-success/20 text-success border-success/30",
    REMOVE_CONTENT: "bg-destructive/20 text-destructive border-destructive/30",
    ASSIGN_ROLE: "bg-primary/20 text-primary border-primary/30",
    REVOKE_ROLE: "bg-warning/20 text-warning border-warning/30",
    RESOLVE_DISPUTE: "bg-success/20 text-success border-success/30",
    FREEZE_ESCROW: "bg-warning/20 text-warning border-warning/30",
    RELEASE_ESCROW: "bg-success/20 text-success border-success/30",
  };
  return styles[action] || "bg-muted text-muted-foreground border-border";
};

function dateRangeToIso(dateRange: string, selectedDate?: Date): { fromDate?: string; toDate?: string } {
  const now = new Date();
  if (dateRange === "today") return { fromDate: startOfDay(now).toISOString(), toDate: endOfDay(now).toISOString() };
  if (dateRange === "7days") return { fromDate: subDays(now, 7).toISOString() };
  if (dateRange === "30days") return { fromDate: subDays(now, 30).toISOString() };
  if (dateRange === "custom" && selectedDate) return { fromDate: startOfDay(selectedDate).toISOString(), toDate: endOfDay(selectedDate).toISOString() };
  return {};
}

export default function AuditLogs() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 50;

  const { fromDate, toDate } = useMemo(() => dateRangeToIso(dateRange, selectedDate), [dateRange, selectedDate]);

  const { data, loading } = useGetAuditLogs({
    action: actionFilter !== "all" ? actionFilter : undefined,
    fromDate,
    toDate,
    limit: PAGE_SIZE,
    offset,
  });

  const auditLogs: AuditLogEntry[] = data?.getAuditLogs?.items ?? [];
  const total: number = data?.getAuditLogs?.total ?? 0;

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return auditLogs;
    const q = searchQuery.toLowerCase();
    return auditLogs.filter(l =>
      l.actorId.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.resourceType.toLowerCase().includes(q) ||
      l.resourceId.toLowerCase().includes(q)
    );
  }, [auditLogs, searchQuery]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const openDetails = (entry: AuditLogEntry) => {
    setSelectedLog(entry);
    setDetailsOpen(true);
  };

  const exportCsv = () => {
    logger_.info("Exporting CSV");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('audit.title')}</h1>
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

          {/* Action Filter */}
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setOffset(0); }}>
            <SelectTrigger className="bg-secondary border-border w-[180px]">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="BAN">Ban</SelectItem>
              <SelectItem value="UNBAN">Unban</SelectItem>
              <SelectItem value="REMOVE_CONTENT">Remove Content</SelectItem>
              <SelectItem value="ASSIGN_ROLE">Assign Role</SelectItem>
              <SelectItem value="REVOKE_ROLE">Revoke Role</SelectItem>
              <SelectItem value="RESOLVE_DISPUTE">Resolve Dispute</SelectItem>
              <SelectItem value="FREEZE_ESCROW">Freeze Escrow</SelectItem>
              <SelectItem value="RELEASE_ESCROW">Release Escrow</SelectItem>
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
                <TableHead className="text-muted-foreground">Actor ID</TableHead>
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground">Resource Type</TableHead>
                <TableHead className="text-muted-foreground">Resource ID</TableHead>
                <TableHead className="text-muted-foreground">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
              {filteredLogs.map((entry) => (
                <Collapsible key={entry.id} asChild open={expandedRows.includes(entry.id)}>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow
                        className="border-border hover:bg-secondary/50 cursor-pointer"
                        onClick={() => toggleRow(entry.id)}
                      >
                        <TableCell className="w-8">
                          {expandedRows.includes(entry.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                          {entry.actorId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", getActionBadge(entry.action))}>
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{entry.resourceType}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {entry.resourceId}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {entry.ipAddress ?? "—"}
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30 border-border hover:bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Full Actor ID</span>
                              <span className="font-mono text-xs break-all">{entry.actorId}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Full Resource ID</span>
                              <span className="font-mono text-xs break-all">{entry.resourceId}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">IP Address</span>
                              <span className="font-mono">{entry.ipAddress ?? "—"}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => openDetails(entry)}>
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
          <span className="text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total} logs
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </Button>
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
                    <span className="font-mono">{format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Action</span>
                    <Badge variant="outline" className={cn("text-xs", getActionBadge(selectedLog.action))}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-xs mb-1">Actor ID</span>
                    <span className="font-mono text-xs break-all">{selectedLog.actorId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Resource Type</span>
                    <span>{selectedLog.resourceType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">Resource ID</span>
                    <span className="font-mono text-xs break-all">{selectedLog.resourceId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">IP Address</span>
                    <span className="font-mono">{selectedLog.ipAddress ?? "—"}</span>
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
