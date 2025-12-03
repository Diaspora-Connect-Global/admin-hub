import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Layers,
  Briefcase,
  MessageCircle,
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

// Mock data for charts
const userActivityData = [
  { date: "Jan 1", newUsers: 120, activeUsers: 1850 },
  { date: "Jan 5", newUsers: 145, activeUsers: 1920 },
  { date: "Jan 10", newUsers: 132, activeUsers: 1980 },
  { date: "Jan 15", newUsers: 178, activeUsers: 2100 },
  { date: "Jan 20", newUsers: 165, activeUsers: 2250 },
  { date: "Jan 25", newUsers: 198, activeUsers: 2380 },
  { date: "Jan 30", newUsers: 210, activeUsers: 2520 },
];

const postsReactionsData = [
  { date: "Jan 1", posts: 45, reactions: 380 },
  { date: "Jan 5", posts: 52, reactions: 420 },
  { date: "Jan 10", posts: 48, reactions: 390 },
  { date: "Jan 15", posts: 65, reactions: 520 },
  { date: "Jan 20", posts: 72, reactions: 580 },
  { date: "Jan 25", posts: 68, reactions: 610 },
  { date: "Jan 30", posts: 85, reactions: 720 },
];

const systemHealthData = [
  { name: "Healthy", value: 85, color: "hsl(142, 72%, 42%)" },
  { name: "Warning", value: 10, color: "hsl(38, 92%, 50%)" },
  { name: "Critical", value: 5, color: "hsl(0, 72%, 51%)" },
];

const recentEscrowTransactions = [
  { id: "ESC-2024-001", createdBy: "John Doe", recipient: "ABC Contractors", amount: 15000, status: "Funded", createdAt: "2024-01-15" },
  { id: "ESC-2024-002", createdBy: "Jane Smith", recipient: "XYZ Supplies", amount: 3500, status: "In Progress", createdAt: "2024-01-14" },
  { id: "ESC-2024-003", createdBy: "Mike Johnson", recipient: "Green Gardens LLC", amount: 8000, status: "Disputed", createdAt: "2024-01-10" },
  { id: "ESC-2024-004", createdBy: "Sarah Williams", recipient: "Tech Solutions", amount: 12000, status: "Released", createdAt: "2024-01-08" },
  { id: "ESC-2024-005", createdBy: "Tom Brown", recipient: "Security First", amount: 25000, status: "Pending Funding", createdAt: "2024-01-18" },
];

const recentDisputes = [
  { id: "DSP-001", type: "Escrow", status: "Open", priority: "High", createdBy: "Mike Johnson", assignedAdmin: "Admin User", createdAt: "2024-01-17" },
  { id: "DSP-002", type: "Content", status: "In Review", priority: "Medium", createdBy: "Lisa Chen", assignedAdmin: "Support Admin", createdAt: "2024-01-16" },
  { id: "DSP-003", type: "Vendor Issue", status: "Escalated", priority: "Critical", createdBy: "David Park", assignedAdmin: "System Admin", createdAt: "2024-01-15" },
  { id: "DSP-004", type: "Transaction", status: "Resolved", priority: "Low", createdBy: "Emma White", assignedAdmin: "Admin User", createdAt: "2024-01-12" },
  { id: "DSP-005", type: "Community Issue", status: "Open", priority: "Medium", createdBy: "James Lee", assignedAdmin: "Unassigned", createdAt: "2024-01-18" },
];

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
  const [dateRange, setDateRange] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = () => {
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
            <h1 className="text-2xl font-bold text-foreground">System Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor key metrics and platform activity at a glance.</p>
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
            placeholder="Search users, communities, associations, posts, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <MetricCard
            title="Total Users"
            value="12,847"
            trend={{ label: "New Users", value: "+8.5%", direction: "up" }}
            icon={<Users className="w-5 h-5" />}
            onClick={() => navigate("/users")}
          />
          <MetricCard
            title="Total Communities"
            value="48"
            trend={{ label: "New Communities", value: "+12.3%", direction: "up" }}
            icon={<Layers className="w-5 h-5" />}
            onClick={() => navigate("/communities")}
          />
          <MetricCard
            title="Total Associations"
            value="156"
            trend={{ label: "New Associations", value: "+5.7%", direction: "up" }}
            icon={<Briefcase className="w-5 h-5" />}
            onClick={() => navigate("/associations")}
          />
          <MetricCard
            title="Posts & Engagement"
            value="2,340"
            trend={{ label: "Reactions (Likes, Comments)", value: "15.2K", direction: "neutral" }}
            icon={<MessageCircle className="w-5 h-5" />}
            onClick={() => navigate("/moderation")}
          />
          <MetricCard
            title="Vendors"
            value="89"
            trend={{ label: "New Registrations", value: "+18.2%", direction: "up" }}
            icon={<ShoppingCart className="w-5 h-5" />}
            onClick={() => navigate("/vendors")}
          />
          <MetricCard
            title="Escrow Transactions"
            value="$2.4M"
            trend={{ label: "Active Escrow", value: "$580K", direction: "up" }}
            icon={<Wallet className="w-5 h-5" />}
            onClick={() => navigate("/escrow")}
          />
          <MetricCard
            title="Disputes"
            value="23"
            trend={{ label: "Open / In-Review", value: "12", direction: "down" }}
            icon={<AlertTriangle className="w-5 h-5" />}
            onClick={() => navigate("/disputes")}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Activity Trend */}
          <div className="glass rounded-xl p-5 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-1">User Activity Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">New vs Active Users</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userActivityData}>
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
                  <Line type="monotone" dataKey="newUsers" stroke="hsl(174, 72%, 46%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="activeUsers" stroke="hsl(142, 72%, 42%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Posts & Reactions Trend */}
          <div className="glass rounded-xl p-5 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-1">Posts & Reactions Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">Daily engagement metrics</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={postsReactionsData}>
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
                  <Line type="monotone" dataKey="posts" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="reactions" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="glass rounded-xl p-5 lg:col-span-1">
            <h3 className="font-semibold text-foreground mb-1">System Health Overview</h3>
            <p className="text-sm text-muted-foreground mb-4">Service status distribution</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={systemHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {systemHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 10%)",
                      border: "1px solid hsl(222, 30%, 18%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value}%`, ""]}
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
          {/* Recent Escrow Transactions */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Recent Escrow Transactions</h3>
                <p className="text-sm text-muted-foreground">Latest transactions on the platform</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/escrow")}>
                View All
              </Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEscrowTransactions.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{tx.id}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.createdBy}</TableCell>
                      <TableCell className="font-semibold text-foreground">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDisputes.slice(0, 5).map((dispute) => (
                    <TableRow key={dispute.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{dispute.id}</TableCell>
                      <TableCell className="text-muted-foreground">{dispute.type}</TableCell>
                      <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
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

        {/* Quick Links Footer */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => navigate("/users")}>
              <Users className="h-5 w-5" />
              <span className="text-xs">User Management</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => navigate("/communities")}>
              <Layers className="h-5 w-5" />
              <span className="text-xs">Communities</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => navigate("/vendors")}>
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Vendors</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => navigate("/escrow")}>
              <Wallet className="h-5 w-5" />
              <span className="text-xs">Escrow</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => navigate("/disputes")}>
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs">Disputes</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => navigate("/health")}>
              <Activity className="h-5 w-5" />
              <span className="text-xs">System Health</span>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
