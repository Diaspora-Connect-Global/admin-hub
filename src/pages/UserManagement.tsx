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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Plus, Download, ChevronDown, Eye, Pause, MoreHorizontal, 
  Key, Wallet, Shield, FileJson, Users, Building2, MessageSquare, 
  Heart, Briefcase, Store, FileText, History, X, Check, UserPlus,
  Globe, Phone, Mail, Calendar, MapPin, Settings, LogOut, Smartphone
} from "lucide-react";

// Sample data
const sampleUsers = [
  { id: "USR-001", name: "Kwame Asante", email: "kwame@example.com", phone: "+32 471 234 567", roles: ["Individual"], communities_count: 2, associations_count: 1, friends_count: 45, post_count: 12, trust_score: 85, status: "Active", last_active: "2024-01-15 14:30" },
  { id: "USR-002", name: "Ama Owusu", email: "ama@example.com", phone: "+32 472 345 678", roles: ["Community Admin"], communities_count: 3, associations_count: 2, friends_count: 120, post_count: 45, trust_score: 92, status: "Active", last_active: "2024-01-15 12:15" },
  { id: "USR-003", name: "Kofi Mensah", email: "kofi@example.com", phone: "+32 473 456 789", roles: ["Vendor Admin"], communities_count: 1, associations_count: 1, friends_count: 30, post_count: 8, trust_score: 78, status: "Pending Verification", last_active: "2024-01-14 18:45" },
  { id: "USR-004", name: "Akua Boateng", email: "akua@example.com", phone: "+32 474 567 890", roles: ["Association Admin"], communities_count: 2, associations_count: 3, friends_count: 67, post_count: 23, trust_score: 88, status: "Active", last_active: "2024-01-15 09:20" },
  { id: "USR-005", name: "Yaw Darko", email: "yaw@example.com", phone: "+32 475 678 901", roles: ["Individual"], communities_count: 1, associations_count: 0, friends_count: 15, post_count: 3, trust_score: 45, status: "Suspended", last_active: "2024-01-10 16:00" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Active": "badge-status badge-success",
    "Pending Verification": "badge-status badge-warning",
    "Suspended": "badge-status badge-destructive",
    "Banned": "badge-status bg-destructive text-destructive-foreground",
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
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [suspendUserOpen, setSuspendUserOpen] = useState(false);
  const [walletAdjustOpen, setWalletAdjustOpen] = useState(false);
  const [trustScoreOpen, setTrustScoreOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trustScoreRange, setTrustScoreRange] = useState([0, 100]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? sampleUsers.map(u => u.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const openUserDrawer = (user: typeof sampleUsers[0]) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleCreateUser = () => {
    toast({ title: "User Created", description: "User created and invitation email sent." });
    setCreateUserOpen(false);
  };

  const handleSuspendUser = () => {
    toast({ title: "User Suspended", description: "User account has been suspended." });
    setSuspendUserOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Users</h1>
            <p className="text-muted-foreground">Search, filter and manage platform users</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedUsers.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Export Selected</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Pause className="mr-2 h-4 w-4" /> Bulk Suspend</DropdownMenuItem>
                <DropdownMenuItem><Shield className="mr-2 h-4 w-4" /> Bulk Assign Role</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setCreateUserOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Filters Panel */}
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
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="community_admin">Community Admin</SelectItem>
                      <SelectItem value="association_admin">Association Admin</SelectItem>
                      <SelectItem value="vendor_admin">Vendor Admin</SelectItem>
                      <SelectItem value="system_admin">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending Verification</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Trust Score: {trustScoreRange[0]} - {trustScoreRange[1]}</Label>
                  <Slider
                    value={trustScoreRange}
                    onValueChange={setTrustScoreRange}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Communities</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select community..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ghana-belgium">Ghana Belgium Community</SelectItem>
                      <SelectItem value="nigeria-france">Nigeria France Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Verification</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="email">Email Verified</SelectItem>
                      <SelectItem value="phone">Phone Verified</SelectItem>
                      <SelectItem value="kyc">KYC Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">Apply</Button>
                  <Button size="sm" variant="ghost">Clear</Button>
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
                    <Input
                      placeholder="Name, email, phone, user ID, username"
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedUsers.length === sampleUsers.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role(s)</TableHead>
                        <TableHead>Communities</TableHead>
                        <TableHead>Trust Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleUsers.map((user) => (
                        <TableRow key={user.id} className="border-border/50">
                          <TableCell>
                            <Checkbox 
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{user.id}</TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map(role => (
                                <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{user.communities_count}</TableCell>
                          <TableCell>{getTrustScoreBadge(user.trust_score)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{user.last_active}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openUserDrawer(user)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setSuspendUserOpen(true); }}>
                                    <Pause className="mr-2 h-4 w-4" /> Suspend
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setResetPasswordOpen(true); }}>
                                    <Key className="mr-2 h-4 w-4" /> Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setTrustScoreOpen(true); }}>
                                    <Shield className="mr-2 h-4 w-4" /> Adjust Trust Score
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setWalletAdjustOpen(true); }}>
                                    <Wallet className="mr-2 h-4 w-4" /> Adjust Wallet Balance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileJson className="mr-2 h-4 w-4" /> Export User Data
                                  </DropdownMenuItem>
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
                  <p className="text-sm text-muted-foreground">Showing 1-5 of 5 users</p>
                  <div className="flex items-center gap-2">
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
                    <p className="text-sm text-muted-foreground font-mono">{selectedUser.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrustScoreBadge(selectedUser.trust_score)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setSuspendUserOpen(true)}>
                    <Pause className="mr-2 h-4 w-4" /> Suspend
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setResetPasswordOpen(true)}>
                    <Key className="mr-2 h-4 w-4" /> Reset Password
                  </Button>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <ScrollArea className="w-full">
                  <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
                    <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="communities" className="text-xs">Communities</TabsTrigger>
                    <TabsTrigger value="associations" className="text-xs">Associations</TabsTrigger>
                    <TabsTrigger value="posts" className="text-xs">Posts</TabsTrigger>
                    <TabsTrigger value="friends" className="text-xs">Friends</TabsTrigger>
                    <TabsTrigger value="transactions" className="text-xs">Transactions</TabsTrigger>
                    <TabsTrigger value="opportunities" className="text-xs">Opportunities</TabsTrigger>
                    <TabsTrigger value="vendor" className="text-xs">Vendor</TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                    <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
                  </TabsList>
                </ScrollArea>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Full Name</p>
                          <p>{selectedUser.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Username</p>
                          <p>@{selectedUser.name.toLowerCase().replace(' ', '_')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <p>{selectedUser.email}</p>
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Phone</p>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <p>{selectedUser.phone}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Location</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p>Brussels, Belgium</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Joined</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p>Jan 10, 2024</p>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="mt-2">Edit Profile</Button>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">2FA Enabled</p>
                          <Badge variant="secondary">Yes</Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Active Sessions</p>
                          <p>3 devices</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">OAuth Providers</p>
                          <div className="flex gap-1">
                            <Badge variant="outline">Google</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline"><LogOut className="mr-2 h-4 w-4" /> Force Logout</Button>
                        <Button size="sm" variant="outline"><Smartphone className="mr-2 h-4 w-4" /> View Sessions</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="communities" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Communities ({selectedUser.communities_count})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Community</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Ghana Belgium Community</TableCell>
                            <TableCell><Badge variant="secondary">Member</Badge></TableCell>
                            <TableCell className="text-muted-foreground">Jan 12, 2024</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">View</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>African Professionals Network</TableCell>
                            <TableCell><Badge variant="secondary">Admin</Badge></TableCell>
                            <TableCell className="text-muted-foreground">Jan 15, 2024</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">View</Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="associations" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Associations ({selectedUser.associations_count})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Association</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Ghana Nurses Association</TableCell>
                            <TableCell>Belgium</TableCell>
                            <TableCell><Badge variant="secondary">Member</Badge></TableCell>
                            <TableCell className="text-muted-foreground">Jan 14, 2024</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="posts" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Posts & Reactions ({selectedUser.post_count})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">User has {selectedUser.post_count} posts across communities.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="friends" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Friends & Connections ({selectedUser.friends_count})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">User has {selectedUser.friends_count} friends on the platform.</p>
                      <Button size="sm" variant="outline" className="mt-3">View All Friends</Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Card className="glass">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">Wallet Balance</p>
                        <p className="text-lg font-semibold text-primary">$250.00</p>
                      </CardContent>
                    </Card>
                    <Card className="glass">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">Escrow Held</p>
                        <p className="text-lg font-semibold">$0.00</p>
                      </CardContent>
                    </Card>
                    <Card className="glass">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-semibold">$1,234.00</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="glass">
                    <CardContent className="p-3">
                      <p className="text-sm text-muted-foreground">Transaction history will appear here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="opportunities" className="mt-4">
                  <Card className="glass">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Opportunities applied by this user will appear here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="vendor" className="mt-4">
                  <Card className="glass">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Vendor activity will appear here if user is a vendor.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <Card className="glass">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">KYC and uploaded documents will appear here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Audit Trail</CardTitle>
                        <Button size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Performed By</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-xs">2024-01-15 14:30:00</TableCell>
                            <TableCell><Badge variant="secondary">Login</Badge></TableCell>
                            <TableCell>Self</TableCell>
                            <TableCell className="text-muted-foreground">-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-xs">2024-01-14 10:15:00</TableCell>
                            <TableCell><Badge variant="secondary">Profile Update</Badge></TableCell>
                            <TableCell>Self</TableCell>
                            <TableCell className="text-muted-foreground">Updated bio</TableCell>
                          </TableRow>
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

      {/* Create User Modal */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Create a new user account and send an invitation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+32 471 234 567" />
            </div>
            <div className="space-y-2">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input type="password" placeholder="Min 8 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role(s)</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="community_admin">Community Admin</SelectItem>
                  <SelectItem value="association_admin">Association Admin</SelectItem>
                  <SelectItem value="vendor_admin">Vendor Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Modal */}
      <Dialog open={suspendUserOpen} onOpenChange={setSuspendUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>Suspend {selectedUser?.name}'s account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Suspension <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Enter reason..." />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select defaultValue="indefinite">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                  <SelectItem value="1day">1 day</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="notify" defaultChecked />
              <Label htmlFor="notify" className="text-sm">Notify user by email</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendUserOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspendUser}>Suspend User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Send a password reset email to {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            This will send a password reset email to the user's primary email address. Continue?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Password Reset Email Sent" }); setResetPasswordOpen(false); }}>
              Send Reset Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Adjust Modal */}
      <Dialog open={walletAdjustOpen} onOpenChange={setWalletAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Wallet Balance</DialogTitle>
            <DialogDescription>Adjust wallet balance for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Adjustment Amount <span className="text-destructive">*</span></Label>
              <Input type="number" placeholder="Enter amount (positive or negative)" />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select defaultValue="usd">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="ghs">GHS</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Enter reason for adjustment..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletAdjustOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { toast({ title: "Wallet Adjusted" }); setWalletAdjustOpen(false); }}>
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trust Score Modal */}
      <Dialog open={trustScoreOpen} onOpenChange={setTrustScoreOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Trust Score</DialogTitle>
            <DialogDescription>Current score: {selectedUser?.trust_score}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Trust Score (0-100) <span className="text-destructive">*</span></Label>
              <Input type="number" min={0} max={100} defaultValue={selectedUser?.trust_score} />
            </div>
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Enter reason for adjustment..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrustScoreOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Trust Score Updated" }); setTrustScoreOpen(false); }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
