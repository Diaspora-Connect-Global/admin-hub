import { useState } from "react";
import {
  useGetBroadcastCampaigns,
  useSendBroadcast,
  useListPushNotifications,
  useListInAppNotifications,
  useListNotificationTemplates,
  useGetNotificationAnalytics,
} from "@/hooks/admin";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Send,
  Megaphone,
  Search,
  MoreHorizontal,
  Plus,
  Eye,
  Copy,
  Smartphone,
  Mail,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Zap,
  Target,
  BarChart2,
} from "lucide-react";

const PIE_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e"];

export default function NotificationsBroadcasts() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [createBroadcastModal, setCreateBroadcastModal] = useState(false);
  const [createTemplateModal, setCreateTemplateModal] = useState(false);

  // Push tab filter state
  const [pushStatusFilter, setPushStatusFilter] = useState("all");

  // In-App tab filter state
  const [inAppPriorityFilter, setInAppPriorityFilter] = useState("all");

  // Templates tab filter state
  const [templateTypeFilter, setTemplateTypeFilter] = useState("all");
  const [templateStatusFilter, setTemplateStatusFilter] = useState("all");

  // Broadcast form state
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    targetAudience: "ALL_USERS" as "ALL_USERS" | "VENDORS" | "SPECIFIC_USERS",
  });

  // ─── Data hooks ───────────────────────────────────────────────────────────
  const {
    data: broadcastsData,
    loading: broadcastsLoading,
    refetch: refetchBroadcasts,
  } = useGetBroadcastCampaigns({ limit: 50 });
  const [sendBroadcastMutation, { loading: sendingBroadcast }] = useSendBroadcast();

  const { data: analyticsData, loading: analyticsLoading } =
    useGetNotificationAnalytics("last_7_days");

  const { data: pushData, loading: pushLoading } = useListPushNotifications({
    status: pushStatusFilter === "all" ? undefined : pushStatusFilter,
    limit: 50,
  });

  const { data: inAppData, loading: inAppLoading } = useListInAppNotifications({
    priority: inAppPriorityFilter === "all" ? undefined : inAppPriorityFilter,
    limit: 50,
  });

  const { data: templatesData, loading: templatesLoading } = useListNotificationTemplates({
    type: templateTypeFilter === "all" ? undefined : templateTypeFilter,
    status: templateStatusFilter === "all" ? undefined : templateStatusFilter,
    limit: 50,
  });

  // ─── Derived values ───────────────────────────────────────────────────────
  const liveBroadcasts = broadcastsData?.getBroadcastCampaigns?.campaigns ?? [];
  const sentCount = liveBroadcasts.filter(
    (b) => (b.status ?? "").toLowerCase() === "sent",
  ).length;
  const pendingCount = liveBroadcasts.filter((b) =>
    ["scheduled", "sending"].includes((b.status ?? "").toLowerCase()),
  ).length;

  const analytics = analyticsData?.getNotificationAnalytics;
  const volumeByDay = analytics?.volumeByDay ?? [];
  const deliveryRateByHour = analytics?.deliveryRateByHour ?? [];
  const typeDistribution = analytics?.typeDistribution ?? [];

  // Average delivery rate across all hours
  const avgDeliveryRate =
    deliveryRateByHour.length > 0
      ? (
          deliveryRateByHour.reduce((sum, h) => sum + h.deliveredPct, 0) /
          deliveryRateByHour.length
        ).toFixed(1)
      : null;

  const pushItems = pushData?.listPushNotifications?.items ?? [];
  const inAppItems = inAppData?.listInAppNotifications?.items ?? [];
  const templateItems = templatesData?.listNotificationTemplates?.items ?? [];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.body) return;
    try {
      await sendBroadcastMutation({ variables: { input: broadcastForm } });
      setCreateBroadcastModal(false);
      setBroadcastForm({ title: "", body: "", targetAudience: "ALL_USERS" });
      refetchBroadcasts();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "sent":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Delivered
          </Badge>
        );
      case "sending":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Sending</Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Scheduled</Badge>
        );
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Format hour label for the delivery rate chart (e.g. "14" → "14:00")
  const formatHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("notifications.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage push notifications, in-app alerts, and system-wide broadcasts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchBroadcasts()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateBroadcastModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Broadcast
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="push">Push</TabsTrigger>
            <TabsTrigger value="inapp">In-App</TabsTrigger>
            <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ───────── Dashboard Tab ───────────────────────────────────────── */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Broadcasts Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {broadcastsLoading ? "—" : sentCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Delivered campaigns</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {broadcastsLoading ? "—" : liveBroadcasts.length}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-amber-500/30 transition-colors border-amber-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">
                    {broadcastsLoading ? "—" : pendingCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Scheduled / sending</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">
                    {analyticsLoading
                      ? "—"
                      : avgDeliveryRate !== null
                      ? `${avgDeliveryRate}%`
                      : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg over 24 h</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Volume by Day — Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Volume (7 Days)</CardTitle>
                  <CardDescription>Notifications sent by channel</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
                    </div>
                  ) : volumeByDay.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground border border-dashed rounded-lg">
                      <BarChart2 className="h-8 w-8 opacity-40" />
                      <p className="text-sm">No volume data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={volumeByDay} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v: string) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                          labelStyle={{ color: "hsl(var(--foreground))", fontSize: 12 }}
                          itemStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="pushCount" name="Push" fill="#6366f1" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="inAppCount" name="In-App" fill="#22d3ee" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="emailCount" name="Email" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Rate by Hour — Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>Success rate over 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
                    </div>
                  ) : deliveryRateByHour.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground border border-dashed rounded-lg">
                      <TrendingUp className="h-8 w-8 opacity-40" />
                      <p className="text-sm">No delivery data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={deliveryRateByHour}
                        margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 11 }}
                          tickFormatter={formatHour}
                          interval={3}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          domain={[0, 100]}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                          labelStyle={{ color: "hsl(var(--foreground))", fontSize: 12 }}
                          labelFormatter={(v: number) => formatHour(v)}
                          itemStyle={{ fontSize: 12 }}
                          formatter={(value: number) => [`${value}%`]}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="deliveredPct"
                          name="Delivered %"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="failedPct"
                          name="Failed %"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="4 2"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Type Distribution Pie + Recent Broadcasts */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Type Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle>Type Distribution</CardTitle>
                  <CardDescription>Breakdown by notification type</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
                    </div>
                  ) : typeDistribution.length === 0 ||
                    typeDistribution.every((t) => t.count === 0) ? (
                    <div className="h-[250px] flex flex-col items-center justify-center gap-3 text-muted-foreground border border-dashed rounded-lg">
                      <BarChart2 className="h-8 w-8 opacity-40" />
                      <p className="text-sm">No distribution data</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={typeDistribution}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ type, percent }) =>
                            `${type} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {typeDistribution.map((_, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={PIE_COLORS[idx % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                          itemStyle={{ fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Recent Broadcasts */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Broadcasts</CardTitle>
                  <CardDescription>Latest system-wide announcements</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {broadcastsLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            Loading…
                          </TableCell>
                        </TableRow>
                      ) : liveBroadcasts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            No broadcasts yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        liveBroadcasts.slice(0, 5).map((broadcast) => (
                          <TableRow key={broadcast.id}>
                            <TableCell className="font-medium">{broadcast.title}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {broadcast.targetAudience ??
                                (broadcast as any).audience ??
                                "—"}
                            </TableCell>
                            <TableCell>
                              {(
                                broadcast.recipientCount ??
                                (broadcast as any).audienceCount ??
                                0
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((broadcast.status ?? "").toLowerCase())}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ───────── Push Notifications Tab ─────────────────────────────── */}
          <TabsContent value="push" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Push Notification History</CardTitle>
                <CardDescription>View and manage push notification delivery.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={pushStatusFilter} onValueChange={setPushStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="sending">Sending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pushLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          <RefreshCw className="inline h-4 w-4 animate-spin mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : pushItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No push notifications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pushItems
                        .filter((item) =>
                          searchQuery
                            ? item.title
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            : true,
                        )
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[80px]">
                              {item.id.slice(-8)}
                            </TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="text-muted-foreground capitalize">
                              {item.type}
                            </TableCell>
                            <TableCell>{item.recipientCount.toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {item.sentAt
                                ? new Date(item.sentAt).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.openRate != null
                                ? `${(item.openRate * 100).toFixed(1)}%`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── In-App Notifications Tab ───────────────────────────── */}
          <TabsContent value="inapp" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>In-App Notifications</CardTitle>
                  <CardDescription>
                    Manage banners, alerts, and tooltips shown within the app.
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Create Alert
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={inAppPriorityFilter}
                    onValueChange={setInAppPriorityFilter}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Target Audience</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inAppLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          <RefreshCw className="inline h-4 w-4 animate-spin mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : inAppItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No in-app notifications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      inAppItems
                        .filter((item) =>
                          searchQuery
                            ? item.title
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            : true,
                        )
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[80px]">
                              {item.id.slice(-8)}
                            </TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="text-muted-foreground capitalize">
                              {item.type}
                            </TableCell>
                            <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                            <TableCell className="text-muted-foreground capitalize">
                              {item.targetAudience.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>{item.viewCount.toLocaleString()}</TableCell>
                            <TableCell>
                              {item.active ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── Broadcasts Tab ─────────────────────────────────────── */}
          <TabsContent value="broadcasts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>System Broadcasts</CardTitle>
                  <CardDescription>
                    Send announcements to all users or specific segments.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setCreateBroadcastModal(true)}>
                  <Megaphone className="mr-2 h-4 w-4" /> New Broadcast
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search broadcasts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcastsLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          <RefreshCw className="inline h-4 w-4 animate-spin mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : liveBroadcasts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No broadcasts yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      liveBroadcasts
                        .filter((b) =>
                          searchQuery
                            ? b.title.toLowerCase().includes(searchQuery.toLowerCase())
                            : true,
                        )
                        .map((broadcast) => (
                          <TableRow key={broadcast.id}>
                            <TableCell className="font-medium">
                              {broadcast.title}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {broadcast.targetAudience ?? (broadcast as any).audience}
                            </TableCell>
                            <TableCell>
                              {(
                                broadcast.recipientCount ??
                                (broadcast as any).audienceCount ??
                                0
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((broadcast.status ?? "").toLowerCase())}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {broadcast.sentAt
                                ? new Date(broadcast.sentAt).toLocaleDateString()
                                : (broadcast as any).scheduledAt ?? "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── Templates Tab ──────────────────────────────────────── */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notification Templates</CardTitle>
                  <CardDescription>
                    Manage reusable notification templates with dynamic placeholders.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setCreateTemplateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Template
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={templateTypeFilter} onValueChange={setTemplateTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={templateStatusFilter}
                    onValueChange={setTemplateStatusFilter}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templatesLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          <RefreshCw className="inline h-4 w-4 animate-spin mr-2" /> Loading…
                        </TableCell>
                      </TableRow>
                    ) : templateItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No templates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      templateItems
                        .filter((item) =>
                          searchQuery
                            ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
                            : true,
                        )
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[80px]">
                              {item.id.slice(-8)}
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {item.type}
                            </TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {item.category}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {item.lastUpdatedAt
                                ? new Date(item.lastUpdatedAt).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>{item.usageCount.toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── Settings Tab ────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Push Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" /> Push Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure push notification delivery preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow system to send push notifications
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Silent Hours</Label>
                      <p className="text-sm text-muted-foreground">
                        Suppress non-urgent notifications at night
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Silent Hours Range</Label>
                    <div className="flex gap-2">
                      <Select defaultValue="22">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Start" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="flex items-center text-muted-foreground">to</span>
                      <Select defaultValue="7">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="End" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Rich Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Include images and action buttons
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Email Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" /> Email Notification Settings
                  </CardTitle>
                  <CardDescription>Configure email delivery and formatting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow system to send email notifications
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Sender Name</Label>
                    <Input defaultValue="SAdminDP Team" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reply-To Address</Label>
                    <Input defaultValue="support@sadmindp.com" type="email" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Footer</Label>
                      <p className="text-sm text-muted-foreground">
                        Include unsubscribe link and address
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" /> Rate Limiting
                  </CardTitle>
                  <CardDescription>Control notification frequency to prevent spam.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Max Push per User (Daily)</Label>
                    <Input type="number" defaultValue="20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Email per User (Daily)</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Interval Between Notifications</Label>
                    <Select defaultValue="5">
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Targeting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" /> Default Targeting
                  </CardTitle>
                  <CardDescription>Configure default audience segments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Broadcast Audience</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">Active Users (30 days)</SelectItem>
                        <SelectItem value="verified">Verified Users Only</SelectItem>
                        <SelectItem value="premium">Premium Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Respect User Preferences</Label>
                      <p className="text-sm text-muted-foreground">
                        Honor opt-out settings per category
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>A/B Testing</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable split testing for broadcasts
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Reset to Defaults</Button>
              <Button>Save Settings</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Broadcast Modal */}
      <Dialog open={createBroadcastModal} onOpenChange={setCreateBroadcastModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Broadcast</DialogTitle>
            <DialogDescription>Send a system-wide announcement to users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Enter broadcast title..."
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select
                value={broadcastForm.targetAudience}
                onValueChange={(v) =>
                  setBroadcastForm((f) => ({
                    ...f,
                    targetAudience: v as typeof f.targetAudience,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_USERS">All Users</SelectItem>
                  <SelectItem value="VENDORS">Vendors</SelectItem>
                  <SelectItem value="SPECIFIC_USERS">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea
                placeholder="Enter your broadcast message..."
                rows={5}
                value={broadcastForm.body}
                onChange={(e) => setBroadcastForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Channels</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch id="channel-push" defaultChecked />
                    <Label htmlFor="channel-push">Push Notification</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="channel-inapp" defaultChecked />
                    <Label htmlFor="channel-inapp">In-App Alert</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="channel-email" />
                    <Label htmlFor="channel-email">Email</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select defaultValue="now">
                  <SelectTrigger>
                    <SelectValue placeholder="When to send" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Immediately</SelectItem>
                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateBroadcastModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={sendingBroadcast || !broadcastForm.title || !broadcastForm.body}
              onClick={handleSendBroadcast}
            >
              {sendingBroadcast ? "Sending..." : "Send Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Modal */}
      <Dialog open={createTemplateModal} onOpenChange={setCreateTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Notification Template</DialogTitle>
            <DialogDescription>
              Create a reusable template with dynamic placeholders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="Enter template name..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title Template</Label>
              <Input placeholder="e.g., Hello {{user_name}}!" />
              <p className="text-xs text-muted-foreground">
                Use {"{{variable}}"} for dynamic content
              </p>
            </div>
            <div className="space-y-2">
              <Label>Body Template</Label>
              <Textarea placeholder="Enter template content..." rows={5} />
            </div>
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium mb-2">Available Placeholders:</p>
              <div className="flex flex-wrap gap-2">
                {["{{user_name}}", "{{user_email}}", "{{amount}}", "{{date}}", "{{link}}"].map(
                  (placeholder) => (
                    <Badge
                      key={placeholder}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                    >
                      {placeholder}
                    </Badge>
                  ),
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTemplateModal(false)}>
              Cancel
            </Button>
            <Button>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
