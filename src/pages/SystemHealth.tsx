import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  HardDrive,
  Radio,
  Globe,
  Eye,
  FileText,
  Settings,
  Wallet,
  Activity,
  Cpu,
  MemoryStick,
  Zap,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Mock data
const serviceStatuses = [
  {
    name: "Application Services",
    status: "Healthy",
    icon: Server,
    metrics: [
      { label: "API Gateway", status: "Healthy", latency: "45ms" },
      { label: "Auth Service", status: "Healthy", latency: "32ms" },
      { label: "User Service", status: "Healthy", latency: "28ms" },
      { label: "Notification Service", status: "Warning", latency: "156ms" },
    ],
  },
  {
    name: "Database Health",
    status: "Healthy",
    icon: Database,
    metrics: [
      { label: "CPU Usage", value: "42%" },
      { label: "Memory Usage", value: "68%" },
      { label: "Connections", value: "124/500" },
      { label: "Query Latency", value: "12ms" },
    ],
  },
  {
    name: "Cache / Redis",
    status: "Healthy",
    icon: HardDrive,
    metrics: [
      { label: "Memory Usage", value: "3.2GB/8GB" },
      { label: "Hit Rate", value: "94.5%" },
      { label: "Evictions", value: "0" },
      { label: "Latency", value: "0.8ms" },
    ],
  },
  {
    name: "Message Queues",
    status: "Warning",
    icon: Radio,
    metrics: [
      { label: "Active Brokers", value: "3/3" },
      { label: "Lagging Partitions", value: "2" },
      { label: "Throughput", value: "1.2k/s" },
      { label: "Consumer Lag", value: "5,432" },
    ],
  },
  {
    name: "Third-Party APIs",
    status: "Healthy",
    icon: Globe,
    metrics: [
      { label: "Payment Gateway", status: "Healthy", latency: "89ms" },
      { label: "Email Service", status: "Healthy", latency: "45ms" },
      { label: "SMS Provider", status: "Healthy", latency: "62ms" },
      { label: "Analytics", status: "Healthy", latency: "34ms" },
    ],
  },
];

const criticalAlerts = [
  { id: "ALT-001", type: "High Memory Usage", component: "Database", severity: "Warning", timestamp: "2024-11-30 14:32", status: "Active" },
  { id: "ALT-002", type: "Consumer Lag", component: "Message Queue", severity: "Warning", timestamp: "2024-11-30 13:15", status: "Active" },
  { id: "ALT-003", type: "High Latency", component: "Notification Service", severity: "Warning", timestamp: "2024-11-30 12:45", status: "Acknowledged" },
];

const recentEvents = [
  { timestamp: "2024-11-30 14:32", component: "Database", type: "Warning", details: "Memory usage exceeded 65% threshold" },
  { timestamp: "2024-11-30 13:15", component: "Message Queue", type: "Warning", details: "Consumer lag detected on partition 3" },
  { timestamp: "2024-11-30 12:00", component: "API Gateway", type: "Info", details: "Auto-scaling triggered: 3 → 5 instances" },
  { timestamp: "2024-11-30 11:30", component: "Cache", type: "Info", details: "Cache warmed successfully after deployment" },
  { timestamp: "2024-11-30 10:15", component: "Auth Service", type: "Info", details: "SSL certificate renewed" },
];

const performanceData = [
  { time: "00:00", cpu: 35, memory: 62, requests: 1200 },
  { time: "04:00", cpu: 28, memory: 58, requests: 800 },
  { time: "08:00", cpu: 52, memory: 65, requests: 2400 },
  { time: "12:00", cpu: 68, memory: 72, requests: 3800 },
  { time: "16:00", cpu: 75, memory: 78, requests: 4200 },
  { time: "20:00", cpu: 58, memory: 70, requests: 2800 },
  { time: "Now", cpu: 42, memory: 68, requests: 1800 },
];

export default function SystemHealth() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [componentFilter, setComponentFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAcknowledgeModalOpen, setIsAcknowledgeModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<typeof criticalAlerts[0] | null>(null);
  const [acknowledgeNote, setAcknowledgeNote] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "Critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Healthy: "default",
      Warning: "secondary",
      Critical: "destructive",
      Offline: "destructive",
      Active: "destructive",
      Acknowledged: "outline",
    };
    const colors: Record<string, string> = {
      Healthy: "bg-green-600 hover:bg-green-600",
      Warning: "bg-yellow-500 hover:bg-yellow-500 text-black",
    };
    return (
      <Badge variant={variants[status]} className={colors[status] || ""}>
        {status}
      </Badge>
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Refreshed", description: "System health data updated." });
    }, 1500);
  };

  const handleAcknowledgeAlert = () => {
    toast({ title: "Alert Acknowledged", description: "The alert has been acknowledged." });
    setIsAcknowledgeModalOpen(false);
    setAcknowledgeNote("");
    setSelectedAlert(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('systemHealth.title')}</h1>
          <p className="text-muted-foreground">
            {t('systemHealth.serverStatus')}
          </p>
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
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={componentFilter} onValueChange={setComponentFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Component" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Components</SelectItem>
                <SelectItem value="Application">Application Services</SelectItem>
                <SelectItem value="Database">Database</SelectItem>
                <SelectItem value="Cache">Cache</SelectItem>
                <SelectItem value="Queue">Message Queue</SelectItem>
                <SelectItem value="API">Third-Party API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        </div>

        {/* Service Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serviceStatuses.map((service) => (
            <Card key={service.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <service.icon className="h-4 w-4 text-muted-foreground" />
                  {service.name}
                </CardTitle>
                {getStatusIcon(service.status)}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  {getStatusBadge(service.status)}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" /> Details
                  </Button>
                </div>
                <div className="space-y-2">
                  {service.metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">
                        {"status" in metric ? (
                          <span className={metric.status === "Healthy" ? "text-green-500" : "text-yellow-500"}>
                            {metric.status} ({metric.latency})
                          </span>
                        ) : (
                          metric.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Uptime Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Uptime (Last 30 Days)
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">99.97%</div>
              <p className="text-xs text-muted-foreground mt-1">+0.02% from last month</p>
              <Progress value={99.97} className="mt-3 h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Downtime: 13 minutes</span>
                <span>Incidents: 2</span>
              </div>
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
                {criticalAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.type}</TableCell>
                    <TableCell>{alert.component}</TableCell>
                    <TableCell>
                      <Badge variant={alert.severity === "Critical" ? "destructive" : "secondary"} className={alert.severity === "Warning" ? "bg-yellow-500 text-black" : ""}>
                        {alert.severity}
                      </Badge>
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
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Performance Trend
            </CardTitle>
            <CardDescription>CPU, Memory, and Request volume over the last 24 hours</CardDescription>
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
                  <Line type="monotone" dataKey="cpu" name="CPU %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="memory" name="Memory %" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="requests" name="Requests/min" stroke="#f59e0b" strokeWidth={2} dot={false} yAxisId={0} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent System Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Recent System Events
            </CardTitle>
            <CardDescription>Latest system logs and events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{event.timestamp}</TableCell>
                    <TableCell>{event.component}</TableCell>
                    <TableCell>
                      <Badge variant={event.type === "Warning" ? "secondary" : "outline"} className={event.type === "Warning" ? "bg-yellow-500 text-black" : ""}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{event.details}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
