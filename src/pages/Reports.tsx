import { useState } from "react";
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

// Mock data for charts
const userGrowthData = [
  { date: "Jan 1", newUsers: 120, activeUsers: 890 },
  { date: "Jan 8", newUsers: 145, activeUsers: 920 },
  { date: "Jan 15", newUsers: 160, activeUsers: 980 },
  { date: "Jan 22", newUsers: 180, activeUsers: 1050 },
  { date: "Jan 29", newUsers: 210, activeUsers: 1120 },
  { date: "Feb 5", newUsers: 195, activeUsers: 1180 },
  { date: "Feb 12", newUsers: 230, activeUsers: 1250 },
];

const communityEngagementData = [
  { community: "Lagos Tech", posts: 245, reactions: 1890 },
  { community: "Accra Business", posts: 189, reactions: 1420 },
  { community: "Nairobi Creatives", posts: 156, reactions: 1100 },
  { community: "Cape Town Dev", posts: 134, reactions: 980 },
  { community: "Kigali Startup", posts: 98, reactions: 720 },
];

const vendorSalesData = [
  { date: "Jan 1", sales: 45000 },
  { date: "Jan 8", sales: 52000 },
  { date: "Jan 15", sales: 48000 },
  { date: "Jan 22", sales: 61000 },
  { date: "Jan 29", sales: 58000 },
  { date: "Feb 5", sales: 72000 },
  { date: "Feb 12", sales: 68000 },
];

const escrowStatusData = [
  { name: "Funded", value: 45, color: "hsl(var(--primary))" },
  { name: "Released", value: 32, color: "hsl(142, 72%, 42%)" },
  { name: "Pending", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Disputed", value: 8, color: "hsl(var(--destructive))" },
];

const disputeTypeData = [
  { name: "Transaction", value: 35, color: "hsl(var(--primary))" },
  { name: "Escrow", value: 28, color: "hsl(262, 83%, 58%)" },
  { name: "Content", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "Vendor Issue", value: 12, color: "hsl(142, 72%, 42%)" },
  { name: "Community", value: 7, color: "hsl(var(--destructive))" },
];

const systemHealthData = [
  { name: "Healthy", value: 85, color: "hsl(142, 72%, 42%)" },
  { name: "Warning", value: 10, color: "hsl(38, 92%, 50%)" },
  { name: "Critical", value: 5, color: "hsl(var(--destructive))" },
];

// Mock table data
const topActiveUsers = [
  { id: "USR-001", name: "Adaeze Okoro", communities: 5, posts: 89, reactions: 456, opportunities: 12 },
  { id: "USR-002", name: "Kwame Asante", communities: 4, posts: 72, reactions: 389, opportunities: 8 },
  { id: "USR-003", name: "Fatima Diallo", communities: 6, posts: 65, reactions: 342, opportunities: 15 },
  { id: "USR-004", name: "Chidi Nwosu", communities: 3, posts: 58, reactions: 298, opportunities: 6 },
  { id: "USR-005", name: "Amina Traore", communities: 4, posts: 51, reactions: 267, opportunities: 9 },
];

const topAssociations = [
  { name: "Lagos Tech Hub", community: "Lagos Tech", posts: 156, opportunities: 45, vendors: 23, reactions: 2890 },
  { name: "Accra Business Network", community: "Accra Business", posts: 134, opportunities: 38, vendors: 18, reactions: 2340 },
  { name: "Nairobi Creatives Collective", community: "Nairobi Creatives", posts: 98, opportunities: 28, vendors: 12, reactions: 1780 },
  { name: "Cape Town Dev Alliance", community: "Cape Town Dev", posts: 87, opportunities: 22, vendors: 15, reactions: 1560 },
  { name: "Kigali Startup Foundation", community: "Kigali Startup", posts: 76, opportunities: 19, vendors: 9, reactions: 1230 },
];

const topVendors = [
  { name: "TechSupply Africa", products: 234, revenue: "$45,600", rating: 4.8 },
  { name: "Craft & Culture Co", products: 189, revenue: "$38,200", rating: 4.7 },
  { name: "AgriTech Solutions", products: 156, revenue: "$32,100", rating: 4.6 },
  { name: "Fashion Forward Lagos", products: 134, revenue: "$28,900", rating: 4.5 },
  { name: "Digital Services Hub", products: 98, revenue: "$24,500", rating: 4.4 },
];

const recentEscrowTransactions = [
  { id: "ESC-2024-001", createdBy: "Adaeze Okoro", recipient: "TechSupply Africa", amount: "$2,500", status: "Funded", createdAt: "2024-01-15" },
  { id: "ESC-2024-002", createdBy: "Kwame Asante", recipient: "Craft & Culture Co", amount: "$1,800", status: "Released", createdAt: "2024-01-14" },
  { id: "ESC-2024-003", createdBy: "Fatima Diallo", recipient: "AgriTech Solutions", amount: "$3,200", status: "Pending", createdAt: "2024-01-13" },
  { id: "ESC-2024-004", createdBy: "Chidi Nwosu", recipient: "Fashion Forward", amount: "$950", status: "Disputed", createdAt: "2024-01-12" },
  { id: "ESC-2024-005", createdBy: "Amina Traore", recipient: "Digital Services", amount: "$4,100", status: "Funded", createdAt: "2024-01-11" },
];

const recentDisputes = [
  { id: "DSP-001", type: "Transaction", status: "Open", priority: "High", createdBy: "Chidi Nwosu", assignedAdmin: "Admin Sarah", createdAt: "2024-01-15" },
  { id: "DSP-002", type: "Escrow", status: "In Review", priority: "Critical", createdBy: "Kwame Asante", assignedAdmin: "Admin Mike", createdAt: "2024-01-14" },
  { id: "DSP-003", type: "Content", status: "Resolved", priority: "Medium", createdBy: "Fatima Diallo", assignedAdmin: "Admin Sarah", createdAt: "2024-01-13" },
  { id: "DSP-004", type: "Vendor Issue", status: "Open", priority: "Low", createdBy: "Adaeze Okoro", assignedAdmin: "Unassigned", createdAt: "2024-01-12" },
  { id: "DSP-005", type: "Community", status: "Escalated", priority: "High", createdBy: "Amina Traore", assignedAdmin: "Admin Mike", createdAt: "2024-01-11" },
];

const recentSystemEvents = [
  { id: "EVT-001", service: "Authentication", type: "Info", status: "Healthy", timestamp: "2024-01-15 14:30", notes: "Normal operation" },
  { id: "EVT-002", service: "Database", type: "Warning", status: "Warning", timestamp: "2024-01-15 13:45", notes: "High query load detected" },
  { id: "EVT-003", service: "Storage", type: "Info", status: "Healthy", timestamp: "2024-01-15 12:00", notes: "Backup completed" },
  { id: "EVT-004", service: "API Gateway", type: "Error", status: "Critical", timestamp: "2024-01-15 11:30", notes: "Rate limit exceeded" },
  { id: "EVT-005", service: "Email Service", type: "Info", status: "Healthy", timestamp: "2024-01-15 10:15", notes: "Queue cleared" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  Funded: { label: "Funded", className: "bg-primary/20 text-primary border-primary/30" },
  Released: { label: "Released", className: "bg-success/20 text-success border-success/30" },
  Pending: { label: "Pending", className: "bg-warning/20 text-warning border-warning/30" },
  Disputed: { label: "Disputed", className: "bg-destructive/20 text-destructive border-destructive/30" },
  Open: { label: "Open", className: "bg-primary/20 text-primary border-primary/30" },
  "In Review": { label: "In Review", className: "bg-warning/20 text-warning border-warning/30" },
  Resolved: { label: "Resolved", className: "bg-success/20 text-success border-success/30" },
  Escalated: { label: "Escalated", className: "bg-destructive/20 text-destructive border-destructive/30" },
  Healthy: { label: "Healthy", className: "bg-success/20 text-success border-success/30" },
  Warning: { label: "Warning", className: "bg-warning/20 text-warning border-warning/30" },
  Critical: { label: "Critical", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  Low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
  Medium: { label: "Medium", className: "bg-primary/20 text-primary border-primary/30" },
  High: { label: "High", className: "bg-warning/20 text-warning border-warning/30" },
  Critical: { label: "Critical", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState("all");
  const [activeTab, setActiveTab] = useState("users");

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate, view, and export detailed reports on platform activity and performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
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
          </TabsList>

          {/* User Analytics Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">User Growth Over Time</h3>
                <p className="text-sm text-muted-foreground">Shows new and active users over time</p>
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
                    <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--primary))" strokeWidth={2} name="New Users" />
                    <Line type="monotone" dataKey="activeUsers" stroke="hsl(142, 72%, 42%)" strokeWidth={2} name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Top Active Users</h3>
                <p className="text-sm text-muted-foreground">Users with highest engagement metrics</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Communities</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Reactions</TableHead>
                    <TableHead>Opportunities</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topActiveUsers.map((user) => (
                    <TableRow key={user.id} className="border-border/50">
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.communities}</TableCell>
                      <TableCell>{user.posts}</TableCell>
                      <TableCell>{user.reactions}</TableCell>
                      <TableCell>{user.opportunities}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Community & Association Tab */}
          <TabsContent value="communities" className="space-y-6">
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Posts & Engagement by Community</h3>
                <p className="text-sm text-muted-foreground">Compare engagement across communities</p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={communityEngagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="community" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="posts" fill="hsl(var(--primary))" name="Posts" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reactions" fill="hsl(142, 72%, 42%)" name="Reactions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Top Performing Associations</h3>
                <p className="text-sm text-muted-foreground">Associations with highest activity</p>
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
                  {topAssociations.map((assoc, index) => (
                    <TableRow key={index} className="border-border/50">
                      <TableCell className="font-medium">{assoc.name}</TableCell>
                      <TableCell>{assoc.community}</TableCell>
                      <TableCell>{assoc.posts}</TableCell>
                      <TableCell>{assoc.opportunities}</TableCell>
                      <TableCell>{assoc.vendors}</TableCell>
                      <TableCell>{assoc.reactions}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Vendor & Marketplace Tab */}
          <TabsContent value="vendors" className="space-y-6">
            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Vendor Sales Over Time</h3>
                <p className="text-sm text-muted-foreground">Total sales volume trend</p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vendorSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Sales"]}
                    />
                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Top Selling Vendors</h3>
                <p className="text-sm text-muted-foreground">Vendors with highest revenue</p>
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
                  {topVendors.map((vendor, index) => (
                    <TableRow key={index} className="border-border/50">
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.products}</TableCell>
                      <TableCell className="font-semibold text-success">{vendor.revenue}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                          ⭐ {vendor.rating}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  <h3 className="font-semibold text-foreground">Escrow Summary</h3>
                  <p className="text-sm text-muted-foreground">Key escrow metrics</p>
                </div>
                <div className="space-y-4">
                  {escrowStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-lg font-bold">{item.value}%</span>
                    </div>
                  ))}
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
                    <TableHead>Created By</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEscrowTransactions.map((txn) => (
                    <TableRow key={txn.id} className="border-border/50">
                      <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                      <TableCell>{txn.createdBy}</TableCell>
                      <TableCell>{txn.recipient}</TableCell>
                      <TableCell className="font-semibold">{txn.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[txn.status]?.className}>
                          {statusConfig[txn.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{txn.createdAt}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Disputes Analytics Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground">Disputes by Type</h3>
                  <p className="text-sm text-muted-foreground">Distribution of dispute categories</p>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disputeTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {disputeTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
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
                  <h3 className="font-semibold text-foreground">Dispute Summary</h3>
                  <p className="text-sm text-muted-foreground">Breakdown by type</p>
                </div>
                <div className="space-y-4">
                  {disputeTypeData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-lg font-bold">{item.value}%</span>
                    </div>
                  ))}
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
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Assigned Admin</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDisputes.map((dispute) => (
                    <TableRow key={dispute.id} className="border-border/50">
                      <TableCell className="font-mono text-sm">{dispute.id}</TableCell>
                      <TableCell>{dispute.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[dispute.status]?.className}>
                          {statusConfig[dispute.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityConfig[dispute.priority]?.className}>
                          {priorityConfig[dispute.priority]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{dispute.createdBy}</TableCell>
                      <TableCell>{dispute.assignedAdmin}</TableCell>
                      <TableCell className="text-muted-foreground">{dispute.createdAt}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                        data={systemHealthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {systemHealthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
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
                <div className="space-y-4">
                  {systemHealthData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-lg font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Recent System Events</h3>
                <p className="text-sm text-muted-foreground">Latest system events and alerts</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Event ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSystemEvents.map((event) => (
                    <TableRow key={event.id} className="border-border/50">
                      <TableCell className="font-mono text-sm">{event.id}</TableCell>
                      <TableCell className="font-medium">{event.service}</TableCell>
                      <TableCell>{event.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[event.status]?.className}>
                          {statusConfig[event.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{event.timestamp}</TableCell>
                      <TableCell className="text-muted-foreground">{event.notes}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
