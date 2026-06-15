import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingState, ErrorState } from "@/components/common/StateViews";
import {
  Search,
  Download,
  RefreshCw,
  Calendar,
  Users,
  Layers,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  Activity,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  File,
  MessageSquare,
  Bell,
} from "lucide-react";
import {
  useAdminListEscrows,
  useAdminListDisputes,
  useGetSystemHealth,
  useGetPlatformAnalytics,
  useGetUsers,
  useGetAuditLogs,
  useGetVendorSalesAnalytics,
  useGetCommunityEngagementStats,
  useGetTopAssociations,
  useGetChatVolumeAnalytics,
  useGetNotificationAnalytics,
  useListCommunities,
  useDiscoverAssociations,
} from "@/hooks/admin";
import { UsersReportTab } from "@/components/reports/UsersReportTab";
import { CommunitiesReportTab } from "@/components/reports/CommunitiesReportTab";
import { VendorsReportTab } from "@/components/reports/VendorsReportTab";
import { EscrowReportTab } from "@/components/reports/EscrowReportTab";
import { DisputesReportTab } from "@/components/reports/DisputesReportTab";
import { SystemReportTab } from "@/components/reports/SystemReportTab";
import { ChatsReportTab } from "@/components/reports/ChatsReportTab";
import { NotificationsReportTab } from "@/components/reports/NotificationsReportTab";


const ESCROW_COLORS: Record<string, string> = {
  HELD: "hsl(var(--primary))",
  RELEASED: "hsl(142, 72%, 42%)",
  PENDING: "hsl(38, 92%, 50%)",
  DISPUTED: "hsl(var(--destructive))",
  FROZEN: "hsl(262, 83%, 58%)",
  REFUNDED: "hsl(200, 60%, 50%)",
};

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: "hsl(var(--primary))",
  UNDER_REVIEW: "hsl(38, 92%, 50%)",
  RESOLVED: "hsl(142, 72%, 42%)",
  CLOSED: "hsl(200, 60%, 50%)",
  ESCALATED: "hsl(var(--destructive))",
};

export default function Reports() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState("all");
  const [activeTab, setActiveTab] = useState("users");
  const [vendorPeriod, setVendorPeriod] = useState<string>("last_30_days");

  // ── Real data queries ─────────────────────────────────────────────────────
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useGetPlatformAnalytics("last_30_days");
  const { data: usersData, refetch: refetchUsers } = useGetUsers({ limit: 10, skip: false });
  const { data: escrowData, refetch: refetchEscrows } = useAdminListEscrows({ limit: 20 });
  const { data: disputeData, refetch: refetchDisputes } = useAdminListDisputes({ limit: 20 });
  const { data: healthData, refetch: refetchHealth } = useGetSystemHealth();
  const { data: auditData, refetch: refetchAudit } = useGetAuditLogs({ limit: 10 });
  const { data: vendorAnalyticsData, loading: vendorAnalyticsLoading, refetch: refetchVendorAnalytics } =
    useGetVendorSalesAnalytics(vendorPeriod);
  const [communityPeriod] = useState("last_30_days");
  const {
    data: communityEngagementData,
    loading: communityEngagementLoading,
    refetch: refetchCommunityEngagement,
  } = useGetCommunityEngagementStats(communityPeriod);
  const {
    data: topAssociationsData,
    loading: topAssociationsLoading,
    refetch: refetchTopAssociations,
  } = useGetTopAssociations(10);

  const [chatPeriod, setChatPeriod] = useState("last_7_days");
  const {
    data: chatAnalyticsData,
    loading: chatAnalyticsLoading,
    refetch: refetchChatAnalytics,
  } = useGetChatVolumeAnalytics(chatPeriod);

  const [notifPeriod] = useState("last_30_days");
  const {
    data: notifAnalyticsData,
    loading: notifLoading,
    refetch: refetchNotifAnalytics,
  } = useGetNotificationAnalytics(notifPeriod);

  const { data: communitiesData, loading: communitiesLoading, refetch: refetchCommunities } =
    useListCommunities({ limit: 50 });
  const { data: associationsDiscoverData, loading: associationsLoading, refetch: refetchAssociations } =
    useDiscoverAssociations({ limit: 50 });

  // ── Derived chart data ────────────────────────────────────────────────────
  const userGrowthData = useMemo(() => {
    return (analyticsData?.getPlatformAnalytics?.registrationsByDay ?? []).map((pt) => ({
      date: pt.date,
      newUsers: pt.value,
    }));
  }, [analyticsData]);

  const escrowStatusData = useMemo(() => {
    const escrows = escrowData?.adminListEscrows?.escrows ?? [];
    if (!escrows.length) return [];
    const counts: Record<string, number> = {};
    for (const e of escrows) counts[e.status] = (counts[e.status] || 0) + 1;
    const total = escrows.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: ESCROW_COLORS[name] ?? "hsl(var(--primary))",
    }));
  }, [escrowData]);

  const escrowSummary = useMemo(() => {
    const escrows = escrowData?.adminListEscrows?.escrows ?? [];
    const totalValue = escrows.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const pendingCount = escrows.filter((e) => e.status === "PENDING" || e.status === "HELD").length;
    const releasedCount = escrows.filter((e) => e.status === "RELEASED").length;
    const currency = escrows[0]?.currency ?? "USD";
    return { totalValue, pendingCount, releasedCount, currency };
  }, [escrowData]);

  const disputeStatusData = useMemo(() => {
    const disputes = disputeData?.adminListDisputes?.disputes ?? [];
    if (!disputes.length) return [];
    const counts: Record<string, number> = {};
    for (const d of disputes) counts[d.status] = (counts[d.status] || 0) + 1;
    const total = disputes.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: DISPUTE_STATUS_COLORS[name] ?? "hsl(var(--primary))",
    }));
  }, [disputeData]);

  const disputeSummary = useMemo(() => {
    const disputes = disputeData?.adminListDisputes?.disputes ?? [];
    const total = disputes.length;
    const open = disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW" || d.status === "ESCALATED").length;
    const resolved = disputes.filter((d) => d.status === "RESOLVED").length;
    const dismissed = disputes.filter((d) => d.status === "CLOSED").length;
    const resolutionRate = total > 0 ? Math.round(((resolved + dismissed) / total) * 100) : 0;
    const resolvedWithTime = disputes.filter(
      (d) => (d.status === "RESOLVED" || d.status === "CLOSED") && d.resolvedAt && d.createdAt
    );
    let avgResolutionDays: number | null = null;
    if (resolvedWithTime.length > 0) {
      const totalMs = resolvedWithTime.reduce((sum, d) => {
        return sum + (new Date(d.resolvedAt!).getTime() - new Date(d.createdAt).getTime());
      }, 0);
      avgResolutionDays = Math.round(totalMs / resolvedWithTime.length / (1000 * 60 * 60 * 24));
    }
    return { total, open, resolved, resolutionRate, avgResolutionDays };
  }, [disputeData]);

  const systemHealthPieData = useMemo(() => {
    const services = healthData?.getSystemHealth?.services ?? [];
    if (!services.length) return [];
    const healthy = services.filter((s) => s.status === "healthy").length;
    const down = services.length - healthy;
    const total = services.length;
    return [
      { name: "Healthy", value: Math.round((healthy / total) * 100), color: "hsl(142, 72%, 42%)" },
      { name: "Down", value: Math.round((down / total) * 100), color: "hsl(var(--destructive))" },
    ].filter((d) => d.value > 0);
  }, [healthData]);

  // Chat analytics derived data
  const chatVolumeByDay = useMemo(() => {
    return chatAnalyticsData?.getChatVolumeAnalytics?.byDay ?? [];
  }, [chatAnalyticsData]);

  const chatTypePieData = useMemo(() => {
    const analytics = chatAnalyticsData?.getChatVolumeAnalytics;
    if (!analytics) return [];
    const dm = analytics.dmCount ?? 0;
    const group = analytics.groupCount ?? 0;
    const total = dm + group;
    if (total === 0) return [];
    return [
      { name: "Direct Messages", value: Math.round((dm / total) * 100), color: "hsl(var(--primary))" },
      { name: "Group Chats", value: Math.round((group / total) * 100), color: "hsl(262, 83%, 58%)" },
    ];
  }, [chatAnalyticsData]);

  const topActiveChats = useMemo(() => {
    return chatAnalyticsData?.getChatVolumeAnalytics?.topActiveChats ?? [];
  }, [chatAnalyticsData]);

  // ── Notification analytics derived data ──────────────────────────────────
  const notifVolumeByDay = notifAnalyticsData?.getNotificationAnalytics?.volumeByDay ?? [];
  const notifTypeDistribution = notifAnalyticsData?.getNotificationAnalytics?.typeDistribution ?? [];
  const notifDeliveryByHour = notifAnalyticsData?.getNotificationAnalytics?.deliveryRateByHour ?? [];

  const notifTypePieData = notifTypeDistribution.map((entry, index) => {
    const NOTIF_COLORS = [
      "hsl(var(--primary))",
      "hsl(142, 72%, 42%)",
      "hsl(38, 92%, 50%)",
      "hsl(262, 83%, 58%)",
      "hsl(200, 60%, 50%)",
    ];
    return {
      name: entry.type,
      value: entry.count,
      color: NOTIF_COLORS[index % NOTIF_COLORS.length],
    };
  });

  const notifTopHours = [...notifDeliveryByHour]
    .sort((a, b) => (b.deliveredPct + b.failedPct) - (a.deliveredPct + a.failedPct))
    .slice(0, 10);

  function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    switch (activeTab) {
      case "users":
        downloadCSV(
          "users.csv",
          users.map((u: { id: string; displayName?: string; email: string; createdAt: string }) => ({
            id: u.id,
            displayName: u.displayName ?? "",
            email: u.email,
            createdAt: u.createdAt,
          }))
        );
        break;
      case "communities":
        downloadCSV(
          "top-associations.csv",
          (topAssociationsData?.getTopAssociations?.items ?? []).map((a) => ({
            associationId: a.associationId,
            associationName: a.associationName,
            communityName: a.communityName,
            posts: a.posts,
            opportunities: a.opportunities,
            vendors: a.vendors,
            reactions: a.reactions,
          }))
        );
        break;
      case "vendors":
        downloadCSV(
          "top-vendors.csv",
          topVendors.map((v) => ({
            vendorId: v.vendorId,
            vendorName: v.vendorName,
            productsSold: v.productsSold,
            revenue: v.revenue,
            currency: v.currency,
            rating: v.rating ?? "",
          }))
        );
        break;
      case "escrow":
        downloadCSV(
          "escrows.csv",
          escrows.map((e) => ({
            id: e.id,
            buyerId: e.buyerId ?? "",
            sellerId: e.sellerId ?? "",
            amount: e.amount ?? 0,
            currency: e.currency,
            status: e.status,
            createdAt: e.createdAt,
            releasedAt: e.releasedAt ?? "",
          }))
        );
        break;
      case "disputes":
        downloadCSV(
          "disputes.csv",
          disputes.map((d) => ({
            id: d.id,
            escrowId: d.escrowId ?? "",
            paymentIntentId: d.paymentIntentId ?? "",
            status: d.status,
            reason: d.reason ?? "",
            createdAt: d.createdAt,
            resolvedAt: d.resolvedAt ?? "",
          }))
        );
        break;
      case "system":
        downloadCSV(
          "services.csv",
          services.map((s) => ({
            service: s.service,
            status: s.status,
            latencyMs: s.latencyMs ?? "",
          }))
        );
        break;
      case "chats":
        downloadCSV(
          "active-chats.csv",
          topActiveChats.map((c) => ({
            chatId: c.chatId,
            chatName: c.chatName,
            chatType: c.chatType,
            memberCount: c.memberCount,
            messageCount: c.messageCount,
            lastActiveAt: c.lastActiveAt,
          }))
        );
        break;
      case "notifications":
        downloadCSV(
          "notification-volume.csv",
          notifVolumeByDay.map((n) => ({
            date: n.date,
            pushCount: n.pushCount,
            inAppCount: n.inAppCount,
            emailCount: n.emailCount,
          }))
        );
        break;
      default:
        break;
    }
  }

  function handleRefresh() {
    refetchAnalytics();
    refetchUsers();
    refetchEscrows();
    refetchDisputes();
    refetchHealth();
    refetchAudit();
    refetchVendorAnalytics();
    refetchCommunityEngagement();
    refetchTopAssociations();
    refetchChatAnalytics();
    refetchNotifAnalytics();
    refetchCommunities();
    refetchAssociations();
  }

  const escrows = [...(escrowData?.adminListEscrows?.escrows ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const disputes = [...(disputeData?.adminListDisputes?.disputes ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const users = usersData?.getUsers?.items ?? [];
  const auditItems = auditData?.getAuditLogs?.items ?? [];
  const services = healthData?.getSystemHealth?.services ?? [];

  // ── Sorted users (newest first, capped at 10) ─────────────────────────────
  const sortedUsers = [...users]
    .sort(
      (a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 10);

  // ── Communities & Associations lists (newest first) ───────────────────────
  const communities = [...(communitiesData?.listCommunities?.communities ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const associations: Array<{ id: string; name: string; description?: string }> =
    (
      associationsDiscoverData as
        | {
            discoverAssociations?: {
              associations?: Array<{ id: string; name: string; description?: string }>;
            };
          }
        | undefined
    )?.discoverAssociations?.associations ?? [];

  // ── Vendor analytics ──────────────────────────────────────────────────────
  const vendorSalesByDay = vendorAnalyticsData?.getVendorSalesAnalytics?.byDay ?? [];
  const topVendors = vendorAnalyticsData?.getVendorSalesAnalytics?.topVendors ?? [];
  const vendorTotalRevenue = vendorAnalyticsData?.getVendorSalesAnalytics?.totalRevenue ?? 0;
  const vendorTotalOrders = vendorAnalyticsData?.getVendorSalesAnalytics?.totalOrders ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('reports.title')}</h1>
            <p className="text-muted-foreground">
              Generate, view, and export detailed reports on platform activity and performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleExportCSV}>
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <File className="h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Top Bar Filters */}
        <div className="glass rounded-xl p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="user-activity">User Activity</SelectItem>
                  <SelectItem value="community-engagement">Community Engagement</SelectItem>
                  <SelectItem value="vendor-sales">Vendor Sales</SelectItem>
                  <SelectItem value="escrow">Escrow Transactions</SelectItem>
                  <SelectItem value="disputes">Disputes & Resolutions</SelectItem>
                  <SelectItem value="system-health">System Health</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Last 30 days
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Tabs */}
        {analyticsError && !analyticsData ? (
          <ErrorState onRetry={() => handleRefresh()} />
        ) : analyticsLoading && !analyticsData ? (
          <LoadingState rows={8} />
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass p-1 h-auto flex-wrap">
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              User Analytics
            </TabsTrigger>
            <TabsTrigger value="communities" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Layers className="h-4 w-4" />
              Community & Association
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingCart className="h-4 w-4" />
              Vendor & Marketplace
            </TabsTrigger>
            <TabsTrigger value="escrow" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Wallet className="h-4 w-4" />
              Escrow Analytics
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <AlertTriangle className="h-4 w-4" />
              Disputes Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="h-4 w-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
              Chat Analytics
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <UsersReportTab userGrowthData={userGrowthData} sortedUsers={sortedUsers} />

          <CommunitiesReportTab
            communityEngagementLoading={communityEngagementLoading}
            communityEngagementData={communityEngagementData}
            communities={communities}
            communitiesLoading={communitiesLoading}
            associations={associations}
            associationsLoading={associationsLoading}
          />

          <VendorsReportTab
            vendorPeriod={vendorPeriod}
            setVendorPeriod={setVendorPeriod}
            vendorTotalRevenue={vendorTotalRevenue}
            vendorTotalOrders={vendorTotalOrders}
            vendorAnalyticsLoading={vendorAnalyticsLoading}
            vendorSalesByDay={vendorSalesByDay}
            topVendors={topVendors}
          />

          <EscrowReportTab
            escrowSummary={escrowSummary}
            escrowStatusData={escrowStatusData}
            escrows={escrows}
          />

          <DisputesReportTab
            disputeSummary={disputeSummary}
            disputeStatusData={disputeStatusData}
            disputes={disputes}
          />

          <SystemReportTab
            systemHealthPieData={systemHealthPieData}
            services={services}
            auditItems={auditItems}
          />

          <ChatsReportTab
            chatPeriod={chatPeriod}
            setChatPeriod={setChatPeriod}
            chatAnalyticsLoading={chatAnalyticsLoading}
            chatAnalyticsData={chatAnalyticsData}
            chatVolumeByDay={chatVolumeByDay}
            chatTypePieData={chatTypePieData}
            topActiveChats={topActiveChats}
          />

          <NotificationsReportTab
            notifLoading={notifLoading}
            notifVolumeByDay={notifVolumeByDay}
            notifTypePieData={notifTypePieData}
            notifTopHours={notifTopHours}
          />
        </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
