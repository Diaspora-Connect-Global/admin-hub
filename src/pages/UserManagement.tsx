import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetUsers } from "@/hooks/user";
import {
  useDiscoverAssociations,
  useListCommunities,
  useGetAuditLogs,
  useGetUserPosts,
  useGetUserGroups,
  useGetUserOpportunities,
  useGetUserTransactions,
  useAdminBanUser,
  useAdminUnbanUser,
} from "@/hooks/admin";
import { useApolloClient } from "@apollo/client/react";
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
  Key, FileJson, Mail, Phone, Calendar, MapPin, Building2, Users,
  Ban, ShieldOff, Loader2
} from "lucide-react";

/** Table row shape for the users table (API data mapped + defaults for missing fields). */
export type UserTableRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  communitiesCount: number;
  associationsCount: number;
  postsCount: number;
  reactionsCount: number;
  groupsCount: number;
  opportunitiesApplied: number;
  trustScore: number;
  status: string;
  createdAt: string;
};

function mapApiUserToRow(item: {
  id?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
}): UserTableRow {
  const id = item.id ?? item.userId ?? "";
  const name = [item.firstName, item.lastName].filter(Boolean).join(" ") || "—";
  return {
    id,
    name,
    email: item.email ?? "",
    phone: item.phone ?? "—",
    role: "Individual",
    communitiesCount: 0,
    associationsCount: 0,
    postsCount: 0,
    reactionsCount: 0,
    groupsCount: 0,
    opportunitiesApplied: 0,
    trustScore: 0,
    status: "Active",
    createdAt: item.createdAt ?? "",
  };
}


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
  const { t } = useTranslation();
  const apolloClient = useApolloClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const pageLimit = 20;

  // Ban / Unban state
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banTargetUser, setBanTargetUser] = useState<UserTableRow | null>(null);

  const [adminBanUser, { loading: banLoading }] = useAdminBanUser();
  const [adminUnbanUser, { loading: unbanLoading }] = useAdminUnbanUser();

  const openBanDialog = (user: UserTableRow) => {
    setBanTargetUser(user);
    setBanReason("");
    setBanDialogOpen(true);
  };

  const openUnbanDialog = (user: UserTableRow) => {
    setBanTargetUser(user);
    setUnbanDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!banTargetUser) return;
    try {
      await adminBanUser({ variables: { userId: banTargetUser.id, reason: banReason || "Violation of terms" } });
      toast({ title: "User Banned", description: `${banTargetUser.name} has been banned.` });
      setBanDialogOpen(false);
      await apolloClient.refetchQueries({ include: ["GetUsers"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to ban user.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleUnbanUser = async () => {
    if (!banTargetUser) return;
    try {
      await adminUnbanUser({ variables: { userId: banTargetUser.id } });
      toast({ title: "User Unbanned", description: `${banTargetUser.name} has been unbanned.` });
      setUnbanDialogOpen(false);
      await apolloClient.refetchQueries({ include: ["GetUsers"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unban user.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const { data, loading, error } = useGetUsers({
    limit: pageLimit,
    offset: pageOffset,
    search: searchQuery || undefined,
  });

  const users: UserTableRow[] = useMemo(() => {
    const items = data?.getUsers?.items;
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => mapApiUserToRow(item));
  }, [data]);

  const totalUsers = data?.getUsers?.total ?? 0;

  // Modals
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [suspendUserOpen, setSuspendUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  // Filters
  const [communityFilter, setCommunityFilter] = useState("all");
  const [associationFilter, setAssociationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trustScoreRange, setTrustScoreRange] = useState([0, 100]);

  const { data: communitiesData, loading: communitiesLoading } = useListCommunities({
    limit: 500,
    offset: 0,
  });

  const { data: associationsData, loading: associationsLoading } = useDiscoverAssociations({
    limit: 500,
    offset: 0,
  });

  const communityOptions = communitiesData?.listCommunities?.communities ?? [];
  const associationOptions = (
    associationsData as { discoverAssociations?: { associations?: { id: string; name: string }[] } } | undefined
  )?.discoverAssociations?.associations ?? [];

  const { data: userAuditData } = useGetAuditLogs({
    actorId: selectedUser?.id ?? null,
    limit: 20,
  });

  const { data: userPostsData, loading: userPostsLoading } = useGetUserPosts(selectedUser?.id ?? null, 20);
  const { data: userGroupsData, loading: userGroupsLoading } = useGetUserGroups(selectedUser?.id ?? null, 20);
  const { data: userOppsData, loading: userOppsLoading } = useGetUserOpportunities(selectedUser?.id ?? null, 20);
  const { data: userTxData, loading: userTxLoading } = useGetUserTransactions(selectedUser?.id ?? null, 20);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesTrustScore = user.trustScore >= trustScoreRange[0] && user.trustScore <= trustScoreRange[1];
    return matchesSearch && matchesStatus && matchesTrustScore;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map(u => u.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  };

  const openUserDrawer = (user: UserTableRow) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('users.title')}</h1>
            <p className="text-muted-foreground">{t('users.searchPlaceholder')}</p>
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

        <div className="space-y-4">
          {/* Filters Panel */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filters</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="flex min-w-[920px] items-end gap-4">
                <div className="w-56 space-y-2">
                  <Label className="text-xs text-muted-foreground">Community</Label>
                  <Select value={communityFilter} onValueChange={setCommunityFilter}>
                    <SelectTrigger><SelectValue placeholder="Select community..." /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Communities</SelectItem>
                      {communitiesLoading ? (
                        <SelectItem value="communities-loading" disabled>Loading communities...</SelectItem>
                      ) : (
                        communityOptions.map((community) => (
                          <SelectItem key={community.id} value={community.id}>{community.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-56 space-y-2">
                  <Label className="text-xs text-muted-foreground">Association</Label>
                  <Select value={associationFilter} onValueChange={setAssociationFilter}>
                    <SelectTrigger><SelectValue placeholder="Select association..." /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Associations</SelectItem>
                      {associationsLoading ? (
                        <SelectItem value="associations-loading" disabled>Loading associations...</SelectItem>
                      ) : (
                        associationOptions.map((association: { id: string; name: string }) => (
                          <SelectItem key={association.id} value={association.id}>{association.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-44 space-y-2">
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
                <div className="w-64 space-y-2">
                  <Label className="text-xs text-muted-foreground">Trust Score: {trustScoreRange[0]} - {trustScoreRange[1]}</Label>
                  <Slider value={trustScoreRange} onValueChange={setTrustScoreRange} min={0} max={100} step={5} className="mt-2" />
                </div>
                <div className="flex gap-2 pb-0.5">
                  <Button size="sm">Apply</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setCommunityFilter("all"); setAssociationFilter("all"); setStatusFilter("all"); setTrustScoreRange([0, 100]); }}>Clear</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Table */}
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
                        <TableHead className="w-12"><Checkbox checked={users.length > 0 && selectedUsers.length === users.length} onCheckedChange={handleSelectAll} /></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Trust Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading users...</TableCell></TableRow>
                      ) : error ? (
                        <TableRow><TableCell colSpan={9} className="text-center text-destructive py-8">Failed to load users.</TableCell></TableRow>
                      ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-border/50">
                          <TableCell><Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)} /></TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone}</TableCell>
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
                                  {user.status !== "Suspended" ? (
                                    <DropdownMenuItem onClick={() => openBanDialog(user)} className="text-destructive">
                                      <Ban className="mr-2 h-4 w-4" /> Ban User
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => openUnbanDialog(user)}>
                                      <ShieldOff className="mr-2 h-4 w-4" /> Unban User
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setResetPasswordOpen(true); }}><Key className="mr-2 h-4 w-4" /> Reset Password</DropdownMenuItem>
                                  <DropdownMenuItem><FileJson className="mr-2 h-4 w-4" /> Export Data</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                  <p className="text-sm text-muted-foreground">Showing {users.length ? pageOffset + 1 : 0}-{pageOffset + filteredUsers.length} of {totalUsers} users</p>
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
                  {selectedUser.status !== "Suspended" ? (
                    <Button size="sm" variant="destructive" onClick={() => openBanDialog(selectedUser)} disabled={banLoading}>
                      {banLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />} Ban User
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => openUnbanDialog(selectedUser)} disabled={unbanLoading}>
                      {unbanLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />} Unban User
                    </Button>
                  )}
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
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Community & Association Memberships</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground py-2">Membership details are managed via the Communities and Associations pages.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="posts" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Posts & Reactions</CardTitle>
                      <CardDescription>Recent posts by this user across all communities.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Content</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Community</TableHead>
                            <TableHead>Likes</TableHead>
                            <TableHead>Comments</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Posted At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userPostsLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Loading posts...</TableCell></TableRow>
                          ) : (userPostsData?.getUserPosts?.items ?? []).length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No posts found for this user.</TableCell></TableRow>
                          ) : (
                            (userPostsData?.getUserPosts?.items ?? []).map((post) => (
                              <TableRow key={post.id}>
                                <TableCell className="max-w-[180px] truncate text-sm">{post.content ?? "—"}</TableCell>
                                <TableCell><Badge variant="secondary">{post.postType ?? "—"}</Badge></TableCell>
                                <TableCell className="text-muted-foreground text-xs">{post.communityName ?? "—"}</TableCell>
                                <TableCell className="text-muted-foreground">{post.likeCount}</TableCell>
                                <TableCell className="text-muted-foreground">{post.commentCount}</TableCell>
                                <TableCell>{post.status ? getStatusBadge(post.status) : "—"}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="groups" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Groups</CardTitle>
                      <CardDescription>Groups the user has joined.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Group Name</TableHead>
                            <TableHead>Community</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userGroupsLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Loading groups...</TableCell></TableRow>
                          ) : (userGroupsData?.getUserGroups?.items ?? []).length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No groups found for this user.</TableCell></TableRow>
                          ) : (
                            (userGroupsData?.getUserGroups?.items ?? []).map((group) => (
                              <TableRow key={group.id}>
                                <TableCell className="font-medium text-sm">{group.name}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{group.communityName ?? "—"}</TableCell>
                                <TableCell className="text-muted-foreground"><div className="flex items-center gap-1"><Users className="h-3 w-3" />{group.memberCount}</div></TableCell>
                                <TableCell><Badge variant="secondary">{group.role ?? "Member"}</Badge></TableCell>
                                <TableCell className="text-muted-foreground text-xs">{group.joinedAt ? new Date(group.joinedAt).toLocaleDateString() : "—"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="opportunities" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Opportunities</CardTitle>
                      <CardDescription>Opportunities this user posted or applied to.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Community</TableHead>
                            <TableHead>Applicants</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Posted At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userOppsLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Loading opportunities...</TableCell></TableRow>
                          ) : (userOppsData?.getUserOpportunities?.items ?? []).length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No opportunities found for this user.</TableCell></TableRow>
                          ) : (
                            (userOppsData?.getUserOpportunities?.items ?? []).map((opp) => (
                              <TableRow key={opp.id}>
                                <TableCell className="font-medium text-sm max-w-[160px] truncate">{opp.title}</TableCell>
                                <TableCell><Badge variant="secondary">{opp.type ?? "—"}</Badge></TableCell>
                                <TableCell className="text-muted-foreground text-xs">{opp.communityName ?? "—"}</TableCell>
                                <TableCell className="text-muted-foreground">{opp.applicants}</TableCell>
                                <TableCell>{opp.status ? getStatusBadge(opp.status) : "—"}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{opp.postedAt ? new Date(opp.postedAt).toLocaleDateString() : "—"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Transactions</CardTitle>
                      <CardDescription>All escrow or platform transactions this user participated in.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userTxLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Loading transactions...</TableCell></TableRow>
                          ) : (userTxData?.getUserTransactions?.items ?? []).length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No transactions found for this user.</TableCell></TableRow>
                          ) : (
                            (userTxData?.getUserTransactions?.items ?? []).map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">{tx.id.slice(0, 8)}…</TableCell>
                                <TableCell><Badge variant="secondary">{tx.type ?? "—"}</Badge></TableCell>
                                <TableCell className="font-medium">{tx.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-muted-foreground">{tx.currency ?? "USD"}</TableCell>
                                <TableCell className="text-muted-foreground text-xs max-w-[140px] truncate">{tx.description ?? "—"}</TableCell>
                                <TableCell>{tx.status ? getStatusBadge(tx.status) : "—"}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-4">
                  <Card className="glass">
                    <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-sm">Audit Log</CardTitle><Button size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button></div><CardDescription>Logs of admin actions where this user is the actor.</CardDescription></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Resource Type</TableHead><TableHead>Resource ID</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {(userAuditData?.getAuditLogs?.items ?? []).length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No audit events found for this user</TableCell></TableRow>
                          ) : (
                            (userAuditData?.getAuditLogs?.items ?? []).map((l: { id: string; action: string; resourceType?: string; resourceId?: string; createdAt: string }) => (
                              <TableRow key={l.id}><TableCell className="font-mono text-xs">{new Date(l.createdAt).toLocaleString()}</TableCell><TableCell><Badge variant="secondary">{l.action}</Badge></TableCell><TableCell className="text-muted-foreground">{l.resourceType ?? "—"}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{l.resourceId ? l.resourceId.slice(0, 8) + "…" : "—"}</TableCell></TableRow>
                            ))
                          )}
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

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>Ban {banTargetUser?.name} from the platform. They will lose access immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Enter reason for ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)} disabled={banLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={banLoading || !banReason.trim()}>
              {banLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription>Are you sure you want to unban {banTargetUser?.name}? They will regain access to the platform.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnbanDialogOpen(false)} disabled={unbanLoading}>Cancel</Button>
            <Button onClick={handleUnbanUser} disabled={unbanLoading}>
              {unbanLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Unban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
