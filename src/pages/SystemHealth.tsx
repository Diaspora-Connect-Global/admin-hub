import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetSystemHealth,
  useGetSystemAlerts,
  useAcknowledgeAlert,
  useGetPerformanceMetrics,
  useGetAuditLogs,
  type SystemAlert,
} from "@/hooks/admin";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Database,
  FileText,
  Settings,
  Wallet,
  Activity,
  Eye,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function SystemHealth() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAcknowledgeModalOpen, setIsAcknowledgeModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [acknowledgeNote, setAcknowledgeNote] = useState("");

  const { data: healthData, loading: healthLoading, refetch: refetchHealth } = useGetSystemHealth();
  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useGetSystemAlerts();
  const { data: metricsData } = useGetPerformanceMetrics();
  const { data: auditData } = useGetAuditLogs({ limit: 10 });

  const [acknowledgeAlert] = useAcknowledgeAlert();

  const systemHealth = healthData?.getSystemHealth;
  const liveServices = systemHealth?.services ?? [];
  const alerts = alertsData?.getSystemAlerts ?? [];
  const metrics = metricsData?.getPerformanceMetrics ?? [];
  const auditLogs = auditData?.getAuditLogs?.items ?? [];

  const filteredServices = liveServices.filter((svc) => {
    const matchesSearch = !searchQuery || svc.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || svc.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Build a single "Now" chart data point from live metrics + pad with historical context
  const performanceData = useMemo(() => {
    const cpuMetric = metrics.find((m) => m.label === "cpu_usage");
    const memMetric = metrics.find((m) => m.label === "memory_usage");
    const reqMetric = metrics.find((m) => m.label === "requests_per_min");
    const nowPoint = {
      time: "Now",
      cpu: cpuMetric ? Math.round(cpuMetric.value) : null,
      memory: memMetric ? Math.round(memMetric.value) : null,
      requests: reqMetric ? Math.round(reqMetric.value) : null,
    };
    // Fill chart with historical placeholders so "Now" isn't lonely
    const slots = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
    return [
      ...slots.map((time) => ({ time, cpu: null, memory: null, requests: null })),
      nowPoint,
    ];
  }, [metrics]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "up":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "critical":
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Healthy: "default",
      healthy: "default",
      Warning: "secondary",
      warning: "secondary",
      Critical: "destructive",
      critical: "destructive",
      Offline: "destructive",
      Active: "destructive",
      Acknowledged: "outline",
    };
    const colors: Record<string, string> = {
      Healthy: "bg-green-600 hover:bg-green-600",
      healthy: "bg-green-600 hover:bg-green-600",
      Warning: "bg-yellow-500 hover:bg-yellow-500 text-black",
      warning: "bg-yellow-500 hover:bg-yellow-500 text-black",
    };
    return (
      <Badge variant={variants[status] ?? "outline"} className={colors[status] || ""}>
        {status}
      </Badge>
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchHealth(), refetchAlerts()]);
      toast({ title: "Refreshed", description: "System health data updated." });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAcknowledgeAlert = async () => {
    if (!selectedAlert || !acknowledgeNote.trim()) return;
    try {
      await acknowledgeAlert({ variables: { id: selectedAlert.id, note: acknowledgeNote } });
      toast({ title: "Alert Acknowledged", description: "The alert has been acknowledged." });
      refetchAlerts();
    } catch {
      toast({ title: "Error", description: "Failed to acknowledge alert.", variant: "destructive" });
    } finally {
      setIsAcknowledgeModalOpen(false);
      setAcknowledgeNote("");
      setSelectedAlert(null);
    }
  };

  // Uptime derived from service statuses
  const uptimePercent = liveServices.length > 0
    ? Math.round((liveServices.filter((s) => s.status === "healthy" || s.status === "up").length / liveServices.length) * 10000) / 100
    : 99.97;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('systemHealth.title')}</h1>
          <p className="text-muted-foreground">{t('systemHealth.serverStatus')}</p>
        </div>

        {/* Top Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Service name, database, cache, external API"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
                <SelectItem value="down">Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        </div>

        {/* Overall status banner */}
        {systemHealth && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
            systemHealth.overallStatus === "healthy" ? "bg-green-500/10 border-green-500/30 text-green-600" :
            systemHealth.overallStatus === "degraded" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600" :
            "bg-red-500/10 border-red-500/30 text-red-600"
          }`}>
            {getStatusIcon(systemHealth.overallStatus)}
            Overall system status: <span className="font-bold capitalize">{systemHealth.overallStatus}</span>
            {systemHealth.checkedAt && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Last checked: {new Date(systemHealth.checkedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Service Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {healthLoading && (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">Loading service status...</CardContent>
            </Card>
          )}
          {!healthLoading && filteredServices.length === 0 && liveServices.length > 0 && (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">No services match filters.</CardContent>
            </Card>
          )}
          {filteredServices.map((svc) => (
            <Card key={svc.service}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  {svc.service}
                </CardTitle>
                {getStatusIcon(svc.status)}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  {getStatusBadge(svc.status)}
                </div>
                <div className="space-y-2 text-sm">
                  {svc.latencyMs != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Latency</span>
                      <span className="font-medium">{svc.latencyMs}ms</span>
                    </div>
                  )}
                  {svc.error && (
                    <div className="text-destructive text-xs mt-1 truncate" title={svc.error}>
                      {svc.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Live Performance Metrics Cards */}
          {metrics.length > 0 && metrics.map((m) => (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  {m.label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(m.value)}{m.unit ?? ""}</div>
                {m.unit === "%" && (
                  <Progress value={Math.min(m.value, 100)} className="mt-2 h-2" />
                )}
                {m.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    As of {new Date(m.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Uptime Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Service Uptime
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{uptimePercent}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {liveServices.filter((s) => s.status === "healthy" || s.status === "up").length} of {liveServices.length} services healthy
              </p>
              <Progress value={uptimePercent} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Critical System Alerts
            </CardTitle>
            <CardDescription>Active alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> No active alerts
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert Type</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.type}</TableCell>
                      <TableCell>{alert.component}</TableCell>
                      <TableCell>
                        <Badge
                          variant={alert.severity === "Critical" ? "destructive" : "secondary"}
                          className={alert.severity === "Warning" ? "bg-yellow-500 text-black" : ""}
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{alert.timestamp}</TableCell>
                      <TableCell>{getStatusBadge(alert.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedAlert(alert); setIsAcknowledgeModalOpen(true); }}
                          disabled={alert.status === "Acknowledged"}
                        >
                          Acknowledge
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Performance
            </CardTitle>
            <CardDescription>Live CPU, memory, and request metrics — historical points pending time-series API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    name="CPU %"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={(props) => props.payload.cpu !== null ? <circle {...props} r={4} /> : <g />}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="memory"
                    name="Memory %"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={(props) => props.payload.memory !== null ? <circle {...props} r={4} /> : <g />}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    name="Req/min"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={(props) => props.payload.requests !== null ? <circle {...props} r={4} /> : <g />}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent System Events (Audit Logs) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Recent System Events
            </CardTitle>
            <CardDescription>Latest audit log entries</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No recent events</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Resource Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Resource ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>{log.resourceType ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.actorId?.slice(0, 8) ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{log.resourceId?.slice(0, 8) ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Links Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/audit")}>
                <FileText className="mr-2 h-4 w-4" /> Audit Logs
              </Button>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" /> System Settings
              </Button>
              <Button variant="outline" onClick={() => navigate("/escrow")}>
                <Wallet className="mr-2 h-4 w-4" /> Escrow Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledge Alert Modal */}
        <Dialog open={isAcknowledgeModalOpen} onOpenChange={setIsAcknowledgeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Acknowledge Alert</DialogTitle>
              <DialogDescription>
                Acknowledging this alert will mark it as reviewed. Please add a note.
              </DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                  <div><strong>Alert:</strong> {selectedAlert.type}</div>
                  <div><strong>Component:</strong> {selectedAlert.component}</div>
                  <div><strong>Severity:</strong> {selectedAlert.severity}</div>
                </div>
                <div className="space-y-2">
                  <Label>Acknowledgement Note *</Label>
                  <Textarea
                    value={acknowledgeNote}
                    onChange={(e) => setAcknowledgeNote(e.target.value)}
                    placeholder="Describe the action taken or reason for acknowledgement..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAcknowledgeModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAcknowledgeAlert} disabled={!acknowledgeNote.trim()}>Acknowledge</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
