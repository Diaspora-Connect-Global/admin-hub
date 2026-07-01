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
import type { SystemHealthService } from "@/services/networks/graphql/admin";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common/StateViews";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Layers,
  ListChecks,
  ArrowDownCircle,
  Gauge,
  FileText,
  Settings,
  Wallet,
  Activity,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** Maps backend category strings to translation keys. */
const CATEGORY_KEYS: Record<string, string> = {
  "Core Platform": "systemHealth.categoryCorePlatform",
  "Social & Content": "systemHealth.categorySocialContent",
  "Commerce & Payments": "systemHealth.categoryCommercePayments",
  "Discovery & Knowledge": "systemHealth.categoryDiscoveryKnowledge",
  "AI & Intelligence": "systemHealth.categoryAiIntelligence",
};

const isHealthy = (status: string) =>
  status.toLowerCase() === "healthy" || status.toLowerCase() === "up";
const isDegraded = (status: string) =>
  status.toLowerCase() === "warning" || status.toLowerCase() === "degraded";
const isDown = (status: string) =>
  status.toLowerCase() === "critical" || status.toLowerCase() === "down";

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

  const {
    data: healthData,
    loading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useGetSystemHealth();
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
    const matchesSearch =
      !searchQuery || svc.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "healthy" && isHealthy(svc.status)) ||
      (statusFilter === "degraded" && isDegraded(svc.status)) ||
      (statusFilter === "down" && isDown(svc.status));
    return matchesSearch && matchesStatus;
  });

  // Group filtered services by their backend `category` field, preserving order.
  const groupedServices = useMemo(() => {
    const groups = new Map<string, SystemHealthService[]>();
    for (const svc of filteredServices) {
      const key = svc.category ?? "__other__";
      const bucket = groups.get(key);
      if (bucket) bucket.push(svc);
      else groups.set(key, [svc]);
    }
    return Array.from(groups.entries());
  }, [filteredServices]);

  const categoryLabel = (rawKey: string) => {
    if (rawKey === "__other__") return t("systemHealth.categoryOther");
    return CATEGORY_KEYS[rawKey] ? t(CATEGORY_KEYS[rawKey]) : rawKey;
  };

  // KPI aggregates computed from all live services (not filtered).
  const totalServices = liveServices.length;
  const healthyCount = liveServices.filter((s) => isHealthy(s.status)).length;
  const degradedCount = liveServices.filter((s) => isDegraded(s.status)).length;
  const downCount = liveServices.filter((s) => isDown(s.status)).length;
  const latencies = liveServices
    .map((s) => s.latencyMs)
    .filter((l): l is number => typeof l === "number");
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;
  const uptimePercent =
    totalServices > 0
      ? Math.round((healthyCount / totalServices) * 10000) / 100
      : 0;

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
      ...slots.map(
        (time): { time: string; cpu: number | null; memory: number | null; requests: number | null } => ({
          time,
          cpu: null,
          memory: null,
          requests: null,
        }),
      ),
      nowPoint,
    ];
  }, [metrics]);

  const getStatusIcon = (status: string) => {
    if (isHealthy(status)) return <CheckCircle className="h-5 w-5 text-success" />;
    if (isDegraded(status)) return <AlertTriangle className="h-5 w-5 text-warning" />;
    if (isDown(status)) return <XCircle className="h-5 w-5 text-destructive" />;
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, StatusBadgeProps["variant"]> = {
      Healthy: "active",
      healthy: "active",
      up: "active",
      Warning: "warning",
      warning: "warning",
      degraded: "warning",
      Critical: "error",
      critical: "error",
      down: "error",
      Offline: "error",
      Active: "error",
      Acknowledged: "inactive",
    };
    return <StatusBadge variant={variants[status] ?? "inactive"}>{status}</StatusBadge>;
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

  const overallStatus = systemHealth?.overallStatus ?? "healthy";
  const bannerClass = isDown(overallStatus)
    ? "bg-destructive/10 border-destructive/30 text-destructive"
    : isDegraded(overallStatus)
      ? "bg-warning/10 border-warning/30 text-warning"
      : "bg-success/10 border-success/30 text-success";

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("systemHealth.title")}</h1>
            <p className="text-muted-foreground">{t("systemHealth.serverStatus")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                {t("systemHealth.autoRefreshing")}
              </span>
              {systemHealth?.checkedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {t("systemHealth.lastChecked")}{" "}
                  {new Date(systemHealth.checkedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("systemHealth.refresh")}
          </Button>
        </div>

        {healthLoading && !systemHealth ? (
          <LoadingState rows={6} />
        ) : healthError ? (
          <ErrorState title={t("systemHealth.errorTitle")} onRetry={() => refetchHealth()} />
        ) : (
          <>
            {/* Overall status banner */}
            {systemHealth && (
              <div
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${bannerClass}`}
              >
                {getStatusIcon(overallStatus)}
                {t("systemHealth.overallStatus")}:{" "}
                <span className="font-bold capitalize">{overallStatus}</span>
              </div>
            )}

            {/* Summary KPI row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <MetricCard
                label={t("systemHealth.kpiTotal")}
                value={String(totalServices)}
                icon={<Layers className="h-5 w-5" />}
              />
              <MetricCard
                label={t("systemHealth.kpiHealthy")}
                value={String(healthyCount)}
                icon={<ListChecks className="h-5 w-5" />}
              />
              <MetricCard
                label={t("systemHealth.kpiDegraded")}
                value={String(degradedCount)}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <MetricCard
                label={t("systemHealth.kpiDown")}
                value={String(downCount)}
                icon={<ArrowDownCircle className="h-5 w-5" />}
              />
              <MetricCard
                label={t("systemHealth.kpiAvgLatency")}
                value={`${avgLatency}ms`}
                icon={<Gauge className="h-5 w-5" />}
              />
            </div>

            {/* Uptime card */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-success" />
                  {t("systemHealth.uptime")}
                </div>
                <span className="text-2xl font-bold text-success">{uptimePercent}%</span>
              </div>
              <Progress value={uptimePercent} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {t("systemHealth.servicesHealthy", {
                  healthy: healthyCount,
                  total: totalServices,
                })}
              </p>
            </div>

            {/* Search + status filter */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("systemHealth.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">{t("systemHealth.filterAll")}</SelectItem>
                  <SelectItem value="healthy">{t("systemHealth.statusHealthy")}</SelectItem>
                  <SelectItem value="degraded">{t("systemHealth.statusDegraded")}</SelectItem>
                  <SelectItem value="down">{t("systemHealth.statusDown")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category-grouped service sections */}
            {filteredServices.length === 0 ? (
              <EmptyState title={t("systemHealth.noMatch")} />
            ) : (
              <div className="space-y-8">
                {groupedServices.map(([categoryKey, services]) => (
                  <section key={categoryKey} className="space-y-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      {categoryLabel(categoryKey)}
                      <Badge variant="outline" className="ml-1">
                        {services.length}
                      </Badge>
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {services.map((svc) => (
                        <div key={svc.service} className="glass rounded-xl p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Server className="h-4 w-4 text-muted-foreground" />
                              {svc.service}
                            </div>
                            {getStatusIcon(svc.status)}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {getStatusBadge(svc.status)}
                            {svc.latencyMs != null && (
                              <Badge variant="outline" className="text-xs font-normal">
                                {t("systemHealth.latency")}: {svc.latencyMs}ms
                              </Badge>
                            )}
                          </div>
                          {svc.error && (
                            <div
                              className="mt-2 truncate text-xs text-destructive"
                              title={svc.error}
                            >
                              {svc.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tabbed lower section */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList>
            <TabsTrigger value="alerts">{t("systemHealth.tabAlerts")}</TabsTrigger>
            <TabsTrigger value="performance">{t("systemHealth.tabPerformance")}</TabsTrigger>
            <TabsTrigger value="events">{t("systemHealth.tabEvents")}</TabsTrigger>
          </TabsList>

          {/* Alerts tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  {t("systemHealth.alertsTitle")}
                </CardTitle>
                <CardDescription>{t("systemHealth.alertsSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <LoadingState rows={3} />
                ) : alerts.length === 0 ? (
                  <p className="flex items-center justify-center gap-2 py-4 text-center text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success" /> {t("systemHealth.alertsEmpty")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
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
                              <StatusBadge
                                variant={alert.severity === "Critical" ? "error" : "warning"}
                              >
                                {alert.severity}
                              </StatusBadge>
                            </TableCell>
                            <TableCell className="text-sm">{alert.timestamp}</TableCell>
                            <TableCell>{getStatusBadge(alert.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAlert(alert);
                                  setIsAcknowledgeModalOpen(true);
                                }}
                                disabled={alert.status === "Acknowledged"}
                              >
                                {t("systemHealth.acknowledge")}
                              </Button>
                              <Button variant="ghost" size="sm" aria-label={t("common.view")}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-primary" />
                  {t("systemHealth.performanceTitle")}
                </CardTitle>
                <CardDescription>{t("systemHealth.performanceSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.length === 0 ? (
                  <EmptyState title={t("systemHealth.performanceUnavailable")} />
                ) : (
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
                        dot={(props) => (props.payload.cpu !== null ? <circle {...props} r={4} /> : <g />)}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="memory"
                        name="Memory %"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={(props) =>
                          props.payload.memory !== null ? <circle {...props} r={4} /> : <g />
                        }
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="requests"
                        name="Req/min"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={(props) =>
                          props.payload.requests !== null ? <circle {...props} r={4} /> : <g />
                        }
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  {t("systemHealth.eventsTitle")}
                </CardTitle>
                <CardDescription>{t("systemHealth.eventsSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t("systemHealth.eventsEmpty")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
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
                            <TableCell className="font-mono text-xs">
                              {log.actorId?.slice(0, 8) ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.resourceId?.slice(0, 8) ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" onClick={() => navigate("/audit")}>
                <FileText className="mr-2 h-4 w-4" /> {t("systemHealth.quickLinksAudit")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" /> {t("systemHealth.quickLinksSettings")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/escrow")}>
                <Wallet className="mr-2 h-4 w-4" /> {t("systemHealth.quickLinksEscrow")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledge Alert Modal */}
        <Dialog open={isAcknowledgeModalOpen} onOpenChange={setIsAcknowledgeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("systemHealth.acknowledgeTitle")}</DialogTitle>
              <DialogDescription>{t("systemHealth.acknowledgeDesc")}</DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4">
                <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
                  <div>
                    <strong>Alert:</strong> {selectedAlert.type}
                  </div>
                  <div>
                    <strong>Component:</strong> {selectedAlert.component}
                  </div>
                  <div>
                    <strong>Severity:</strong> {selectedAlert.severity}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("systemHealth.acknowledgeNote")}</Label>
                  <Textarea
                    value={acknowledgeNote}
                    onChange={(e) => setAcknowledgeNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAcknowledgeModalOpen(false)}>
                {t("systemHealth.cancel")}
              </Button>
              <Button onClick={handleAcknowledgeAlert} disabled={!acknowledgeNote.trim()}>
                {t("systemHealth.acknowledge")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
