import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAssociation,
  useGetAssociationMembers,
  useGetPendingMembershipRequests,
  useApproveMembership,
  useRejectMembership,
  useRemoveMember,
  useInviteMember,
  useLinkAssociation,
  useUnlinkAssociation,
  useGetAssociationAvatarUploadUrl,
  useGetAssociationCoverUploadUrl,
  useUpdateAssociation,
  useAssignAssociationAdmin,
} from "@/hooks/admin/useAssociation";
import { uploadAssociationAvatar, uploadAssociationCover } from "@/lib/associationImageUpload";
import { iso2OrLabelToDisplayName } from "@/lib/countriesServedIso";
import { useGetUsers } from "@/hooks/admin";
import { Loader2 } from "lucide-react";
import { 
  ArrowLeft, Edit, Check, X, Link2, UserPlus, Users, FileText, 
  Briefcase, Store, Settings, History, Download, Upload, Eye,
  Trash2, Flag, MessageSquare, Globe, Mail, Phone, MapPin, Calendar,
  Building2, Shield, AlertTriangle,
} from "lucide-react";

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Verified": "badge-status badge-success",
    "Pending": "badge-status badge-warning",
    "Rejected": "badge-status badge-destructive",
    "Suspended": "badge-status bg-destructive/20 text-destructive",
    "Active": "badge-status badge-success",
    "Published": "badge-status badge-success",
    "Open": "badge-status badge-info",
  };
  return <span className={styles[status] || "badge-status badge-muted"}>{status}</span>;
};

export default function AssociationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Live data ──────────────────────────────────────────────────────────────
  const { data: assocData, loading: assocLoading } = useGetAssociation(id ?? null);
  const association = assocData?.getAssociation;

  const countriesLabel =
    association?.countriesServed && association.countriesServed.length > 0
      ? association.countriesServed
          .map((c) => iso2OrLabelToDisplayName(c))
          .filter(Boolean)
          .join(", ")
      : "—";
  const associationTypeLabel =
    association?.associationType?.name ?? association?.associationTypeId ?? "—";

  const { data: membersData, loading: membersLoading, refetch: refetchMembers } =
    useGetAssociationMembers(id ?? null);
  const liveMembers = membersData?.getAssociationMembers.members ?? [];
  const { data: usersData } = useGetUsers({ limit: 500, offset: 0, skip: false });
  const users = (
    usersData as { getUsers?: { items?: Array<{ id: string; email: string; displayName?: string | null }> } } | undefined
  )?.getUsers?.items ?? [];
  const userById = new Map(users.map((u) => [u.id, u]));
  const associationAdmins = liveMembers
    .filter((member) => {
      const role = (member.role ?? "").toUpperCase();
      return (
        role.includes("ADMIN") ||
        role === "OWNER" ||
        role === "PRESIDENT" ||
        role === "SECRETARY"
      );
    })
    .map((member) => {
      const user = userById.get(member.userId);
      return {
        id: member.userId,
        name: user?.displayName || user?.email || member.userId,
        email: user?.email || "—",
        role: member.role || "Association Admin",
      };
    });

  const { data: pendingData, refetch: refetchPending } =
    useGetPendingMembershipRequests(id ?? null, "ASSOCIATION");
  const pendingRequests = pendingData?.getPendingMembershipRequests.requests ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [approveMembership] = useApproveMembership();
  const [rejectMembership] = useRejectMembership();
  const [removeMemberMutation] = useRemoveMember();
  const [inviteMemberMutation] = useInviteMember();
  const [linkCommunityMutation] = useLinkAssociation();
  const [unlinkCommunityMutation] = useUnlinkAssociation();
  const [getAvatarUploadUrl] = useGetAssociationAvatarUploadUrl();
  const [getCoverUploadUrl] = useGetAssociationCoverUploadUrl();
  const [updateAssociationMutation, { loading: savingEdit }] = useUpdateAssociation();
  const [assignAssociationAdminMutation, { loading: assigningAdmin }] = useAssignAssociationAdmin();

  // ── Member action handlers ─────────────────────────────────────────────────
  const handleApproveMembership = async (userId: string) => {
    if (!id) return;
    try {
      await approveMembership({ variables: { input: { entityId: id, entityType: "ASSOCIATION", userId } } });
      toast({ title: "Membership approved" });
      refetchMembers();
      refetchPending();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleRejectMembership = async (userId: string) => {
    if (!id) return;
    try {
      await rejectMembership({ variables: { input: { entityId: id, entityType: "ASSOCIATION", userId } } });
      toast({ title: "Membership rejected" });
      refetchPending();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    try {
      await removeMemberMutation({ variables: { input: { entityId: id, entityType: "ASSOCIATION", userId } } });
      toast({ title: "Member removed" });
      refetchMembers();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  // ── Community link/unlink handlers ────────────────────────────────────────
  const [linkCommunityId, setLinkCommunityId] = useState("");

  const handleLinkCommunity = async () => {
    if (!id || !linkCommunityId) return;
    try {
      await linkCommunityMutation({ variables: { input: { associationId: id, communityId: linkCommunityId } } });
      toast({ title: "Community linked" });
      setLinkCommunityId("");
      setLinkCommunitiesOpen(false);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleUnlinkCommunity = async (communityId: string) => {
    if (!id) return;
    try {
      await unlinkCommunityMutation({ variables: { input: { associationId: id, communityId } } });
      toast({ title: "Community unlinked" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  // ── Invite member handler ──────────────────────────────────────────────────
  const [inviteUserId, setInviteUserId] = useState("");

  const handleInviteMember = async () => {
    if (!id || !inviteUserId) return;
    try {
      await inviteMemberMutation({ variables: { input: { entityId: id, entityType: "ASSOCIATION", userId: inviteUserId } } });
      toast({ title: "Invitation sent" });
      setInviteUserId("");
      setInviteMemberOpen(false);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const [vendorEnabled, setVendorEnabled] = useState(false);
  const [postingEnabled, setPostingEnabled] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [linkCommunitiesOpen, setLinkCommunitiesOpen] = useState(false);
  const [assignAdminOpen, setAssignAdminOpen] = useState(false);
  const [assignAdminEmail, setAssignAdminEmail] = useState("");
  const [assignAdminPassword, setAssignAdminPassword] = useState("");
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [rejectDocOpen, setRejectDocOpen] = useState(false);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    joinPolicy: "OPEN" as "OPEN" | "REQUEST" | "INVITE_ONLY",
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
    contactEmail: "",
    contactPhone: "",
    website: "",
    address: "",
  });

  useEffect(() => {
    if (!association) return;
    setEditForm({
      name: association.name ?? "",
      description: association.description ?? "",
      joinPolicy:
        association.joinPolicy === "REQUEST" || association.joinPolicy === "INVITE_ONLY"
          ? association.joinPolicy
          : "OPEN",
      visibility: association.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      contactEmail: association.contactEmail ?? "",
      contactPhone: association.contactPhone ?? "",
      website: association.website ?? "",
      address: association.address ?? "",
    });
  }, [association]);

  const handleSaveEdit = async () => {
    if (!id) return;
    if (!editForm.name.trim()) {
      toast({ title: "Validation Error", description: "Name is required.", variant: "destructive" });
      return;
    }
    try {
      let avatarKey: string | undefined;
      let coverKey: string | undefined;
      if (editLogoFile) {
        avatarKey = await uploadAssociationAvatar(id, editLogoFile, (opts) => getAvatarUploadUrl(opts));
      }
      if (editBannerFile) {
        try {
          coverKey = await uploadAssociationCover(id, editBannerFile, (opts) => getCoverUploadUrl(opts));
        } catch (coverErr) {
          toast({
            title: "Banner upload failed",
            description: coverErr instanceof Error ? coverErr.message : "Cover image could not be saved.",
            variant: "destructive",
          });
        }
      }
      await updateAssociationMutation({
        variables: {
          input: {
            id,
            name: editForm.name.trim(),
            description: editForm.description.trim() || undefined,
            joinPolicy: editForm.joinPolicy,
            visibility: editForm.visibility,
            contactEmail: editForm.contactEmail.trim() || undefined,
            contactPhone: editForm.contactPhone.trim() || undefined,
            website: editForm.website.trim() || undefined,
            address: editForm.address.trim() || undefined,
            ...(avatarKey != null ? { avatarKey } : {}),
            ...(coverKey != null ? { coverKey } : {}),
          },
        },
      });
      setEditLogoFile(null);
      setEditBannerFile(null);
      toast({ title: "Association updated" });
      setEditOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update association",
        variant: "destructive",
      });
    }
  };

  const handleAssignAdmin = async () => {
    if (!id) return;
    const email = assignAdminEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Validation Error", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }
    if (!assignAdminPassword.trim()) {
      toast({ title: "Validation Error", description: "Password is required.", variant: "destructive" });
      return;
    }
    if (assignAdminPassword.length < 8) {
      toast({ title: "Validation Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    try {
      const result = await assignAssociationAdminMutation({
        variables: {
          input: {
            entityId: id,
            email,
            password: assignAdminPassword,
          },
        },
      });
      const payload = result.data?.assignAssociationAdmin;
      if (payload?.success) {
        toast({ title: "Admin Assigned", description: payload.message || "Association admin assigned successfully." });
        setAssignAdminOpen(false);
        setAssignAdminEmail("");
        setAssignAdminPassword("");
      } else {
        toast({
          title: "Error",
          description: payload?.message || "Failed to assign admin.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign admin.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/associations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{association?.name ?? "Association"}</h1>
              {getStatusBadge(association?.membershipStatus ?? "Active")}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{association?.id ?? "—"}</span>
              <span>•</span>
              <span>{countriesLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" onClick={() => setLinkCommunitiesOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" /> Link Community
            </Button>
            <Button variant="outline" onClick={() => setAssignAdminOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Assign Admin
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p className="font-medium">{association?.name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Association ID</p>
                      <p className="font-mono">{association?.id ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Type</p>
                      <p>{associationTypeLabel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Countries served</p>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <p>{countriesLabel}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Address</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p>{association?.address ?? "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Website</p>
                      <p>{association?.website ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p>{association?.contactEmail ?? "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p>{association?.contactPhone ?? "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p>{association?.createdAt ? new Date(association.createdAt).toLocaleDateString() : "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Description</p>
                    <p className="text-sm">{association?.description ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base">Linked Communities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Linked communities are not returned by the current association detail query.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setLinkCommunitiesOpen(true)}>
                    <Link2 className="mr-2 h-4 w-4" /> Link Community
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Association Admins</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setAssignAdminOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" /> Assign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {associationAdmins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No admins assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {associationAdmins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{admin.name}</p>
                              <p className="text-xs text-muted-foreground">{admin.email}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{admin.role}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Members ({membersData?.getAssociationMembers.total ?? liveMembers.length})</CardTitle>
                    <CardDescription>Active association members.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button size="sm" onClick={() => setInviteMemberOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {pendingRequests.length > 0 && (
                <CardContent className="pb-0">
                  <p className="text-sm font-medium mb-2">Pending Requests ({pendingRequests.length})</p>
                  <div className="space-y-2 mb-4">
                    {pendingRequests.map((req) => (
                      <div key={req.userId} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <div>
                          <p className="font-mono text-xs">{req.userId}</p>
                          <p className="text-xs text-muted-foreground">{new Date(req.requestedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-success" onClick={() => handleApproveMembership(req.userId)}>
                            <Check className="mr-1 h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleRejectMembership(req.userId)}>
                            <X className="mr-1 h-3 w-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              <CardContent className="p-0">
                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No members found</TableCell>
                      </TableRow>
                    ) : liveMembers.map((member) => (
                      <TableRow key={member.userId} className="border-border/50">
                        <TableCell className="font-mono text-xs">{member.userId}</TableCell>
                        <TableCell><Badge variant="secondary">{member.role ?? "Member"}</Badge></TableCell>
                        <TableCell>{getStatusBadge(member.status === "ACTIVE" ? "Active" : member.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveMember(member.userId)}>Remove</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Posts</CardTitle>
                    <CardDescription>Moderate all posts created by the association.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Post ID</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Content Preview</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Posts are not available from the current backend query.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Opportunities</CardTitle>
                    <CardDescription>Opportunities posted by this association (jobs, grants, events).</CardDescription>
                  </div>
                  <Button size="sm">Create Opportunity</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Opportunity ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posted At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Opportunities are not available from the current backend query.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendor Tab */}
          <TabsContent value="vendor" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Vendor Products & Services</CardTitle>
                    <CardDescription>Manage store items if the association sells products/services.</CardDescription>
                  </div>
                  <Button size="sm" disabled={!vendorEnabled}>Add Product/Service</Button>
                </div>
              </CardHeader>
              <CardContent>
                {vendorEnabled ? (
                  <p className="text-sm text-muted-foreground">No products or services listed yet.</p>
                ) : (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Vendor mode is disabled.</p>
                    <p className="text-sm text-muted-foreground">Enable vendor mode in settings to add products.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Documents & Verification</CardTitle>
                    <CardDescription>Registration docs, leadership IDs, constitution, proof of address.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Document Type</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Documents are not available from the current backend query.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Association Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Posting</p>
                    <p className="text-sm text-muted-foreground">Allow the association to create posts</p>
                  </div>
                  <Switch checked={postingEnabled} onCheckedChange={setPostingEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Vendor Mode</p>
                    <p className="text-sm text-muted-foreground">Allow the association to sell products/services</p>
                  </div>
                  <Switch checked={vendorEnabled} onCheckedChange={setVendorEnabled} />
                </div>
                <div className="pt-4 border-t border-border">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="mr-2 h-4 w-4" /> Edit Association Profile
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Assign Association Admin</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Search users..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user1">Akua Mensah</SelectItem>
                      <SelectItem value="user2">Kwame Asante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button variant="destructive" className="w-full" onClick={() => setSuspendOpen(true)}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> Suspend Association
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Audit Log</CardTitle>
                    <CardDescription>Immutable log of admin actions on this association.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Audit logs are not available from the current backend query.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Link Communities Modal */}
      <Dialog open={linkCommunitiesOpen} onOpenChange={setLinkCommunitiesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Association to Communities</DialogTitle>
            <DialogDescription>Enter the Community ID to link this association.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Community ID</Label>
              <Input
                placeholder="Enter community UUID..."
                value={linkCommunityId}
                onChange={(e) => setLinkCommunityId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkCommunitiesOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkCommunity} disabled={!linkCommunityId}>Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Association Modal */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditLogoFile(null);
            setEditBannerFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Association</DialogTitle>
            <DialogDescription>Update association details.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Basic Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Name <span className="text-destructive">*</span></Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Join Policy</Label>
                    <Select
                      value={editForm.joinPolicy}
                      onValueChange={(v: "OPEN" | "REQUEST" | "INVITE_ONLY") =>
                        setEditForm((prev) => ({ ...prev, joinPolicy: v }))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="REQUEST">Approval Required</SelectItem>
                        <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select
                      value={editForm.visibility}
                      onValueChange={(v: "PUBLIC" | "PRIVATE") =>
                        setEditForm((prev) => ({ ...prev, visibility: v }))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Logo &amp; banner</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        id="assoc-detail-logo"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setEditLogoFile(f ?? null);
                          e.target.value = "";
                        }}
                      />
                      <label htmlFor="assoc-detail-logo" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload logo</span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, WebP · up to 5MB</span>
                      </label>
                      {editLogoFile && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{editLogoFile.name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove logo"
                            onClick={() => setEditLogoFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {!editLogoFile && association?.avatarUrl && (
                        <img
                          src={association.avatarUrl}
                          alt=""
                          className="mt-3 mx-auto h-16 w-16 rounded-md object-cover border border-border"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Banner</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        id="assoc-detail-banner"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setEditBannerFile(f ?? null);
                          e.target.value = "";
                        }}
                      />
                      <label htmlFor="assoc-detail-banner" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Wide banner image</span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, WebP · up to 5MB</span>
                      </label>
                      {editBannerFile && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{editBannerFile.name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove banner"
                            onClick={() => setEditBannerFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {!editBannerFile && association?.coverImageUrl && (
                        <img
                          src={association.coverImageUrl}
                          alt=""
                          className="mt-3 mx-auto h-16 w-full max-w-xs rounded-md object-cover border border-border"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editForm.contactPhone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Website</Label>
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Admin Modal */}
      <Dialog open={assignAdminOpen} onOpenChange={setAssignAdminOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Admin</DialogTitle>
            <DialogDescription>Create and assign an association admin account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={assignAdminEmail}
                onChange={(e) => setAssignAdminEmail(e.target.value)}
                disabled={assigningAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="SecurePass123!"
                value={assignAdminPassword}
                onChange={(e) => setAssignAdminPassword(e.target.value)}
                disabled={assigningAdmin}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignAdminOpen(false)} disabled={assigningAdmin}>Cancel</Button>
            <Button onClick={handleAssignAdmin} disabled={assigningAdmin}>
              {assigningAdmin ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning...</> : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>Enter the User ID to invite to this association.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                placeholder="Enter user UUID..."
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleInviteMember} disabled={!inviteUserId}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Association Modal */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Association</DialogTitle>
            <DialogDescription>This will block all posting and vendor activity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Enter reason for suspension..." />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select defaultValue="indefinite">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { toast({ title: "Association Suspended" }); setSuspendOpen(false); }}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Modal */}
      <Dialog open={rejectDocOpen} onOpenChange={setRejectDocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Rejection <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Enter reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDocOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { toast({ title: "Document Rejected" }); setRejectDocOpen(false); }}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
