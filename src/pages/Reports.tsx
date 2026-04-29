import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
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
  Eye,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  File,
  MessageSquare,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
} from "@/hooks/admin";


const statusConfig: Record<string, { label: string; className: string }> = {
  // Escrow statuses
  PENDING: { label: "Pending", className: "bg-warning/20 text-warning border-warning/30" },
  HELD: { label: "Held", className: "bg-primary/20 text-primary border-primary/30" },
  RELEASED: { label: "Released", className: "bg-success/20 text-success border-success/30" },
  REFUNDED: { label: "Refunded", className: "bg-muted text-muted-foreground border-border" },
  FROZEN: { label: "Frozen", className: "bg-destructive/20 text-destructive border-destructive/30" },
  DISPUTED: { label: "Disputed", className: "bg-destructive/20 text-destructive border-destructive/30" },
  // Dispute statuses
  OPEN: { label: "Open", className: "bg-primary/20 text-primary border-primary/30" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-warning/20 text-warning border-warning/30" },
  RESOLVED: { label: "Resolved", className: "bg-success/20 text-success border-success/30" },
  CLOSED: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
  ESCALATED: { label: "Escalated", className: "bg-destructive/20 text-destructive border-destructive/30" },
  // Service health
  healthy: { label: "Healthy", className: "bg-success/20 text-success border-success/30" },
  down: { label: "Down", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

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

function formatAmount(amount: number, currency?: string) {
  return `${currency ?? "USD"} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function truncateId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export default function Reports() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState("all");
  const [activeTab, setActiveTab] = useState("users");
  const [vendorPeriod, setVendorPeriod] = useState<string>("last_30_days");

  // ── Real data queries ─────────────────────────────────────────────────────
  const { data: analyticsData, refetch: refetchAnalytics } = useGetPlatformAnalytics("last_30_days");
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

  const [chatPeriod] = useState("last_7_days");
  const {
    data: chatAnalyticsData,
    loading: chatAnalyticsLoading,
    refetch: refetchChatAnalytics,
  } = useGetChatVolumeAnalytics(chatPeriod);

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
  }

  const escrows = escrowData?.adminListEscrows?.escrows ?? [];
  const disputes = disputeData?.adminListDisputes?.disputes ?? [];
  const users = usersData?.getUsers?.items ?? [];
  const auditItems = auditData?.getAuditLogs?.items ?? [];
  const services = healthData?.getSystemHealth?.services ?? [];

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
                <DropdownMenuItem className="gap-2 cursor-pointer">
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
          </TabsList>

          {/* User Analytics Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">User Registrations Over Time</h3>
                <p className="text-sm text-muted-foreground">New user registrations per day (last 30 days)</p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--primary))" strokeWidth={2} name="New Users" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Recent Users</h3>
                <p className="text-sm text-muted-foreground">Latest registered accounts on the platform</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>User ID</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: { id: string; email: string; displayName?: string; createdAt: string }) => (
                      <TableRow key={user.id} className="border-border/50">
                        <TableCell className="font-mono text-sm">{truncateId(user.id)}</TableCell>
                        <TableCell className="font-medium">{user.displayName ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Community & Association Tab */}
          <TabsContent value="communities" className="space-y-6">
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Posts &amp; Reactions Over Time</h3>
                <p className="text-sm text-muted-foreground">
                  Daily posts and reactions across all communities (last 30 days)
                </p>
              </div>
              <div className="h-[300px]">
                {communityEngagementLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                ) : (
                  communityEngagementData?.getCommunityEngagementStatsFull?.byDay ?? []
                ).length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No engagement data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={communityEngagementData!.getCommunityEngagementStatsFull.byDay}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="posts"
                        fill="hsl(var(--primary))"
                        name="Posts"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="reactions"
                        fill="hsl(142, 72%, 42%)"
                        name="Reactions"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Top Performing Associations</h3>
                <p className="text-sm text-muted-foreground">
                  Associations with highest activity across posts, opportunities, vendors, and
                  reactions
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Association Name</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Opportunities</TableHead>
                    <TableHead>Vendors</TableHead>
                    <TableHead>Reactions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAssociationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (topAssociationsData?.getTopAssociations?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No association data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topAssociationsData!.getTopAssociations.items.map((assoc) => (
                      <TableRow key={assoc.associationId} className="border-border/50">
                        <TableCell className="font-medium">{assoc.associationName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {assoc.communityName}
                        </TableCell>
                        <TableCell>{assoc.posts.toLocaleString()}</TableCell>
                        <TableCell>{assoc.opportunities.toLocaleString()}</TableCell>
                        <TableCell>{assoc.vendors.toLocaleString()}</TableCell>
                        <TableCell>{assoc.reactions.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Vendor & Marketplace Tab */}
          <TabsContent value="vendors" className="space-y-6">
            {/* Period selector + summary row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Select value={vendorPeriod} onValueChange={setVendorPeriod}>
                  <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 days</SelectItem>
                    <SelectItem value="last_365_days">Last 365 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">
                  Total Revenue:{" "}
                  <span className="font-semibold text-foreground">
                    {formatAmount(vendorTotalRevenue)}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Total Orders:{" "}
                  <span className="font-semibold text-foreground">
                    {vendorTotalOrders.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>

            {/* Sales Over Time chart */}
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Vendor Sales Over Time</h3>
                <p className="text-sm text-muted-foreground">Daily sales revenue across all vendors</p>
              </div>
              <div className="h-[300px]">
                {vendorAnalyticsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Loading…</p>
                  </div>
                ) : vendorSalesByDay.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      No sales data available for this period
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vendorSalesByDay}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) =>
                          name === "sales"
                            ? [formatAmount(value), "Revenue"]
                            : [value.toLocaleString(), "Orders"]
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Revenue"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="hsl(142, 72%, 42%)"
                        strokeWidth={2}
                        name="Orders"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Selling Vendors table */}
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Top Selling Vendors</h3>
                <p className="text-sm text-muted-foreground">
                  Vendors with highest revenue for the selected period
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Products Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorAnalyticsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : topVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No vendor data available for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    topVendors.map((v) => (
                      <TableRow key={v.vendorId} className="border-border/50">
                        <TableCell className="font-medium">{v.vendorName}</TableCell>
                        <TableCell>{v.productsSold.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(v.revenue, v.currency)}
                        </TableCell>
                        <TableCell>
                          {v.rating != null ? (
                            <span className="text-sm">{v.rating.toFixed(1)} / 5.0</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Escrow Analytics Tab */}
          <TabsContent value="escrow" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Escrow Transactions by Status</h3>
                  <p className="text-sm text-muted-foreground">Distribution of transaction statuses</p>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={escrowStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {escrowStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [`${value}%`, ""]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        formatter={(value) => <span className="text-muted-foreground text-sm">{statusConfig[value]?.label ?? value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Escrow Summary</h3>
                  <p className="text-sm text-muted-foreground">Key escrow metrics</p>
                </div>
                <div className="space-y-4">
                  {escrowStatusData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No escrow data available</p>
                  ) : (
                    escrowStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium">{statusConfig[item.name]?.label ?? item.name}</span>
                        </div>
                        <span className="text-lg font-bold">{item.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Recent Escrow Transactions</h3>
                <p className="text-sm text-muted-foreground">Latest transactions on the platform</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Payment Intent</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escrows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No escrow transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    escrows.map((e) => (
                      <TableRow key={e.id} className="border-border/50">
                        <TableCell className="font-mono text-sm">{truncateId(e.id)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {e.paymentIntentId ? truncateId(e.paymentIntentId) : "—"}
                        </TableCell>
                        <TableCell className="font-semibold">{formatAmount(e.totalAmount, e.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig[e.status]?.className}>
                            {statusConfig[e.status]?.label ?? e.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Disputes Analytics Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Disputes by Status</h3>
                  <p className="text-sm text-muted-foreground">Distribution of dispute statuses</p>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disputeStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {disputeStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [`${value}%`, ""]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        formatter={(value) => <span className="text-muted-foreground text-sm">{statusConfig[value]?.label ?? value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Dispute Summary</h3>
                  <p className="text-sm text-muted-foreground">Breakdown by status</p>
                </div>
                <div className="space-y-4">
                  {disputeStatusData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No dispute data available</p>
                  ) : (
                    disputeStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium">{statusConfig[item.name]?.label ?? item.name}</span>
                        </div>
                        <span className="text-lg font-bold">{item.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Recent Disputes</h3>
                <p className="text-sm text-muted-foreground">Latest disputes on the platform</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Escrow ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No disputes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    disputes.map((d) => (
                      <TableRow key={d.id} className="border-border/50">
                        <TableCell className="font-mono text-sm">{truncateId(d.id)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {d.escrowId ? truncateId(d.escrowId) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig[d.status]?.className}>
                            {statusConfig[d.status]?.label ?? d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">
                          {d.reason ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {d.raisedBy ? truncateId(d.raisedBy) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Service Status Overview</h3>
                  <p className="text-sm text-muted-foreground">Percentage of services by health state</p>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={systemHealthPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {systemHealthPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [`${value}%`, ""]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Health Summary</h3>
                  <p className="text-sm text-muted-foreground">Service status breakdown</p>
                </div>
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No service data available</p>
                  ) : (
                    services.map((svc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: svc.status === "healthy" ? "hsl(142, 72%, 42%)" : "hsl(var(--destructive))" }}
                          />
                          <span className="text-sm font-medium capitalize">{svc.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {svc.latencyMs != null && (
                            <span className="text-xs text-muted-foreground">{svc.latencyMs}ms</span>
                          )}
                          <Badge variant="outline" className={statusConfig[svc.status]?.className}>
                            {statusConfig[svc.status]?.label ?? svc.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Recent Audit Events</h3>
                <p className="text-sm text-muted-foreground">Latest admin actions and system events</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Event ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource Type</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No audit events found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditItems.map((ev: { id: string; actorId?: string; action: string; resourceType?: string; resourceId?: string; createdAt: string }) => (
                      <TableRow key={ev.id} className="border-border/50">
                        <TableCell className="font-mono text-sm">{truncateId(ev.id)}</TableCell>
                        <TableCell className="font-mono text-sm">{ev.actorId ? truncateId(ev.actorId) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                            {ev.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{ev.resourceType ?? "—"}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {ev.resourceId ? truncateId(ev.resourceId) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(ev.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Chat Analytics Tab */}
          <TabsContent value="chats" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Chart 1: BarChart - Message Volume by Day */}
              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Message Volume Over Time</h3>
                  <p className="text-sm text-muted-foreground">DM vs Group message counts by day (metadata only)</p>
                </div>
                <div className="h-[300px]">
                  {chatAnalyticsLoading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading…</div>
                  ) : chatVolumeByDay.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data for selected period</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chatVolumeByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="dm" name="Direct Messages" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="group" name="Group Chats" fill="hsl(262, 83%, 58%)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: PieChart - DM vs Group split */}
              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Chat Type Distribution</h3>
                  <p className="text-sm text-muted-foreground">
                    {chatAnalyticsData?.getChatVolumeAnalytics
                      ? `Total messages: ${(chatAnalyticsData.getChatVolumeAnalytics.totalMessages ?? 0).toLocaleString()}`
                      : "DM vs Group conversation split"}
                  </p>
                </div>
                <div className="h-[300px]">
                  {chatAnalyticsLoading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading…</div>
                  ) : chatTypePieData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chatTypePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chatTypePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value) => [`${value}%`, ""]}
                        />
                        <Legend
                          verticalAlign="bottom"
                          formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Top Active Chats Table */}
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Most Active Chats</h3>
                <p className="text-sm text-muted-foreground">Chats with highest message activity (E2E encrypted - metadata only)</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Chat ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatAnalyticsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">Loading…</TableCell>
                    </TableRow>
                  ) : topActiveChats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">No active chats found</TableCell>
                    </TableRow>
                  ) : (
                    topActiveChats.map((chat) => (
                      <TableRow key={chat.chatId} className="border-border/50">
                        <TableCell className="font-mono text-sm">{truncateId(chat.chatId)}</TableCell>
                        <TableCell className="max-w-[180px] truncate font-medium">{chat.chatName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              chat.chatType === "DM"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            }
                          >
                            {chat.chatType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {chat.memberCount}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{chat.messageCount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(chat.lastActiveAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
