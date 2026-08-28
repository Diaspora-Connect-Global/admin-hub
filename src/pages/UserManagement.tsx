import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetUsers } from "@/hooks/user";
import { useDiscoverAssociations, useListCommunities } from "@/hooks/admin";
import { useApolloClient } from "@apollo/client/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  AccountStatusBadge,
  normalizeAccountStatus,
  type AccountStatus,
} from "@/components/user/accountStatus";
import {
  RegistrationMethodBadge,
  normalizeRegistrationMethod,
  type RegistrationMethod,
} from "@/components/user/registrationMethod";
import { useUserEnforcement, UserEnforcementDialogs } from "@/components/user/UserEnforcement";
import {
  Search, UserPlus, Download, ChevronDown, Eye, Pause, Play, MoreHorizontal,
  Key, FileJson, Ban, ShieldOff, Gavel
} from "lucide-react";

/** Table row shape for the users table (mapped from backend Profile). */
export type UserTableRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  accountStatus: AccountStatus;
  statusReason: string | null;
  suspendedUntil: string | null;
  registrationMethod: RegistrationMethod;
};

function mapApiUserToRow(item: {
  id?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
  accountStatus?: string | null;
  statusReason?: string | null;
  suspendedUntil?: string | null;
  registrationMethod?: string | null;
}): UserTableRow {
  const id = item.id ?? item.userId ?? "";
  const name = [item.firstName, item.lastName].filter(Boolean).join(" ") || "—";
  return {
    id,
    name,
    email: item.email ?? "",
    phone: item.phone ?? "—",
    role: "Individual",
    createdAt: item.createdAt ?? "",
    accountStatus: normalizeAccountStatus(item.accountStatus),
    statusReason: item.statusReason ?? null,
    suspendedUntil: item.suspendedUntil ?? null,
    registrationMethod: normalizeRegistrationMethod(item.registrationMethod),
  };
}

export default function UserManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  /** Only the Edit dialog needs a "current" row now that View is a route. */
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);
  const [pageOffset, setPageOffset] = useState(0);
  const pageLimit = 20;

  // Suspend / unsuspend / ban / unban, the password-reset mail and the GDPR
  // legal hold all live in one shared hook (`src/components/user/UserEnforcement`),
  // used verbatim by the user-detail page too, so the row menu and the detail
  // header can never drift apart. The dialogs are rendered by
  // <UserEnforcementDialogs /> at the bottom of this page.
  const enforcement = useUserEnforcement({
    // Refetch so the Status column reflects the new state rather than the state
    // the admin acted on a moment ago.
    onStatusChanged: async () => {
      await apolloClient.refetchQueries({ include: ["GetUsers"] });
    },
  });

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
  const hasMore = data?.getUsers?.hasMore ?? false;

  // Modals
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);

  // Filters
  const [communityFilter, setCommunityFilter] = useState("all");
  const [associationFilter, setAssociationFilter] = useState("all");

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

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map(u => u.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  };

  /**
   * "View" opens the routed user-detail page, not a drawer, so a user is
   * linkable and survives a refresh. The row travels in router state as a
   * shortcut only — the page re-loads everything from the id in the URL.
   */
  const openUserPage = (user: UserTableRow) => {
    navigate(`/users/${user.id}`, { state: { user } });
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
                {/*
                  "Bulk Suspend" was removed rather than wired: it was a dead
                  menu item with no handler, and there is no bulk-suspend rpc to
                  back it. Suspend one account at a time from the row menu,
                  where the required reason is captured per user.
                */}
                <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Bulk Export</DropdownMenuItem>
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
                <div className="flex gap-2 pb-0.5">
                  <Button size="sm">Apply</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setCommunityFilter("all"); setAssociationFilter("all"); }}>Clear</Button>
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
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("users.registrationMethod.label")}</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading users...</TableCell></TableRow>
                      ) : error ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-destructive py-8">Failed to load users.</TableCell></TableRow>
                      ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-border/50">
                          <TableCell><Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)} /></TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                          <TableCell><AccountStatusBadge accountStatus={user.accountStatus} statusReason={user.statusReason} suspendedUntil={user.suspendedUntil} /></TableCell>
                          <TableCell><RegistrationMethodBadge method={user.registrationMethod} /></TableCell>
                          <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" aria-label={t("common.view")} onClick={() => openUserPage(user)}><Eye className="h-4 w-4" /></Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={t("common.actions")}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border">
                                  <DropdownMenuItem onClick={() => openUserPage(user)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setEditUserOpen(true); }}><UserPlus className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                  {/*
                                    Status-aware: offer the transition that is
                                    actually available. When the status is
                                    UNKNOWN we show both directions rather than
                                    guess — hiding the remedy an admin needs is
                                    worse than showing one that no-ops.
                                  */}
                                  {user.accountStatus !== "SUSPENDED" && (
                                    <DropdownMenuItem onClick={() => enforcement.openSuspendDialog(user)} className="text-destructive">
                                      <Pause className="mr-2 h-4 w-4" /> {t("users.suspend.action")}
                                    </DropdownMenuItem>
                                  )}
                                  {(user.accountStatus === "SUSPENDED" || user.accountStatus === null) && (
                                    <DropdownMenuItem onClick={() => enforcement.openUnsuspendDialog(user)}>
                                      <Play className="mr-2 h-4 w-4" /> {t("users.unsuspend.action")}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {user.accountStatus !== "BANNED" && (
                                    <DropdownMenuItem onClick={() => enforcement.openBanDialog(user)} className="text-destructive">
                                      <Ban className="mr-2 h-4 w-4" /> {t("users.ban.action")}
                                    </DropdownMenuItem>
                                  )}
                                  {(user.accountStatus === "BANNED" || user.accountStatus === null) && (
                                    <DropdownMenuItem onClick={() => enforcement.openUnbanDialog(user)}>
                                      <ShieldOff className="mr-2 h-4 w-4" /> {t("users.unban.action")}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => enforcement.openLegalHoldDialog(user, false)}>
                                    <Gavel className="mr-2 h-4 w-4" /> {t("users.legalHold.apply")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => enforcement.openLegalHoldDialog(user, true)}>
                                    <Gavel className="mr-2 h-4 w-4" /> {t("users.legalHold.release")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => enforcement.openResetPasswordDialog(user)}><Key className="mr-2 h-4 w-4" /> {t("users.resetPassword.action")}</DropdownMenuItem>
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
                  <p className="text-sm text-muted-foreground">Showing {users.length ? pageOffset + 1 : 0}-{pageOffset + filteredUsers.length}{totalUsers ? ` of ${totalUsers}` : ""} users</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageOffset === 0 || loading}
                      onClick={() => setPageOffset((o) => Math.max(0, o - pageLimit))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasMore || loading}
                      onClick={() => setPageOffset((o) => o + pageLimit)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
          </Card>
        </div>
      </div>

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
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button><Button onClick={() => { toast({ title: "User Updated" }); setEditUserOpen(false); }}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend / unsuspend / ban / unban / password-reset / legal-hold
          dialogs — shared with the user-detail page. */}
      <UserEnforcementDialogs enforcement={enforcement} />

    </AdminLayout>
  );
}
