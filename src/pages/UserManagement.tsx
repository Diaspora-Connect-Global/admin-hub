import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, UserPlus, Download, ChevronDown, Eye, Pause, MoreHorizontal, 
  Key, FileJson, Mail, Phone, Calendar, MapPin, Building2, Users
} from "lucide-react";

const sampleUsers = [
  { id: "USR-001", name: "Kwame Asante", email: "kwame@example.com", phone: "+32 471 234 567", role: "Individual", communitiesCount: 2, associationsCount: 1, postsCount: 12, reactionsCount: 45, groupsCount: 3, opportunitiesApplied: 2, trustScore: 85, status: "Active", createdAt: "2024-01-10" },
  { id: "USR-002", name: "Ama Owusu", email: "ama@example.com", phone: "+32 472 345 678", role: "Community Admin", communitiesCount: 3, associationsCount: 2, postsCount: 45, reactionsCount: 120, groupsCount: 5, opportunitiesApplied: 0, trustScore: 92, status: "Active", createdAt: "2024-01-08" },
  { id: "USR-003", name: "Kofi Mensah", email: "kofi@example.com", phone: "+32 473 456 789", role: "Association Admin", communitiesCount: 1, associationsCount: 3, postsCount: 8, reactionsCount: 30, groupsCount: 2, opportunitiesApplied: 5, trustScore: 78, status: "Inactive", createdAt: "2024-01-05" },
  { id: "USR-004", name: "Akua Boateng", email: "akua@example.com", phone: "+32 474 567 890", role: "Individual", communitiesCount: 2, associationsCount: 1, postsCount: 23, reactionsCount: 67, groupsCount: 4, opportunitiesApplied: 3, trustScore: 88, status: "Active", createdAt: "2024-01-12" },
  { id: "USR-005", name: "Yaw Darko", email: "yaw@example.com", phone: "+32 475 678 901", role: "Individual", communitiesCount: 1, associationsCount: 0, postsCount: 3, reactionsCount: 15, groupsCount: 1, opportunitiesApplied: 8, trustScore: 45, status: "Suspended", createdAt: "2024-01-03" },
];

const userCommunities = [
  { id: "COM-001", name: "Ghana Belgium Community", country: "Belgium" },
  { id: "COM-002", name: "African Professionals Network", country: "Europe" },
];

const userAssociations = [
  { id: "ASC-001", name: "Ghana Nurses Association", country: "Belgium" },
];

const userPosts = [
  { id: "PST-001", contentPreview: "Excited about the upcoming community event!", media: "1 image", likesCount: 25, commentsCount: 8, createdAt: "2024-01-15", status: "Published" },
  { id: "PST-002", contentPreview: "Sharing some thoughts on diaspora networking...", media: "-", likesCount: 12, commentsCount: 3, createdAt: "2024-01-12", status: "Published" },
];

const userGroups = [
  { id: "GRP-001", name: "Healthcare Professionals", roleInGroup: "Member", joinedAt: "2024-01-10" },
  { id: "GRP-002", name: "Brussels Ghanaians", roleInGroup: "Admin", joinedAt: "2024-01-08" },
];

const userOpportunities = [
  { id: "OPP-001", title: "Senior Nurse Position", type: "Job", status: "Applied", appliedAt: "2024-01-14", outcome: "Pending" },
  { id: "OPP-002", title: "Healthcare Conference", type: "Event", status: "Applied", appliedAt: "2024-01-10", outcome: "Accepted" },
];

const userTransactions = [
  { id: "TXN-001", type: "Payment", amount: "$150.00", status: "Completed", createdAt: "2024-01-15", relatedEntity: "Vendor Purchase" },
  { id: "TXN-002", type: "Escrow", amount: "$500.00", status: "Held", createdAt: "2024-01-12", relatedEntity: "Service Contract" },
];

const userAuditLogs = [
  { timestamp: "2024-01-15 14:30:00", action: "Login", performedBy: "Self", notes: "-" },
  { timestamp: "2024-01-14 10:15:00", action: "Profile Update", performedBy: "Self", notes: "Updated bio" },
  { timestamp: "2024-01-10 09:00:00", action: "Role Change", performedBy: "Admin User", notes: "Assigned Community Admin role" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Active": "badge-status badge-success",
    "Inactive": "badge-status badge-warning",
    "Suspended": "badge-status badge-destructive",
    "Published": "badge-status badge-success",
    "Applied": "badge-status badge-info",
    "Completed": "badge-status badge-success",
    "Held": "badge-status badge-warning",
    "Pending": "badge-status badge-warning",
    "Accepted": "badge-status badge-success",
  };
  return <span className={styles[status] || "badge-status badge-muted"}>{status}</span>;
};

const getTrustScoreBadge = (score: number) => {
  if (score >= 80) return <span className="badge-status badge-success">{score}</span>;
  if (score >= 60) return <span className="badge-status badge-warning">{score}</span>;
  return <span className="badge-status badge-destructive">{score}</span>;
};

export default function UserManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<typeof sampleUsers[0] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Modals
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [suspendUserOpen, setSuspendUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trustScoreRange, setTrustScoreRange] = useState([0, 100]);

  const filteredUsers = sampleUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesTrustScore = user.trustScore >= trustScoreRange[0] && user.trustScore <= trustScoreRange[1];
    return matchesSearch && matchesRole && matchesStatus && matchesTrustScore;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? sampleUsers.map(u => u.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  };

  const openUserDrawer = (user: typeof sampleUsers[0]) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
            <p className="text-muted-foreground">View and manage all platform users, their activities, and history.</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedUsers.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Bulk Export</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Pause className="mr-2 h-4 w-4" /> Bulk Suspend</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setInviteUserOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Invite User
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Panel */}
          <div className="w-64 shrink-0 space-y-4">
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Association Admin">Association Admin</SelectItem>
                      <SelectItem value="Community Admin">Community Admin</SelectItem>
                      <SelectItem value="System Admin">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Community</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select community..." /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="com1">Ghana Belgium Community</SelectItem>
                      <SelectItem value="com2">Nigeria France Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Association</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select association..." /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="asc1">Ghana Nurses Association</SelectItem>
                      <SelectItem value="asc2">Nigerian Engineers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Trust Score: {trustScoreRange[0]} - {trustScoreRange[1]}</Label>
                  <Slider value={trustScoreRange} onValueChange={setTrustScoreRange} min={0} max={100} step={5} className="mt-2" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">Apply</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setRoleFilter("all"); setStatusFilter("all"); setTrustScoreRange([0, 100]); }}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table */}
          <div className="flex-1">
            <Card className="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Name, email, phone, user ID" className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-12"><Checkbox checked={selectedUsers.length === sampleUsers.length} onCheckedChange={handleSelectAll} /></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Communities</TableHead>
                        <TableHead>Associations</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>Reactions</TableHead>
                        <TableHead>Groups</TableHead>
                        <TableHead>Opportunities</TableHead>
                        <TableHead>Trust Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-border/50">
                          <TableCell><Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)} /></TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                          <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                          <TableCell>{user.communitiesCount}</TableCell>
                          <TableCell>{user.associationsCount}</TableCell>
                          <TableCell>{user.postsCount}</TableCell>
                          <TableCell>{user.reactionsCount}</TableCell>
                          <TableCell>{user.groupsCount}</TableCell>
                          <TableCell>{user.opportunitiesApplied}</TableCell>
                          <TableCell>{getTrustScoreBadge(user.trustScore)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openUserDrawer(user)}><Eye className="h-4 w-4" /></Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border">
                                  <DropdownMenuItem onClick={() => openUserDrawer(user)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setEditUserOpen(true); }}><UserPlus className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setSuspendUserOpen(true); }} className="text-destructive"><Pause className="mr-2 h-4 w-4" /> Suspend</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setResetPasswordOpen(true); }}><Key className="mr-2 h-4 w-4" /> Reset Password</DropdownMenuItem>
                                  <DropdownMenuItem><FileJson className="mr-2 h-4 w-4" /> Export Data</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                  <p className="text-sm text-muted-foreground">Showing 1-{filteredUsers.length} of {filteredUsers.length} users</p>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="10">
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* User Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-xl">{selectedUser.name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />{selectedUser.email}
                      <span>•</span>
                      <Phone className="h-3 w-3" />{selectedUser.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedUser.role}</Badge>
                    {getTrustScoreBadge(selectedUser.trustScore)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setEditUserOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => setSuspendUserOpen(true)}><Pause className="mr-2 h-4 w-4" /> Suspend</Button>
                  <Button size="sm" variant="outline" onClick={() => setResetPasswordOpen(true)}><Key className="mr-2 h-4 w-4" /> Reset Password</Button>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <ScrollArea className="w-full">
                  <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
                    <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="posts" className="text-xs">Posts & Reactions</TabsTrigger>
                    <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
                    <TabsTrigger value="opportunities" className="text-xs">Opportunities</TabsTrigger>
                    <TabsTrigger value="transactions" className="text-xs">Transactions</TabsTrigger>
                    <TabsTrigger value="audit" className="text-xs">Audit Log</TabsTrigger>
                  </TabsList>
                </ScrollArea>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <Card className="glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-muted-foreground text-xs">Full Name</p><p>{selectedUser.name}</p></div>
                      <div><p className="text-muted-foreground text-xs">Email</p><div className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /><p>{selectedUser.email}</p></div></div>
                      <div><p className="text-muted-foreground text-xs">Phone</p><div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /><p>{selectedUser.phone}</p></div></div>
                      <div><p className="text-muted-foreground text-xs">Role</p><Badge variant="secondary">{selectedUser.role}</Badge></div>
                      <div><p className="text-muted-foreground text-xs">Status</p>{getStatusBadge(selectedUser.status)}</div>
                      <div><p className="text-muted-foreground text-xs">Trust Score</p>{getTrustScoreBadge(selectedUser.trustScore)}</div>
                      <div><p className="text-muted-foreground text-xs">Joined</p><div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /><p>{selectedUser.createdAt}</p></div></div>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Community Memberships ({userCommunities.length})</CardTitle></CardHeader>
                    <CardContent>
                      {userCommunities.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 mb-2">
                          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.country}</p></div></div>
                          <div className="flex gap-1"><Button variant="ghost" size="sm">View</Button><Button variant="ghost" size="sm" className="text-destructive">Remove</Button></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Association Memberships ({userAssociations.length})</CardTitle></CardHeader>
                    <CardContent>
                      {userAssociations.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 mb-2">
                          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><div><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.country}</p></div></div>
                          <div className="flex gap-1"><Button variant="ghost" size="sm">View</Button><Button variant="ghost" size="sm" className="text-destructive">Remove</Button></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="posts" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Posts & Reactions ({userPosts.length})</CardTitle><CardDescription>All posts by the user including reactions and comments.</CardDescription></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Post ID</TableHead><TableHead>Content</TableHead><TableHead>Media</TableHead><TableHead>Likes</TableHead><TableHead>Comments</TableHead><TableHead>Created At</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {userPosts.map((p) => (
                            <TableRow key={p.id}><TableCell className="font-mono text-xs">{p.id}</TableCell><TableCell className="max-w-[150px] truncate">{p.contentPreview}</TableCell><TableCell>{p.media}</TableCell><TableCell>{p.likesCount}</TableCell><TableCell>{p.commentsCount}</TableCell><TableCell className="text-muted-foreground">{p.createdAt}</TableCell><TableCell>{getStatusBadge(p.status)}</TableCell><TableCell><Button variant="ghost" size="sm">View</Button></TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="groups" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Groups ({userGroups.length})</CardTitle><CardDescription>Groups the user has joined.</CardDescription></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Group Name</TableHead><TableHead>Role</TableHead><TableHead>Joined At</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {userGroups.map((g) => (
                            <TableRow key={g.id}><TableCell className="font-medium">{g.name}</TableCell><TableCell><Badge variant="secondary">{g.roleInGroup}</Badge></TableCell><TableCell className="text-muted-foreground">{g.joinedAt}</TableCell><TableCell><Button variant="ghost" size="sm">View</Button><Button variant="ghost" size="sm" className="text-destructive">Remove</Button></TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="opportunities" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Opportunities Applied & Received</CardTitle><CardDescription>Track all opportunities the user applied for and outcomes.</CardDescription></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Applied At</TableHead><TableHead>Outcome</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {userOpportunities.map((o) => (
                            <TableRow key={o.id}><TableCell className="font-medium">{o.title}</TableCell><TableCell><Badge variant="outline">{o.type}</Badge></TableCell><TableCell>{getStatusBadge(o.status)}</TableCell><TableCell className="text-muted-foreground">{o.appliedAt}</TableCell><TableCell>{getStatusBadge(o.outcome)}</TableCell><TableCell><Button variant="ghost" size="sm">View</Button></TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Transactions</CardTitle><CardDescription>All escrow or platform transactions the user participated in.</CardDescription></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Transaction ID</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Related Entity</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {userTransactions.map((t) => (
                            <TableRow key={t.id}><TableCell className="font-mono text-xs">{t.id}</TableCell><TableCell>{t.type}</TableCell><TableCell>{t.amount}</TableCell><TableCell>{getStatusBadge(t.status)}</TableCell><TableCell className="text-muted-foreground">{t.createdAt}</TableCell><TableCell>{t.relatedEntity}</TableCell><TableCell><Button variant="ghost" size="sm">View</Button></TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Audit Log</CardTitle><Button size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button></div><CardDescription>Logs of user-related actions performed by admins.</CardDescription></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Performed By</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {userAuditLogs.map((l, idx) => (
                            <TableRow key={idx}><TableCell className="font-mono text-xs">{l.timestamp}</TableCell><TableCell><Badge variant="secondary">{l.action}</Badge></TableCell><TableCell>{l.performedBy}</TableCell><TableCell className="text-muted-foreground">{l.notes}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Invite User Modal */}
      <Dialog open={inviteUserOpen} onOpenChange={setInviteUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Invite User</DialogTitle><DialogDescription>Invite a new user to the platform.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Full Name <span className="text-destructive">*</span></Label><Input placeholder="Jane Doe" /></div>
            <div className="space-y-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" placeholder="jane@example.com" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input placeholder="+32 471 234 567" /></div>
            <div className="space-y-2"><Label>Role <span className="text-destructive">*</span></Label><Select><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="individual">Individual</SelectItem><SelectItem value="assoc_admin">Association Admin</SelectItem><SelectItem value="comm_admin">Community Admin</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Assign Communities</Label><Select><SelectTrigger><SelectValue placeholder="Select communities..." /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="com1">Ghana Belgium Community</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Assign Associations</Label><Select><SelectTrigger><SelectValue placeholder="Select associations..." /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="asc1">Ghana Nurses Association</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setInviteUserOpen(false)}>Cancel</Button><Button onClick={() => { toast({ title: "Invitation Sent" }); setInviteUserOpen(false); }}>Send Invite</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update user information for {selectedUser?.name}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Full Name <span className="text-destructive">*</span></Label><Input defaultValue={selectedUser?.name} /></div>
            <div className="space-y-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" defaultValue={selectedUser?.email} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input defaultValue={selectedUser?.phone} /></div>
            <div className="space-y-2"><Label>Role</Label><Select defaultValue={selectedUser?.role?.toLowerCase().replace(' ', '_')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="individual">Individual</SelectItem><SelectItem value="association_admin">Association Admin</SelectItem><SelectItem value="community_admin">Community Admin</SelectItem><SelectItem value="system_admin">System Admin</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Trust Score (0-100)</Label><Input type="number" min={0} max={100} defaultValue={selectedUser?.trustScore} /></div>
            <div className="space-y-2"><Label>Status</Label><Select defaultValue={selectedUser?.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Suspended">Suspended</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button><Button onClick={() => { toast({ title: "User Updated" }); setEditUserOpen(false); }}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Modal */}
      <Dialog open={suspendUserOpen} onOpenChange={setSuspendUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Suspend User</DialogTitle><DialogDescription>Suspend {selectedUser?.name}'s account</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Reason <span className="text-destructive">*</span></Label><Textarea placeholder="Enter reason for suspension..." /></div>
            <div className="space-y-2"><Label>Duration</Label><Select defaultValue="indefinite"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="indefinite">Indefinite</SelectItem><SelectItem value="1day">1 day</SelectItem><SelectItem value="7days">7 days</SelectItem><SelectItem value="30days">30 days</SelectItem></SelectContent></Select></div>
            <p className="text-xs text-muted-foreground">Suspending will block all user activity and posts.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSuspendUserOpen(false)}>Cancel</Button><Button variant="destructive" onClick={() => { toast({ title: "User Suspended" }); setSuspendUserOpen(false); }}>Suspend</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reset Password</DialogTitle><DialogDescription>Send password reset email to {selectedUser?.email}</DialogDescription></DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">Are you sure you want to reset this user's password? They will receive an email to set a new password.</p>
          <DialogFooter><Button variant="outline" onClick={() => setResetPasswordOpen(false)}>Cancel</Button><Button onClick={() => { toast({ title: "Reset Email Sent" }); setResetPasswordOpen(false); }}>Confirm Reset</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
