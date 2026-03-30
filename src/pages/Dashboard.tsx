import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Layers,
  Briefcase,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Search,
  Calendar,
  Activity,
  Eye,
  TrendingUp,
  TrendingDown,
  MessageSquare,
} from "lucide-react";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import {
  useGetDashboardStats,
  useGetSystemHealth,
  useGetPlatformAnalytics,
  useAdminListDisputes,
  useAdminListEscrows,
} from "@/hooks/admin";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: { label: string; value: string; direction: "up" | "down" | "neutral" };
  icon: React.ReactNode;
  onClick?: () => void;
}

function MetricCard({ title, value, trend, icon, onClick }: MetricCardProps) {
  return (
    <div
      className="glass rounded-xl p-5 cursor-pointer hover:bg-muted/50 transition-all animate-fade-in"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend.direction === "up" ? "text-emerald-400" : 
            trend.direction === "down" ? "text-red-400" : "text-muted-foreground"
          }`}>
            {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
            {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend.label}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: statsData, refetch: refetchStats } = useGetDashboardStats();
  const { data: healthData, refetch: refetchHealth } = useGetSystemHealth();
  const { data: analyticsData, refetch: refetchAnalytics } = useGetPlatformAnalytics(
    dateRange === "7" ? "last_7_days" : dateRange === "90" ? "last_90_days" : "last_30_days"
  );
  const { data: escrowData } = useAdminListEscrows({ limit: 5 });
  const { data: disputesData } = useAdminListDisputes({ limit: 5 });

  const stats = statsData?.getDashboardStats;
  const health = healthData?.getSystemHealth;
  const analytics = analyticsData?.getPlatformAnalytics;
  const recentEscrows = escrowData?.adminListEscrows?.escrows ?? [];
  const recentDisputes = disputesData?.adminListDisputes?.disputes ?? [];

  const systemHealthChartData = health
    ? [
        {
          name: "Healthy",
          value: health.services.filter((s) => s.status === "healthy").length,
          color: "hsl(142, 72%, 42%)",
        },
        {
          name: "Down",
          value: health.services.filter((s) => s.status === "down").length,
          color: "hsl(0, 72%, 51%)",
        },
      ].filter((d) => d.value > 0)
    : [{ name: "Healthy", value: 1, color: "hsl(142, 72%, 42%)" }];

  const registrationsChartData = analytics?.registrationsByDay?.map((p) => ({
    date: p.date,
    newUsers: p.value,
  })) ?? [];

  const ordersChartData = analytics?.ordersByDay?.map((p) => ({
    date: p.date,
    orders: p.value,
  })) ?? [];

  const handleRefresh = () => {
    refetchStats();
    refetchHealth();
    refetchAnalytics();
    toast({
      title: "Dashboard Refreshed",
      description: "All metrics have been updated.",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "Funded": "bg-blue-500/20 text-blue-400 border-blue-500/50",
      "In Progress": "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      "Released": "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      "Disputed": "bg-red-500/20 text-red-400 border-red-500/50",
      "Pending Funding": "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      "Open": "bg-blue-500/20 text-blue-400 border-blue-500/50",
      "In Review": "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      "Resolved": "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      "Escalated": "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return <Badge variant="outline" className={colors[status] || ""}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      "Critical": "bg-red-500/20 text-red-400 border-red-500/50",
      "High": "bg-orange-500/20 text-orange-400 border-orange-500/50",
      "Medium": "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      "Low": "bg-muted text-muted-foreground",
    };
    return <Badge variant="outline" className={colors[priority] || ""}>{priority}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.overview')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px] bg-card border-border">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search') + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <MetricCard
            title={t('dashboard.totalUsers')}
            value={stats?.totalUsers?.toLocaleString() ?? "—"}
            trend={{ label: "Active Users", value: stats?.activeUsers?.toLocaleString() ?? "—", direction: "up" }}
            icon={<Users className="w-5 h-5" />}
            onClick={() => navigate("/users")}
          />
          <MetricCard
            title={t('nav.communities')}
            value={stats?.totalCommunities?.toLocaleString() ?? "—"}
            trend={{ label: "Moderation Cases", value: stats?.activeModerationCases?.toLocaleString() ?? "—", direction: "neutral" }}
            icon={<Layers className="w-5 h-5" />}
            onClick={() => navigate("/communities")}
          />
          <MetricCard
            title={t('nav.associations')}
            value="—"
            icon={<Briefcase className="w-5 h-5" />}
            onClick={() => navigate("/associations")}
          />
          <MetricCard
            title="Moderation Cases"
            value={stats?.activeModerationCases?.toLocaleString() ?? "—"}
            trend={{ label: "Pending Ban Appeals", value: stats?.pendingBanAppeals?.toLocaleString() ?? "—", direction: "neutral" }}
            icon={<MessageSquare className="w-5 h-5" />}
            onClick={() => navigate("/moderation")}
          />
          <MetricCard
            title="Total Orders"
            value={stats?.totalOrders?.toLocaleString() ?? "—"}
            trend={{ label: "Pending", value: stats?.pendingOrders?.toLocaleString() ?? "—", direction: "neutral" }}
            icon={<ShoppingCart className="w-5 h-5" />}
            onClick={() => navigate("/vendors")}
          />
          <MetricCard
            title={t('nav.vendors')}
            value={stats?.totalVendors?.toLocaleString() ?? "—"}
            trend={{ label: "Active", value: stats?.activeVendors?.toLocaleString() ?? "—", direction: "up" }}
            icon={<ShoppingCart className="w-5 h-5" />}
            onClick={() => navigate("/vendors")}
          />
          <MetricCard
            title="Pending Escrows"
            value={stats?.pendingEscrows?.toLocaleString() ?? "—"}
            icon={<Wallet className="w-5 h-5" />}
            onClick={() => navigate("/escrow")}
          />
          <MetricCard
            title={t('dashboard.activeDisputes')}
            value={stats?.openDisputes?.toLocaleString() ?? "—"}
            trend={{ label: "Open Disputes", value: stats?.openDisputes?.toLocaleString() ?? "—", direction: "down" }}
            icon={<AlertTriangle className="w-5 h-5" />}
            onClick={() => navigate("/disputes")}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* New Registrations Trend */}
          <div className="glass rounded-xl p-5 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-1">New Registrations</h3>
            <p className="text-sm text-muted-foreground mb-4">Daily user sign-ups</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 10%)",
                      border: "1px solid hsl(222, 30%, 18%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="newUsers" stroke="hsl(174, 72%, 46%)" strokeWidth={2} dot={false} name="New Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Trend */}
          <div className="glass rounded-xl p-5 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-1">Orders Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">Daily order activity</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 10%)",
                      border: "1px solid hsl(222, 30%, 18%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="orders" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={false} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="glass rounded-xl p-5 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-1">Enforcement Summary</h3>
            <p className="text-sm text-muted-foreground mb-4">Period: {analytics?.period ?? "—"}</p>
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Content Removed</span>
                <span className="text-lg font-bold text-foreground">{analytics?.contentRemovedCount?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Users Banned</span>
                <span className="text-lg font-bold text-foreground">{analytics?.usersBanned?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Generated At</span>
                <span className="text-xs text-muted-foreground">
                  {analytics?.generatedAt ? new Date(analytics.generatedAt).toLocaleTimeString() : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="glass rounded-xl p-5 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-1">System Health</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Status: <span className={health?.overallStatus === "healthy" ? "text-emerald-400" : "text-red-400"}>
                {health?.overallStatus ?? "—"}
              </span>
            </p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={systemHealthChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {systemHealthChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 10%)",
                      border: "1px solid hsl(222, 30%, 18%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value} services`, ""]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: "hsl(215, 20%, 55%)", fontSize: "12px" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Escrows */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Recent Escrows</h3>
                <p className="text-sm text-muted-foreground">Latest escrow transactions on the platform</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/escrow")}>
                View All
              </Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Escrow ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEscrows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No escrow data</TableCell>
                    </TableRow>
                  ) : recentEscrows.map((escrow) => (
                    <TableRow key={escrow.id} className="border-border">
                      <TableCell className="font-medium text-foreground font-mono text-xs">{escrow.id.slice(0, 12)}…</TableCell>
                      <TableCell className="font-semibold text-foreground">{formatCurrency(escrow.totalAmount)}</TableCell>
                      <TableCell className="text-muted-foreground">{escrow.currency ?? "USD"}</TableCell>
                      <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/escrow")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Recent Disputes */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Recent Disputes</h3>
                <p className="text-sm text-muted-foreground">Latest disputes raised on the platform</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/disputes")}>
                View All
              </Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDisputes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No disputes</TableCell>
                    </TableRow>
                  ) : recentDisputes.map((dispute) => (
                    <TableRow key={dispute.id} className="border-border">
                      <TableCell className="font-medium text-foreground font-mono text-xs">{dispute.id.slice(0, 12)}…</TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{dispute.raisedBy ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/disputes")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>


      </div>
    </AdminLayout>
  );
}
