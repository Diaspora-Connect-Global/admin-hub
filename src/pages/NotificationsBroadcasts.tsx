import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

const log = logger.child("NotificationsBroadcasts");

import {
  useGetBroadcastCampaigns,
  useSendBroadcast,
  useListPushNotifications,
  useListInAppNotifications,
  useListNotificationTemplates,
  useGetNotificationAnalytics,
  useCreateInAppNotification,
  useCreateNotificationTemplate,
  useGetPlatformSettings,
  useSetBatchPlatformSettings,
} from "@/hooks/admin";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

// ─── Settings keys + defaults (spec section A) ────────────────────────────────
const SETTINGS_DEFAULTS = {
  "notifications.push.enabled": "true",
  "notifications.silent_hours.enabled": "true",
  "notifications.silent_hours.start": "22",
  "notifications.silent_hours.end": "7",
  "notifications.rich.enabled": "true",
  "notifications.email.enabled": "true",
  "notifications.email.sender_name": "SAdminDP Team",
  "notifications.email.reply_to": "support@sadmindp.com",
  "notifications.email.footer_enabled": "true",
  "notifications.rate.max_push_daily": "20",
  "notifications.rate.max_email_daily": "5",
  "notifications.rate.min_interval_minutes": "5",
  "notifications.targeting.default_audience": "all",
  "notifications.targeting.respect_preferences": "true",
  "notifications.targeting.ab_testing": "false",
} as const;

type SettingsKey = keyof typeof SETTINGS_DEFAULTS;
type SettingsState = Record<SettingsKey, string>;

const CHANNEL_VALUES = ["PUSH", "IN_APP", "EMAIL"] as const;

type DetailRow = { label: string; value: string };

export default function NotificationsBroadcasts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Per-tab search state
  const [searchPush, setSearchPush] = useState("");
  const [searchInApp, setSearchInApp] = useState("");
  const [searchBroadcasts, setSearchBroadcasts] = useState("");
  const [searchTemplates, setSearchTemplates] = useState("");

  const [createBroadcastModal, setCreateBroadcastModal] = useState(false);
  const [createTemplateModal, setCreateTemplateModal] = useState(false);
  const [createInAppModal, setCreateInAppModal] = useState(false);

  // Read-only detail modal
  const [detailModal, setDetailModal] = useState<{ title: string; rows: DetailRow[] } | null>(null);

  // Push tab filter state
  const [pushStatusFilter, setPushStatusFilter] = useState("all");

  // In-App tab filter state
  const [inAppPriorityFilter, setInAppPriorityFilter] = useState("all");

  // Broadcasts tab filter state
  const [broadcastStatusFilter, setBroadcastStatusFilter] = useState("all");

  // Templates tab filter state
  const [templateTypeFilter, setTemplateTypeFilter] = useState("all");
  const [templateStatusFilter, setTemplateStatusFilter] = useState("all");

  // Broadcast form state
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    targetAudience: "ALL_USERS" as "ALL_USERS" | "VENDORS" | "SPECIFIC_USERS",
    channelPush: true,
    channelInApp: true,
    channelEmail: false,
    scheduleMode: "now" as "now" | "schedule",
    scheduledAt: "",
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "",
    category: "",
    titleTemplate: "",
    bodyTemplate: "",
  });

  // In-app alert form state
  const [inAppForm, setInAppForm] = useState({
    title: "",
    body: "",
    type: "alert",
    priority: "medium",
    targetAudience: "ALL_USERS",
    active: true,
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

  const {
    data: inAppData,
    loading: inAppLoading,
    refetch: refetchInApp,
  } = useListInAppNotifications({
    priority: inAppPriorityFilter === "all" ? undefined : inAppPriorityFilter,
    limit: 50,
  });

  const {
    data: templatesData,
    loading: templatesLoading,
    refetch: refetchTemplates,
  } = useListNotificationTemplates({
    type: templateTypeFilter === "all" ? undefined : templateTypeFilter,
    status: templateStatusFilter === "all" ? undefined : templateStatusFilter,
    limit: 50,
  });

  const [createInAppMutation, { loading: creatingInApp }] = useCreateInAppNotification();
  const [createTemplateMutation, { loading: creatingTemplate }] =
    useCreateNotificationTemplate();

  // ─── Settings (platform settings, category "notifications") ────────────────
  const { data: settingsData, loading: settingsLoading } =
    useGetPlatformSettings("notifications");
  const [setBatchSettings, { loading: savingSettings }] = useSetBatchPlatformSettings();
  const [settings, setSettings] = useState<SettingsState>({ ...SETTINGS_DEFAULTS });

  useEffect(() => {
    const rows = settingsData?.getPlatformSettings;
    if (!rows) return;
    const map = new Map(rows.map((r) => [r.key, r.value]));
    setSettings((prev) => {
      const next = { ...prev };
      (Object.keys(SETTINGS_DEFAULTS) as SettingsKey[]).forEach((key) => {
        const v = map.get(key);
        if (v != null) next[key] = v;
      });
      return next;
    });
  }, [settingsData]);

  const setSetting = (key: SettingsKey, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

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

  // Broadcasts filtered client-side by status filter (spec E.3)
  const filteredBroadcasts = liveBroadcasts.filter((b) =>
    broadcastStatusFilter === "all"
      ? true
      : (b.status ?? "").toLowerCase() === broadcastStatusFilter,
  );

  // ─── Form reset helpers ─────────────────────────────────────────────────────
  const resetBroadcastForm = () =>
    setBroadcastForm({
      title: "",
      body: "",
      targetAudience: "ALL_USERS",
      channelPush: true,
      channelInApp: true,
      channelEmail: false,
      scheduleMode: "now",
      scheduledAt: "",
    });

  const resetTemplateForm = () =>
    setTemplateForm({ name: "", type: "", category: "", titleTemplate: "", bodyTemplate: "" });

  const resetInAppForm = () =>
    setInAppForm({
      title: "",
      body: "",
      type: "alert",
      priority: "medium",
      targetAudience: "ALL_USERS",
      active: true,
    });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.body) return;
    const channels = CHANNEL_VALUES.filter((c) =>
      c === "PUSH"
        ? broadcastForm.channelPush
        : c === "IN_APP"
        ? broadcastForm.channelInApp
        : broadcastForm.channelEmail,
    );
    if (channels.length === 0) {
      toast({
        title: "Select at least one channel",
        description: "Enable Push, In-App, or Email before sending.",
        variant: "destructive",
      });
      return;
    }
    let scheduledAt: string | null = null;
    if (broadcastForm.scheduleMode === "schedule") {
      if (!broadcastForm.scheduledAt) {
        toast({
          title: "Schedule time required",
          description: "Pick a date & time for the scheduled broadcast.",
          variant: "destructive",
        });
        return;
      }
      scheduledAt = new Date(broadcastForm.scheduledAt).toISOString();
    }
    try {
      await sendBroadcastMutation({
        variables: {
          input: {
            title: broadcastForm.title,
            body: broadcastForm.body,
            targetAudience: broadcastForm.targetAudience,
            channels,
            scheduledAt,
          },
        },
      });
      setCreateBroadcastModal(false);
      resetBroadcastForm();
      refetchBroadcasts();
      toast({
        title: scheduledAt ? "Broadcast scheduled" : "Broadcast sent",
        description: broadcastForm.title,
      });
    } catch (e) {
      log.error("Failed to send broadcast", { message: (e as Error).message });
      toast({
        title: "Failed to send broadcast",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.type || !templateForm.bodyTemplate) {
      toast({
        title: "Missing required fields",
        description: "Name, type and body template are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createTemplateMutation({
        variables: {
          input: {
            name: templateForm.name,
            type: templateForm.type,
            category: templateForm.category,
            titleTemplate: templateForm.titleTemplate || undefined,
            bodyTemplate: templateForm.bodyTemplate,
          },
        },
      });
      setCreateTemplateModal(false);
      resetTemplateForm();
      refetchTemplates();
      toast({ title: "Template created", description: templateForm.name });
    } catch (e) {
      log.error("Failed to create template", { message: (e as Error).message });
      toast({
        title: "Failed to create template",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleCreateInApp = async () => {
    if (!inAppForm.title || !inAppForm.body) {
      toast({
        title: "Missing required fields",
        description: "Title and body are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createInAppMutation({
        variables: {
          input: {
            title: inAppForm.title,
            body: inAppForm.body,
            type: inAppForm.type,
            priority: inAppForm.priority,
            targetAudience: inAppForm.targetAudience,
            active: inAppForm.active,
          },
        },
      });
      setCreateInAppModal(false);
      resetInAppForm();
      refetchInApp();
      toast({ title: "Alert created", description: inAppForm.title });
    } catch (e) {
      log.error("Failed to create in-app alert", { message: (e as Error).message });
      toast({
        title: "Failed to create alert",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      const input = {
        settings: (Object.keys(settings) as SettingsKey[]).map((key) => ({
          key,
          value: settings[key],
        })),
      };
      await setBatchSettings({ variables: { input } });
      toast({ title: "Settings saved", description: "Notification settings updated." });
    } catch (e) {
      log.error("Failed to save settings", { message: (e as Error).message });
      toast({
        title: "Failed to save settings",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleResetSettings = () => {
    setSettings({ ...SETTINGS_DEFAULTS });
    toast({
      title: "Reset to defaults",
      description: "Unsaved. Click Save Settings to persist.",
    });
  };

  // Duplicate helpers: prefill the relevant create modal and open it.
  const duplicateBroadcast = (b: (typeof liveBroadcasts)[number]) => {
    const chans = b.channels ?? ["PUSH", "IN_APP"];
    setBroadcastForm({
      title: b.title,
      body: b.body ?? "",
      targetAudience:
        (b.targetAudience as "ALL_USERS" | "VENDORS" | "SPECIFIC_USERS") ?? "ALL_USERS",
      channelPush: chans.includes("PUSH"),
      channelInApp: chans.includes("IN_APP"),
      channelEmail: chans.includes("EMAIL"),
      scheduleMode: "now",
      scheduledAt: "",
    });
    setCreateBroadcastModal(true);
  };

  const duplicateTemplate = (tpl: (typeof templateItems)[number]) => {
    setTemplateForm({
      name: `${tpl.name} (copy)`,
      type: tpl.type,
      category: tpl.category,
      titleTemplate: "",
      bodyTemplate: "",
    });
    setCreateTemplateModal(true);
  };

  const duplicateInApp = (item: (typeof inAppItems)[number]) => {
    setInAppForm({
      title: `${item.title} (copy)`,
      body: "",
      type: item.type,
      priority: item.priority,
      targetAudience: item.targetAudience,
      active: item.active,
    });
    setCreateInAppModal(true);
  };

  const openDetail = (title: string, rows: DetailRow[]) =>
    setDetailModal({ title, rows });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "sent":
        return <StatusBadge variant="active">Delivered</StatusBadge>;
      case "sending":
        return <StatusBadge variant="info">Sending</StatusBadge>;
      case "scheduled":
        return <StatusBadge variant="warning">Scheduled</StatusBadge>;
      case "draft":
        return <StatusBadge variant="inactive">Draft</StatusBadge>;
      case "failed":
        return <StatusBadge variant="error">Failed</StatusBadge>;
      case "active":
        return <StatusBadge variant="active">Active</StatusBadge>;
      case "inactive":
        return <StatusBadge variant="inactive">Inactive</StatusBadge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return <StatusBadge variant="error">Critical</StatusBadge>;
      case "high":
        return <StatusBadge variant="warning">High</StatusBadge>;
      case "medium":
        return <StatusBadge variant="warning">Medium</StatusBadge>;
      case "low":
        return <StatusBadge variant="inactive">Low</StatusBadge>;
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
              <Card
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setActiveTab("broadcasts")}
              >
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

              <Card
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setActiveTab("broadcasts")}
              >
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

              <Card
                className="cursor-pointer hover:border-warning/30 transition-colors border-warning/20"
                onClick={() => setActiveTab("broadcasts")}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {broadcastsLoading ? "—" : pendingCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Scheduled / sending</p>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
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
                  <div className="overflow-x-auto">
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
                              {broadcast.targetAudience ?? "—"}
                            </TableCell>
                            <TableCell>
                              {(broadcast.recipientCount ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((broadcast.status ?? "").toLowerCase())}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
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
                      value={searchPush}
                      onChange={(e) => setSearchPush(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={pushStatusFilter} onValueChange={setPushStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="sending">Sending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
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
                          searchPush
                            ? item.title
                                .toLowerCase()
                                .includes(searchPush.toLowerCase())
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
                                  <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openDetail("Push Notification", [
                                        { label: "ID", value: item.id },
                                        { label: "Title", value: item.title },
                                        { label: "Type", value: item.type },
                                        {
                                          label: "Recipients",
                                          value: item.recipientCount.toLocaleString(),
                                        },
                                        { label: "Status", value: item.status },
                                        {
                                          label: "Sent At",
                                          value: item.sentAt
                                            ? new Date(item.sentAt).toLocaleString()
                                            : "—",
                                        },
                                        {
                                          label: "Open Rate",
                                          value:
                                            item.openRate != null
                                              ? `${(item.openRate * 100).toFixed(1)}%`
                                              : "—",
                                        },
                                      ])
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                </div>
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
                <Button
                  size="sm"
                  onClick={() => {
                    resetInAppForm();
                    setCreateInAppModal(true);
                  }}
                >
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
                      value={searchInApp}
                      onChange={(e) => setSearchInApp(e.target.value)}
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
                <div className="overflow-x-auto">
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
                          searchInApp
                            ? item.title
                                .toLowerCase()
                                .includes(searchInApp.toLowerCase())
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
                              {(item.targetAudience ?? "—").replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>{item.viewCount.toLocaleString()}</TableCell>
                            <TableCell>
                              {item.active ? (
                                <StatusBadge variant="active">Active</StatusBadge>
                              ) : (
                                <StatusBadge variant="inactive">Inactive</StatusBadge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openDetail("In-App Notification", [
                                        { label: "ID", value: item.id },
                                        { label: "Title", value: item.title },
                                        { label: "Type", value: item.type },
                                        { label: "Priority", value: item.priority },
                                        {
                                          label: "Target Audience",
                                          value: (item.targetAudience ?? "—").replace(/_/g, " "),
                                        },
                                        { label: "Views", value: item.viewCount.toLocaleString() },
                                        { label: "Active", value: item.active ? "Yes" : "No" },
                                        {
                                          label: "Created At",
                                          value: item.createdAt
                                            ? new Date(item.createdAt).toLocaleString()
                                            : "—",
                                        },
                                      ])
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateInApp(item)}>
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
                </div>
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
                      value={searchBroadcasts}
                      onChange={(e) => setSearchBroadcasts(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={broadcastStatusFilter}
                    onValueChange={setBroadcastStatusFilter}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
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
                    ) : filteredBroadcasts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No broadcasts yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBroadcasts
                        .filter((b) =>
                          searchBroadcasts
                            ? b.title.toLowerCase().includes(searchBroadcasts.toLowerCase())
                            : true,
                        )
                        .map((broadcast) => (
                          <TableRow key={broadcast.id}>
                            <TableCell className="font-medium">
                              {broadcast.title}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {broadcast.targetAudience}
                            </TableCell>
                            <TableCell>
                              {(broadcast.recipientCount ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((broadcast.status ?? "").toLowerCase())}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {broadcast.sentAt
                                ? new Date(broadcast.sentAt).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openDetail("Broadcast", [
                                        { label: "ID", value: broadcast.id },
                                        { label: "Title", value: broadcast.title },
                                        { label: "Message", value: broadcast.body ?? "—" },
                                        {
                                          label: "Audience",
                                          value: broadcast.targetAudience ?? "—",
                                        },
                                        {
                                          label: "Recipients",
                                          value: (broadcast.recipientCount ?? 0).toLocaleString(),
                                        },
                                        { label: "Status", value: broadcast.status ?? "—" },
                                        {
                                          label: "Channels",
                                          value:
                                            broadcast.channels && broadcast.channels.length > 0
                                              ? broadcast.channels.join(", ")
                                              : "—",
                                        },
                                        {
                                          label: "Scheduled At",
                                          value: broadcast.scheduledAt
                                            ? new Date(broadcast.scheduledAt).toLocaleString()
                                            : "—",
                                        },
                                        {
                                          label: "Sent At",
                                          value: broadcast.sentAt
                                            ? new Date(broadcast.sentAt).toLocaleString()
                                            : "—",
                                        },
                                      ])
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateBroadcast(broadcast)}>
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
                </div>
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
                      value={searchTemplates}
                      onChange={(e) => setSearchTemplates(e.target.value)}
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
                <div className="overflow-x-auto">
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
                          searchTemplates
                            ? item.name.toLowerCase().includes(searchTemplates.toLowerCase())
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
                                  <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openDetail("Notification Template", [
                                        { label: "ID", value: item.id },
                                        { label: "Name", value: item.name },
                                        { label: "Type", value: item.type },
                                        { label: "Category", value: item.category },
                                        {
                                          label: "Usage Count",
                                          value: item.usageCount.toLocaleString(),
                                        },
                                        { label: "Status", value: item.status },
                                        {
                                          label: "Last Updated",
                                          value: item.lastUpdatedAt
                                            ? new Date(item.lastUpdatedAt).toLocaleString()
                                            : "—",
                                        },
                                      ])
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => duplicateTemplate(item)}>
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
                </div>
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
                    <Switch
                      checked={settings["notifications.push.enabled"] === "true"}
                      onCheckedChange={(v) =>
                        setSetting("notifications.push.enabled", v ? "true" : "false")
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Silent Hours</Label>
                      <p className="text-sm text-muted-foreground">
                        Suppress non-urgent notifications at night
                      </p>
                    </div>
                    <Switch
                      checked={settings["notifications.silent_hours.enabled"] === "true"}
                      onCheckedChange={(v) =>
                        setSetting("notifications.silent_hours.enabled", v ? "true" : "false")
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Silent Hours Range</Label>
                    <div className="flex gap-2">
                      <Select
                        value={settings["notifications.silent_hours.start"]}
                        onValueChange={(v) => setSetting("notifications.silent_hours.start", v)}
                      >
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
                      <Select
                        value={settings["notifications.silent_hours.end"]}
                        onValueChange={(v) => setSetting("notifications.silent_hours.end", v)}
                      >
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
                    <Switch
                      checked={settings["notifications.rich.enabled"] === "true"}
                      onCheckedChange={(v) =>
                        setSetting("notifications.rich.enabled", v ? "true" : "false")
                      }
                    />
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
                    <Switch
                      checked={settings["notifications.email.enabled"] === "true"}
                      onCheckedChange={(v) =>
                        setSetting("notifications.email.enabled", v ? "true" : "false")
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Sender Name</Label>
                    <Input
                      value={settings["notifications.email.sender_name"]}
                      onChange={(e) =>
                        setSetting("notifications.email.sender_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reply-To Address</Label>
                    <Input
                      type="email"
                      value={settings["notifications.email.reply_to"]}
                      onChange={(e) =>
                        setSetting("notifications.email.reply_to", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Footer</Label>
                      <p className="text-sm text-muted-foreground">
                        Include unsubscribe link and address
                      </p>
                    </div>
                    <Switch
                      checked={settings["notifications.email.footer_enabled"] === "true"}
                      onCheckedChange={(v) =>
                        setSetting("notifications.email.footer_enabled", v ? "true" : "false")
                      }
                    />
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
                    <Input
                      type="number"
                      value={settings["notifications.rate.max_push_daily"]}
                      onChange={(e) =>
                        setSetting("notifications.rate.max_push_daily", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Email per User (Daily)</Label>
                    <Input
                      type="number"
                      value={settings["notifications.rate.max_email_daily"]}
                      onChange={(e) =>
                        setSetting("notifications.rate.max_email_daily", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Interval Between Notifications</Label>
                    <Select
                      value={settings["notifications.rate.min_interval_minutes"]}
                      onValueChange={(v) =>
                        setSetting("notifications.rate.min_interval_minutes", v)
                      }
                    >
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
                    <Select
                      value={settings["notifications.targeting.default_audience"]}
                      onValueChange={(v) =>
                        setSetting("notifications.targeting.default_audience", v)
                      }
                    >
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
                    <Switch
                      checked={
                        settings["notifications.targeting.respect_preferences"] === "true"
                      }
                      onCheckedChange={(v) =>
                        setSetting(
                          "notifications.targeting.respect_preferences",
                          v ? "true" : "false",
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>A/B Testing</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable split testing for broadcasts
                      </p>
                    </div>
                    <Switch
                      checked={settings["notifications.targeting.ab_testing"] === "true"}
                      onCheckedChange={(v) =>
                        setSetting("notifications.targeting.ab_testing", v ? "true" : "false")
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleResetSettings}
                disabled={savingSettings || settingsLoading}
              >
                Reset to Defaults
              </Button>
              <Button onClick={handleSaveSettings} disabled={savingSettings || settingsLoading}>
                {savingSettings ? "Saving..." : "Save Settings"}
              </Button>
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
                    <Switch
                      id="channel-push"
                      checked={broadcastForm.channelPush}
                      onCheckedChange={(v) =>
                        setBroadcastForm((f) => ({ ...f, channelPush: v }))
                      }
                    />
                    <Label htmlFor="channel-push">Push Notification</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="channel-inapp"
                      checked={broadcastForm.channelInApp}
                      onCheckedChange={(v) =>
                        setBroadcastForm((f) => ({ ...f, channelInApp: v }))
                      }
                    />
                    <Label htmlFor="channel-inapp">In-App Alert</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="channel-email"
                      checked={broadcastForm.channelEmail}
                      onCheckedChange={(v) =>
                        setBroadcastForm((f) => ({ ...f, channelEmail: v }))
                      }
                    />
                    <Label htmlFor="channel-email">Email</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select
                  value={broadcastForm.scheduleMode}
                  onValueChange={(v) =>
                    setBroadcastForm((f) => ({
                      ...f,
                      scheduleMode: v as "now" | "schedule",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="When to send" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Immediately</SelectItem>
                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                  </SelectContent>
                </Select>
                {broadcastForm.scheduleMode === "schedule" && (
                  <Input
                    type="datetime-local"
                    value={broadcastForm.scheduledAt}
                    onChange={(e) =>
                      setBroadcastForm((f) => ({ ...f, scheduledAt: e.target.value }))
                    }
                  />
                )}
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
              {sendingBroadcast
                ? "Sending..."
                : broadcastForm.scheduleMode === "schedule"
                ? "Schedule Broadcast"
                : "Send Broadcast"}
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
              <Input
                placeholder="Enter template name..."
                value={templateForm.name}
                onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(v) => setTemplateForm((f) => ({ ...f, type: v }))}
                >
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
                <Select
                  value={templateForm.category}
                  onValueChange={(v) => setTemplateForm((f) => ({ ...f, category: v }))}
                >
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
              <Input
                placeholder="e.g., Hello {{user_name}}!"
                value={templateForm.titleTemplate}
                onChange={(e) =>
                  setTemplateForm((f) => ({ ...f, titleTemplate: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{variable}}"} for dynamic content
              </p>
            </div>
            <div className="space-y-2">
              <Label>Body Template</Label>
              <Textarea
                placeholder="Enter template content..."
                rows={5}
                value={templateForm.bodyTemplate}
                onChange={(e) =>
                  setTemplateForm((f) => ({ ...f, bodyTemplate: e.target.value }))
                }
              />
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
                      onClick={() =>
                        setTemplateForm((f) => ({
                          ...f,
                          bodyTemplate: `${f.bodyTemplate}${placeholder}`,
                        }))
                      }
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
            <Button
              onClick={handleCreateTemplate}
              disabled={
                creatingTemplate ||
                !templateForm.name ||
                !templateForm.type ||
                !templateForm.bodyTemplate
              }
            >
              {creatingTemplate ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create In-App Alert Modal */}
      <Dialog open={createInAppModal} onOpenChange={setCreateInAppModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create In-App Alert</DialogTitle>
            <DialogDescription>
              Create a banner, alert, or tooltip shown within the app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Enter alert title..."
                value={inAppForm.title}
                onChange={(e) => setInAppForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                placeholder="Enter alert body..."
                rows={4}
                value={inAppForm.body}
                onChange={(e) => setInAppForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={inAppForm.type}
                  onValueChange={(v) => setInAppForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="tooltip">Tooltip</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={inAppForm.priority}
                  onValueChange={(v) => setInAppForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={inAppForm.targetAudience}
                  onValueChange={(v) => setInAppForm((f) => ({ ...f, targetAudience: v }))}
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
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="inapp-active">Active</Label>
                <Switch
                  id="inapp-active"
                  checked={inAppForm.active}
                  onCheckedChange={(v) => setInAppForm((f) => ({ ...f, active: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateInAppModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInApp}
              disabled={creatingInApp || !inAppForm.title || !inAppForm.body}
            >
              {creatingInApp ? "Creating..." : "Create Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Read-only Detail Modal */}
      <Dialog open={detailModal !== null} onOpenChange={(open) => !open && setDetailModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailModal?.title ?? "Details"}</DialogTitle>
            <DialogDescription>Read-only detail view.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {detailModal?.rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-3 gap-2 border-b pb-2 last:border-0"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {row.label}
                </span>
                <span className="col-span-2 text-sm break-words">{row.value}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
