import { useState } from "react";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import {
  Bell,
  Send,
  Megaphone,
  FileText,
  Settings,
  Search,
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Users,
  Globe,
  Smartphone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  Zap,
  Target,
  Calendar,
} from "lucide-react";

// Mock data
const dashboardStats = {
  totalSent: 284591,
  deliveryRate: 98.2,
  openRate: 42.7,
  clickRate: 12.4,
  pendingBroadcasts: 3,
  activeTemplates: 24,
};

const notificationVolumeData = [
  { day: "Mon", push: 4500, inApp: 2800, email: 1200 },
  { day: "Tue", push: 5200, inApp: 3100, email: 1400 },
  { day: "Wed", push: 4800, inApp: 2900, email: 1100 },
  { day: "Thu", push: 6100, inApp: 3500, email: 1600 },
  { day: "Fri", push: 5800, inApp: 3200, email: 1500 },
  { day: "Sat", push: 3200, inApp: 2100, email: 800 },
  { day: "Sun", push: 2900, inApp: 1800, email: 700 },
];

const deliveryTrendData = [
  { hour: "00:00", delivered: 95, failed: 5 },
  { hour: "04:00", delivered: 97, failed: 3 },
  { hour: "08:00", delivered: 98, failed: 2 },
  { hour: "12:00", delivered: 99, failed: 1 },
  { hour: "16:00", delivered: 97, failed: 3 },
  { hour: "20:00", delivered: 96, failed: 4 },
];

const notificationTypeDistribution = [
  { name: "Push", value: 45, color: "hsl(var(--chart-1))" },
  { name: "In-App", value: 35, color: "hsl(var(--chart-2))" },
  { name: "Email", value: 20, color: "hsl(var(--chart-3))" },
];

const pushNotifications = [
  { id: "PN-001", title: "New message from John", type: "Chat", recipients: 1, status: "delivered", sentAt: "2024-01-15 15:30", openRate: "100%" },
  { id: "PN-002", title: "Your escrow is ready", type: "Transaction", recipients: 1, status: "delivered", sentAt: "2024-01-15 14:22", openRate: "100%" },
  { id: "PN-003", title: "Community event tomorrow", type: "Event", recipients: 1247, status: "delivered", sentAt: "2024-01-15 13:45", openRate: "45%" },
  { id: "PN-004", title: "Payment received", type: "Transaction", recipients: 1, status: "delivered", sentAt: "2024-01-15 12:10", openRate: "100%" },
  { id: "PN-005", title: "Weekly digest", type: "Marketing", recipients: 8924, status: "sending", sentAt: "2024-01-15 11:55", openRate: "-" },
];

const inAppNotifications = [
  { id: "IA-001", title: "Welcome to the platform!", type: "Onboarding", priority: "High", targetAudience: "New Users", active: true, views: 12847 },
  { id: "IA-002", title: "Complete your profile", type: "Reminder", priority: "Medium", targetAudience: "Incomplete Profiles", active: true, views: 5623 },
  { id: "IA-003", title: "New feature: Video calls", type: "Announcement", priority: "Low", targetAudience: "All Users", active: true, views: 34521 },
  { id: "IA-004", title: "Security update required", type: "Alert", priority: "Critical", targetAudience: "Affected Users", active: false, views: 892 },
];

const broadcasts = [
  { id: "BC-001", title: "Platform Maintenance Notice", type: "System", audience: "All Users", audienceCount: 45892, status: "scheduled", scheduledAt: "2024-01-16 02:00", createdBy: "Admin" },
  { id: "BC-002", title: "New Year Promotion", type: "Marketing", audience: "Active Users", audienceCount: 32145, status: "sent", scheduledAt: "2024-01-01 00:00", createdBy: "Marketing Team" },
  { id: "BC-003", title: "Terms of Service Update", type: "Legal", audience: "All Users", audienceCount: 45892, status: "sent", scheduledAt: "2023-12-20 10:00", createdBy: "Legal Team" },
  { id: "BC-004", title: "Community Guidelines Reminder", type: "Policy", audience: "Flagged Users", audienceCount: 234, status: "draft", scheduledAt: "-", createdBy: "Trust & Safety" },
];

const templates = [
  { id: "TPL-001", name: "Welcome Email", type: "Email", category: "Onboarding", lastUpdated: "2024-01-10", usageCount: 12458, status: "active" },
  { id: "TPL-002", name: "Transaction Complete", type: "Push", category: "Transaction", lastUpdated: "2024-01-08", usageCount: 45892, status: "active" },
  { id: "TPL-003", name: "Password Reset", type: "Email", category: "Security", lastUpdated: "2024-01-05", usageCount: 3421, status: "active" },
  { id: "TPL-004", name: "Weekly Digest", type: "Email", category: "Marketing", lastUpdated: "2024-01-12", usageCount: 8924, status: "active" },
  { id: "TPL-005", name: "Event Reminder", type: "Push", category: "Events", lastUpdated: "2024-01-03", usageCount: 2156, status: "inactive" },
];

const chartConfig = {
  push: { label: "Push", color: "hsl(var(--chart-1))" },
  inApp: { label: "In-App", color: "hsl(var(--chart-2))" },
  email: { label: "Email", color: "hsl(var(--chart-3))" },
  delivered: { label: "Delivered", color: "hsl(var(--chart-1))" },
  failed: { label: "Failed", color: "hsl(var(--destructive))" },
};

export default function NotificationsBroadcasts() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [createBroadcastModal, setCreateBroadcastModal] = useState(false);
  const [createTemplateModal, setCreateTemplateModal] = useState(false);
  const [viewBroadcastModal, setViewBroadcastModal] = useState<typeof broadcasts[0] | null>(null);
  const [viewTemplateModal, setViewTemplateModal] = useState<typeof templates[0] | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "sent":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Delivered</Badge>;
      case "sending":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Sending</Badge>;
      case "scheduled":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Scheduled</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge variant="destructive">{priority}</Badge>;
      case "High":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{priority}</Badge>;
      case "Medium":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{priority}</Badge>;
      case "Low":
        return <Badge variant="secondary">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications & Broadcasts</h1>
            <p className="text-muted-foreground mt-1">
              Manage push notifications, in-app alerts, and system-wide broadcasts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
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

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalSent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">{dashboardStats.deliveryRate}%</div>
                  <p className="text-xs text-muted-foreground">Successfully delivered</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.openRate}%</div>
                  <p className="text-xs text-muted-foreground">Notifications opened</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.clickRate}%</div>
                  <p className="text-xs text-muted-foreground">Engagement rate</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-amber-500/30 transition-colors border-amber-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">{dashboardStats.pendingBroadcasts}</div>
                  <p className="text-xs text-muted-foreground">Scheduled broadcasts</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Templates</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.activeTemplates}</div>
                  <p className="text-xs text-muted-foreground">Active templates</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Volume (7 Days)</CardTitle>
                  <CardDescription>Notifications sent by channel</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={notificationVolumeData}>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="push" fill="var(--color-push)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="inApp" fill="var(--color-inApp)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="email" fill="var(--color-email)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>Success rate over 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={deliveryTrendData}>
                        <XAxis dataKey="hour" />
                        <YAxis domain={[90, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="delivered" stroke="var(--color-delivered)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Distribution & Recent */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Distribution</CardTitle>
                  <CardDescription>Notifications by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={notificationTypeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {notificationTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {notificationTypeDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                        <TableHead>Type</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {broadcasts.slice(0, 4).map((broadcast) => (
                        <TableRow key={broadcast.id}>
                          <TableCell className="font-medium">{broadcast.title}</TableCell>
                          <TableCell><Badge variant="outline">{broadcast.type}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{broadcast.audienceCount.toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Push Notifications Tab */}
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
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
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
                    {pushNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-mono text-sm">{notification.id}</TableCell>
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell><Badge variant="outline">{notification.type}</Badge></TableCell>
                        <TableCell>{notification.recipients.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{notification.sentAt}</TableCell>
                        <TableCell>{notification.openRate}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" /> Resend
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* In-App Notifications Tab */}
          <TabsContent value="inapp" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>In-App Notifications</CardTitle>
                  <CardDescription>Manage banners, alerts, and tooltips shown within the app.</CardDescription>
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
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
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
                    {inAppNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-mono text-sm">{notification.id}</TableCell>
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell><Badge variant="outline">{notification.type}</Badge></TableCell>
                        <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                        <TableCell className="text-muted-foreground">{notification.targetAudience}</TableCell>
                        <TableCell>{notification.views.toLocaleString()}</TableCell>
                        <TableCell>
                          <Switch checked={notification.active} />
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
                                <Eye className="mr-2 h-4 w-4" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broadcasts Tab */}
          <TabsContent value="broadcasts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>System Broadcasts</CardTitle>
                  <CardDescription>Send announcements to all users or specific segments.</CardDescription>
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
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell className="font-mono text-sm">{broadcast.id}</TableCell>
                        <TableCell className="font-medium">{broadcast.title}</TableCell>
                        <TableCell><Badge variant="outline">{broadcast.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{broadcast.audience}</TableCell>
                        <TableCell>{broadcast.audienceCount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{broadcast.scheduledAt}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewBroadcastModal(broadcast)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              {broadcast.status === "draft" && (
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              {broadcast.status === "draft" && (
                                <DropdownMenuItem>
                                  <Send className="mr-2 h-4 w-4" /> Send Now
                                </DropdownMenuItem>
                              )}
                              {broadcast.status === "scheduled" && (
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notification Templates</CardTitle>
                  <CardDescription>Manage reusable notification templates with dynamic placeholders.</CardDescription>
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
                  <Select defaultValue="all">
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
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
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
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-mono text-sm">{template.id}</TableCell>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {template.type === "Push" && <Smartphone className="h-3 w-3" />}
                            {template.type === "Email" && <Mail className="h-3 w-3" />}
                            {template.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{template.category}</TableCell>
                        <TableCell className="text-muted-foreground">{template.lastUpdated}</TableCell>
                        <TableCell>{template.usageCount.toLocaleString()}</TableCell>
                        <TableCell>
                          {template.status === "active" ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
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
                              <DropdownMenuItem onClick={() => setViewTemplateModal(template)}>
                                <Eye className="mr-2 h-4 w-4" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Push Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" /> Push Notification Settings
                  </CardTitle>
                  <CardDescription>Configure push notification delivery preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Allow system to send push notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Silent Hours</Label>
                      <p className="text-sm text-muted-foreground">Suppress non-urgent notifications at night</p>
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
                            <SelectItem key={i} value={i.toString()}>{i.toString().padStart(2, '0')}:00</SelectItem>
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
                            <SelectItem key={i} value={i.toString()}>{i.toString().padStart(2, '0')}:00</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Rich Notifications</Label>
                      <p className="text-sm text-muted-foreground">Include images and action buttons</p>
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
                      <p className="text-sm text-muted-foreground">Allow system to send email notifications</p>
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
                      <p className="text-sm text-muted-foreground">Include unsubscribe link and address</p>
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
                      <p className="text-sm text-muted-foreground">Honor opt-out settings per category</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>A/B Testing</Label>
                      <p className="text-sm text-muted-foreground">Enable split testing for broadcasts</p>
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
              <Input placeholder="Enter broadcast title..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Users</SelectItem>
                    <SelectItem value="new">New Users (30 days)</SelectItem>
                    <SelectItem value="flagged">Flagged Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea placeholder="Enter your broadcast message..." rows={5} />
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
            <Button variant="outline" onClick={() => setCreateBroadcastModal(false)}>Cancel</Button>
            <Button variant="secondary">Save as Draft</Button>
            <Button>Send Broadcast</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Modal */}
      <Dialog open={createTemplateModal} onOpenChange={setCreateTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Notification Template</DialogTitle>
            <DialogDescription>Create a reusable template with dynamic placeholders.</DialogDescription>
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
              <p className="text-xs text-muted-foreground">Use {"{{variable}}"} for dynamic content</p>
            </div>
            <div className="space-y-2">
              <Label>Body Template</Label>
              <Textarea placeholder="Enter template content..." rows={5} />
            </div>
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium mb-2">Available Placeholders:</p>
              <div className="flex flex-wrap gap-2">
                {["{{user_name}}", "{{user_email}}", "{{amount}}", "{{date}}", "{{link}}"].map((placeholder) => (
                  <Badge key={placeholder} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {placeholder}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTemplateModal(false)}>Cancel</Button>
            <Button>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Broadcast Modal */}
      <Dialog open={!!viewBroadcastModal} onOpenChange={() => setViewBroadcastModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast Details</DialogTitle>
          </DialogHeader>
          {viewBroadcastModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono">{viewBroadcastModal.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(viewBroadcastModal.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p>{viewBroadcastModal.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audience</p>
                  <p>{viewBroadcastModal.audience}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <p>{viewBroadcastModal.audienceCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p>{viewBroadcastModal.scheduledAt}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{viewBroadcastModal.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p>{viewBroadcastModal.createdBy}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Template Modal */}
      <Dialog open={!!viewTemplateModal} onOpenChange={() => setViewTemplateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {viewTemplateModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono">{viewTemplateModal.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {viewTemplateModal.status === "active" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p>{viewTemplateModal.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p>{viewTemplateModal.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usage Count</p>
                  <p>{viewTemplateModal.usageCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p>{viewTemplateModal.lastUpdated}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{viewTemplateModal.name}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
