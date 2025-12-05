import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import {
  MessageSquare,
  Activity,
  Sparkles,
  ShieldAlert,
  Search,
  MoreHorizontal,
  Info,
  UserSearch,
  Archive,
  Shield,
  Eye,
  Users,
  Mail,
  UserMinus,
  ArrowUp,
  Lock,
  Settings,
  Filter,
} from "lucide-react";

// Mock data
const dashboardStats = {
  totalActiveConversations: 12847,
  dailyActiveChats: 3421,
  newChatsToday: 287,
  flaggedChats: 23,
};

const messageVolumeData = [
  { day: "Mon", dm: 4500, group: 2800 },
  { day: "Tue", dm: 5200, group: 3100 },
  { day: "Wed", dm: 4800, group: 2900 },
  { day: "Thu", dm: 6100, group: 3500 },
  { day: "Fri", dm: 5800, group: 3200 },
  { day: "Sat", dm: 3200, group: 2100 },
  { day: "Sun", dm: 2900, group: 1800 },
];

const peakHoursData = [
  { hour: "00", value: 12 }, { hour: "02", value: 8 }, { hour: "04", value: 5 },
  { hour: "06", value: 15 }, { hour: "08", value: 45 }, { hour: "10", value: 78 },
  { hour: "12", value: 95 }, { hour: "14", value: 88 }, { hour: "16", value: 82 },
  { hour: "18", value: 75 }, { hour: "20", value: 68 }, { hour: "22", value: 35 },
];

const recentFlags = [
  { id: "F001", chatType: "Group", flagReason: "Spam detected", reportCount: 5, createdAt: "2024-01-15 14:23" },
  { id: "F002", chatType: "DM", flagReason: "Harassment report", reportCount: 2, createdAt: "2024-01-15 13:45" },
  { id: "F003", chatType: "Group", flagReason: "Suspicious activity", reportCount: 8, createdAt: "2024-01-15 12:10" },
];

const dmConversations = [
  { dmId: "DM-001", userA: "John Smith", userB: "Jane Doe", messageCount: 247, lastActive: "2024-01-15 15:30", flagCount: 0 },
  { dmId: "DM-002", userA: "Mike Johnson", userB: "Sarah Wilson", messageCount: 89, lastActive: "2024-01-15 14:22", flagCount: 1 },
  { dmId: "DM-003", userA: "Alex Brown", userB: "Emily Davis", messageCount: 512, lastActive: "2024-01-15 13:45", flagCount: 0 },
  { dmId: "DM-004", userA: "Chris Lee", userB: "Taylor Moore", messageCount: 156, lastActive: "2024-01-15 12:10", flagCount: 2 },
  { dmId: "DM-005", userA: "Jordan Kim", userB: "Casey White", messageCount: 78, lastActive: "2024-01-15 11:55", flagCount: 0 },
];

const groupChats = [
  { groupId: "GRP-001", name: "NYC Diaspora Community", creator: "John Smith", memberCount: 156, messageCount: 4521, lastActive: "2024-01-15 15:30", flagCount: 0, visibility: "Public" },
  { groupId: "GRP-002", name: "Tech Professionals", creator: "Sarah Wilson", memberCount: 89, messageCount: 1247, lastActive: "2024-01-15 14:22", flagCount: 1, visibility: "Private" },
  { groupId: "GRP-003", name: "Cultural Exchange", creator: "Mike Johnson", memberCount: 234, messageCount: 8956, lastActive: "2024-01-15 13:45", flagCount: 0, visibility: "Public" },
  { groupId: "GRP-004", name: "Business Network", creator: "Emily Davis", memberCount: 67, messageCount: 892, lastActive: "2024-01-15 12:10", flagCount: 3, visibility: "Private" },
];

const flaggedChats = [
  { chatId: "DM-002", chatType: "DM", flagReason: "User report - Harassment", reportCount: 2, lastFlagged: "2024-01-15 14:22" },
  { chatId: "GRP-002", chatType: "Group", flagReason: "AI Safety - Spam content", reportCount: 5, lastFlagged: "2024-01-15 13:30" },
  { chatId: "GRP-004", chatType: "Group", flagReason: "Multiple user reports", reportCount: 8, lastFlagged: "2024-01-15 12:45" },
  { chatId: "DM-004", chatType: "DM", flagReason: "Suspicious metadata patterns", reportCount: 3, lastFlagged: "2024-01-15 11:20" },
];

const groupMembers = [
  { id: "M1", name: "John Smith", role: "Admin", joinedAt: "2024-01-01" },
  { id: "M2", name: "Sarah Wilson", role: "Moderator", joinedAt: "2024-01-05" },
  { id: "M3", name: "Mike Johnson", role: "Member", joinedAt: "2024-01-08" },
  { id: "M4", name: "Emily Davis", role: "Member", joinedAt: "2024-01-10" },
  { id: "M5", name: "Alex Brown", role: "Member", joinedAt: "2024-01-12" },
];

const chartConfig = {
  dm: { label: "Direct Messages", color: "hsl(var(--chart-1))" },
  group: { label: "Group Chats", color: "hsl(var(--chart-2))" },
};

export default function ChatManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dmMetadataModal, setDmMetadataModal] = useState<typeof dmConversations[0] | null>(null);
  const [groupDetailModal, setGroupDetailModal] = useState<typeof groupChats[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('chat.title')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage encrypted chat metadata. E2E encryption ensures message content is never accessible.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="dm">Direct Messages</TabsTrigger>
            <TabsTrigger value="groups">Group Chats</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Chats</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Active Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalActiveConversations.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">DM + Group chats</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Daily Active Chats</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.dailyActiveChats.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Active in last 24h</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">New Chats Today</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.newChatsToday}</div>
                  <p className="text-xs text-muted-foreground">Initiated today</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-destructive/30 transition-colors border-destructive/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Flagged Chats</CardTitle>
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{dashboardStats.flaggedChats}</div>
                  <p className="text-xs text-muted-foreground">Requires review</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Message Volume (7 Days)</CardTitle>
                  <CardDescription>Encrypted message throughput - metadata counts only</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={messageVolumeData}>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="dm" fill="var(--color-dm)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="group" fill="var(--color-group)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Chat Hours</CardTitle>
                  <CardDescription>Aggregated activity by hour (UTC)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end gap-1">
                    {peakHoursData.map((item) => (
                      <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t transition-all"
                          style={{
                            height: `${(item.value / 100) * 250}px`,
                            backgroundColor: `hsl(var(--chart-1) / ${0.3 + (item.value / 100) * 0.7})`,
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">{item.hour}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Flags */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Flags (Metadata Only)</CardTitle>
                <CardDescription>Content not visible - E2E encrypted</CardDescription>
              </CardHeader>
              <CardContent>
                {recentFlags.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No flagged chats today</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chat Type</TableHead>
                        <TableHead>Flag Reason</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentFlags.map((flag) => (
                        <TableRow key={flag.id}>
                          <TableCell>
                            <Badge variant={flag.chatType === "DM" ? "secondary" : "outline"}>
                              {flag.chatType}
                            </Badge>
                          </TableCell>
                          <TableCell>{flag.flagReason}</TableCell>
                          <TableCell>{flag.reportCount}</TableCell>
                          <TableCell className="text-muted-foreground">{flag.createdAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Direct Messages Tab */}
          <TabsContent value="dm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Direct Messaging Overview</CardTitle>
                <CardDescription>View and manage DM metadata. Content is E2E encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by User ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="dm-active" />
                    <Label htmlFor="dm-active" className="text-sm">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="dm-flagged" />
                    <Label htmlFor="dm-flagged" className="text-sm">Flagged</Label>
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DM ID</TableHead>
                      <TableHead>User A</TableHead>
                      <TableHead>User B</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dmConversations.map((dm) => (
                      <TableRow key={dm.dmId}>
                        <TableCell className="font-mono text-sm">{dm.dmId}</TableCell>
                        <TableCell>{dm.userA}</TableCell>
                        <TableCell>{dm.userB}</TableCell>
                        <TableCell>{dm.messageCount}</TableCell>
                        <TableCell className="text-muted-foreground">{dm.lastActive}</TableCell>
                        <TableCell>
                          {dm.flagCount > 0 ? (
                            <Badge variant="destructive">{dm.flagCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                              <DropdownMenuItem onClick={() => setDmMetadataModal(dm)}>
                                <Info className="mr-2 h-4 w-4" /> View Metadata
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserSearch className="mr-2 h-4 w-4" /> View Users
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="mr-2 h-4 w-4" /> Archive Chat
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Shield className="mr-2 h-4 w-4" /> View Flags
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

          {/* Group Chats Tab */}
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Chats</CardTitle>
                <CardDescription>Manage group chat membership and metadata. Content is E2E encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search group name..." className="pl-9" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="grp-public" />
                    <Label htmlFor="grp-public" className="text-sm">Public</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="grp-private" />
                    <Label htmlFor="grp-private" className="text-sm">Private</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="grp-flagged" />
                    <Label htmlFor="grp-flagged" className="text-sm">Flagged</Label>
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupChats.map((group) => (
                      <TableRow key={group.groupId}>
                        <TableCell className="font-mono text-sm">{group.groupId}</TableCell>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.creator}</TableCell>
                        <TableCell>{group.memberCount}</TableCell>
                        <TableCell>{group.messageCount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{group.lastActive}</TableCell>
                        <TableCell>
                          {group.flagCount > 0 ? (
                            <Badge variant="destructive">{group.flagCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                              <DropdownMenuItem onClick={() => setGroupDetailModal(group)}>
                                <Eye className="mr-2 h-4 w-4" /> View Group
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setGroupDetailModal(group)}>
                                <Users className="mr-2 h-4 w-4" /> Manage Members
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Shield className="mr-2 h-4 w-4" /> View Flags
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Archive className="mr-2 h-4 w-4" /> Archive Group
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

          {/* Flagged Chats Tab */}
          <TabsContent value="flagged" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Chats</CardTitle>
                <CardDescription>
                  Chats with safety or user-generated flags. Content is not visible - E2E encrypted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id="flag-dm" />
                    <Label htmlFor="flag-dm" className="text-sm">DM Only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="flag-groups" />
                    <Label htmlFor="flag-groups" className="text-sm">Groups Only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="flag-critical" />
                    <Label htmlFor="flag-critical" className="text-sm">Critical Flags</Label>
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chat ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Flag Reason</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Last Flagged</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedChats.map((chat) => (
                      <TableRow key={chat.chatId}>
                        <TableCell className="font-mono text-sm">{chat.chatId}</TableCell>
                        <TableCell>
                          <Badge variant={chat.chatType === "DM" ? "secondary" : "outline"}>
                            {chat.chatType}
                          </Badge>
                        </TableCell>
                        <TableCell>{chat.flagReason}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{chat.reportCount}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{chat.lastFlagged}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Info className="mr-2 h-4 w-4" /> View Metadata
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" /> Contact Participants
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Archive className="mr-2 h-4 w-4" /> Archive Chat
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
            <Card>
              <CardHeader>
                <CardTitle>General Chat Settings</CardTitle>
                <CardDescription>Configure global chat system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Direct Messaging</Label>
                    <p className="text-sm text-muted-foreground">Globally enable or disable DM for all users.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Group Chats</Label>
                    <p className="text-sm text-muted-foreground">Allow creation of new group chats.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & Encryption</CardTitle>
                <CardDescription>Encryption and retention policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E2E Encryption</Label>
                    <p className="text-sm text-muted-foreground">End-to-end encryption status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Mandatory
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Metadata Retention (Days)</Label>
                    <Input type="number" defaultValue={365} />
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-Archive Inactive Chats (Days)</Label>
                    <Input type="number" defaultValue={90} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button>Save Settings</Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* DM Metadata Modal */}
        <Dialog open={!!dmMetadataModal} onOpenChange={() => setDmMetadataModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Direct Message Metadata</DialogTitle>
            </DialogHeader>
            {dmMetadataModal && (
              <div className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DM ID</span>
                    <span className="font-mono">{dmMetadataModal.dmId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participants</span>
                    <span>{dmMetadataModal.userA}, {dmMetadataModal.userB}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Messages</span>
                    <span>{dmMetadataModal.messageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Activity</span>
                    <span>{dmMetadataModal.lastActive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Encryption</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">E2E Enabled</Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Flags & Reports</h4>
                  <p className="text-sm text-muted-foreground">Content not visible</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">Report Count</span>
                    <span>{dmMetadataModal.flagCount}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="destructive" size="sm">Archive Conversation</Button>
              <Button variant="destructive" size="sm">Delete Metadata (GDPR)</Button>
              <Button variant="secondary" size="sm" onClick={() => setDmMetadataModal(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Detail Modal */}
        <Dialog open={!!groupDetailModal} onOpenChange={() => setGroupDetailModal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Group Chat Details</DialogTitle>
            </DialogHeader>
            {groupDetailModal && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group ID</span>
                    <span className="font-mono">{groupDetailModal.groupId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Name</span>
                    <span className="font-medium">{groupDetailModal.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span>{groupDetailModal.creator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visibility</span>
                    <Badge variant="outline">{groupDetailModal.visibility}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Encryption</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">E2E Enabled</Badge>
                  </div>
                </div>

                {/* Members */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Members ({groupDetailModal.memberCount})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>
                            <Badge variant={member.role === "Admin" ? "default" : member.role === "Moderator" ? "secondary" : "outline"}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{member.joinedAt}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Flags */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Flags & Reports</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Report Count</span>
                    <span>{groupDetailModal.flagCount}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="destructive" size="sm">Archive Group</Button>
              <Button variant="destructive" size="sm">Delete Group Metadata</Button>
              <Button variant="secondary" size="sm" onClick={() => setGroupDetailModal(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
