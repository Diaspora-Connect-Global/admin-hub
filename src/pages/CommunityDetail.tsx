import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "@/hooks/use-toast";
import { useGetAuditLogs, useGetCommunity, useGetUsers, useListCommunityMembers, useUpdateCommunity } from "@/hooks/admin";
import { useGetEventsByOwner } from "@/hooks/events";
import { useListOpportunities } from "@/hooks/opportunity";
import { OwnerType } from "@/types/opportunities";
import {
  ArrowLeft, Edit, Link2, UserPlus, Pause, Eye, Check, X, Trash2,
  MoreHorizontal, Download, Store, Unlink, Globe, Calendar, Users,
  FileText, Briefcase, History, Shield, Building2, Loader2
} from "lucide-react";

const postsData = [
  { id: "PST-001", author: "John Doe", contentPreview: "Community Event Announcement...", media: "1 image", likes: 45, comments: 12, createdAt: "2024-01-20", status: "Pending" },
  { id: "PST-002", author: "Jane Smith", contentPreview: "New Member Introduction...", media: "-", likes: 32, comments: 8, createdAt: "2024-01-19", status: "Approved" },
];

const vendorItems = [
  { id: "ITM-001", title: "African Art Print", category: "Art", price: "$45", stock: 25, status: "Approved" },
  { id: "ITM-002", title: "Kente Cloth", category: "Fashion", price: "$120", stock: 10, status: "Pending" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Active": "badge-status badge-success",
    "Inactive": "badge-status badge-warning",
    "Suspended": "badge-status badge-destructive",
    "Approved": "badge-status badge-success",
    "Pending": "badge-status badge-warning",
    "Open": "badge-status badge-info",
    "Scheduled": "badge-status badge-info",
    "Completed": "badge-status badge-success",
  };
  return <span className={styles[status] || "badge-status badge-muted"}>{status}</span>;
};

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error, refetch } = useGetCommunity(id ?? null);
  const [updateCommunityMutation, { loading: savingEdit }] = useUpdateCommunity();
  const community = data?.getCommunity;
  const { data: membersData } = useListCommunityMembers(id ?? null, 50, 0);
  const { data: usersData } = useGetUsers({ limit: 500, offset: 0, skip: false });
  const { data: communityEventsData } = useGetEventsByOwner(
    id ? { ownerId: id, ownerType: "COMMUNITY", limit: 20, offset: 0 } : null,
  );
  const { data: opportunitiesData } = useListOpportunities(
    id
      ? { ownerType: OwnerType.COMMUNITY, ownerId: id, limit: 20, offset: 0 }
      : { ownerType: OwnerType.COMMUNITY, ownerId: "__none__", limit: 1, offset: 0 },
  );
  const { data: auditData } = useGetAuditLogs({
    resourceType: "COMMUNITY",
    resourceId: id ?? undefined,
    limit: 20,
    offset: 0,
  });

  const users = (
    usersData as { getUsers?: { items?: Array<{ id: string; email: string; displayName?: string | null }> } } | undefined
  )?.getUsers?.items ?? [];
  const userById = new Map(users.map((u) => [u.id, u]));
  const communityMembers = membersData?.listCommunityMembers?.members ?? [];
  const communityMemberRows = communityMembers.map((member) => {
    const user = userById.get(member.userId);
    return {
      id: member.userId,
      name: user?.displayName || user?.email || member.userId,
      roles: [member.role],
      associationsCount: 0,
      joinedAt: member.joinedAt,
      status: member.status,
    };
  });
  const linkedAssociations: Array<{ id: string; name: string; country: string }> = [];
  const communityAdmins = (community?.assignedAdminIds ?? []).map((adminId) => {
    const user = userById.get(adminId);
    return {
      id: adminId,
      name: user?.displayName || user?.email || adminId,
      email: user?.email || "—",
      role: "Community Admin",
    };
  });
  const communityEvents =
    (communityEventsData as { getEventsByOwner?: { events?: Array<{ id: string; title?: string; locationDetails?: { city?: string; venueName?: string; platform?: string } | null; startAt?: string; registrationCount?: number; status?: string }> } } | undefined)
      ?.getEventsByOwner?.events ?? [];
  const communityOpportunities =
    (opportunitiesData as { listOpportunities?: { opportunities?: Array<{ id: string; title?: string; type?: string; applicationCount?: number; status?: string; createdAt?: string }> } } | undefined)
      ?.listOpportunities?.opportunities ?? [];
  const auditLogs = ((auditData as any)?.getAuditLogs?.items ?? []).map((log: any) => ({
    timestamp: log.createdAt,
    action: log.action,
    performedBy: log.actorId || "System",
    notes: typeof log.metadata === "string" ? log.metadata : JSON.stringify(log.metadata ?? {}),
  }));

  const [vendorEnabled, setVendorEnabled] = useState(false);
  const [postingEnabled, setPostingEnabled] = useState(true);
  const [linkAssociationOpen, setLinkAssociationOpen] = useState(false);
  const [assignAdminOpen, setAssignAdminOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    countriesServed: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    whoCanPost: "ADMIN_ONLY",
    groupCreationPermission: "",
    communityRules: "",
    embassyCountry: "",
    locationCountry: "",
  });

  useEffect(() => {
    if (!community) return;
    setEditForm({
      name: community.name ?? "",
      description: community.description ?? "",
      countriesServed: community.countriesServed?.join(", ") ?? "",
      address: community.address ?? "",
      contactEmail: community.contactEmail ?? "",
      contactPhone: community.contactPhone ?? "",
      website: community.website ?? "",
      whoCanPost: community.whoCanPost ?? "ADMIN_ONLY",
      groupCreationPermission: community.groupCreationPermission ?? "",
      communityRules: community.communityRules ?? "",
      embassyCountry: community.embassyCountry ?? "",
      locationCountry: community.locationCountry ?? "",
    });
  }, [community]);

  useEffect(() => {
    if (!community) return;
    const shouldOpenEdit = new URLSearchParams(location.search).get("edit") === "1";
    if (shouldOpenEdit) {
      setEditOpen(true);
    }
  }, [location.search, community]);

  const handleTogglePosting = (checked: boolean) => {
    setPostingEnabled(checked);
    toast({ title: checked ? "Posting enabled" : "Posting disabled" });
  };

  const handleToggleVendor = (checked: boolean) => {
    setVendorEnabled(checked);
    toast({ title: checked ? "Vendor mode enabled" : "Vendor mode disabled" });
  };

  const handleSaveEdit = async () => {
    if (!community) return;
    if (!editForm.name.trim()) {
      toast({ title: "Validation error", description: "Community name is required.", variant: "destructive" });
      return;
    }

    const countriesServed = editForm.countriesServed
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const result = await updateCommunityMutation({
        variables: {
          id: community.id,
          input: {
            name: editForm.name.trim(),
            description: editForm.description.trim(),
            countriesServed,
            address: editForm.address.trim(),
            contactEmail: editForm.contactEmail.trim(),
            contactPhone: editForm.contactPhone.trim(),
            website: editForm.website.trim(),
            whoCanPost: editForm.whoCanPost,
            groupCreationPermission: editForm.groupCreationPermission.trim(),
            communityRules: editForm.communityRules.trim(),
            embassyCountry: editForm.embassyCountry.trim(),
            locationCountry: editForm.locationCountry.trim(),
          },
        },
      });

      const payload = result.data?.updateCommunity;
      if (!payload?.success) {
        const firstError = payload?.errors?.[0];
        toast({
          title: "Update failed",
          description: firstError || "Failed to update community.",
          variant: "destructive",
        });
        return;
      }

      await refetch();
      setEditOpen(false);
      toast({ title: "Community updated", description: "Changes were saved successfully." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update community.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading community...</p>
          <Button variant="outline" onClick={() => navigate("/communities")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Communities
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-destructive">{error.message}</p>
          <Button variant="outline" onClick={() => navigate("/communities")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Communities
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (!community) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-muted-foreground">Community not found.</p>
          <Button variant="outline" onClick={() => navigate("/communities")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Communities
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const countryLabel = community.countriesServed?.length
    ? community.countriesServed.join(", ")
    : community.embassyCountry ?? community.locationCountry ?? "—";
  const status = community.membershipStatus ?? "Active";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">System Admin</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/communities">Communities</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{community.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/communities")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{community.name}</h1>
                {getStatusBadge(status)}
                {community.communityType && (
                  <Badge variant="outline" className={community.communityType.isEmbassy ? "border-blue-500 text-blue-500" : ""}>
                    {community.communityType.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Globe className="h-3 w-3" /> {countryLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
            <Button variant="outline" onClick={() => setLinkAssociationOpen(true)}><Link2 className="mr-2 h-4 w-4" /> Link Associations</Button>
            <Button variant="outline" onClick={() => setAssignAdminOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Assign Admins</Button>
            <Button variant="destructive" onClick={() => setSuspendOpen(true)}><Pause className="mr-2 h-4 w-4" /> Suspend</Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="glass">
                <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p className="font-medium">{community.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Visibility</p>
                      <p>{community.visibility}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Join policy</p>
                      <p>{community.joinPolicy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Type</p>
                      <p>{community.communityType?.name ?? community.communityTypeId ?? "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Countries served</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p>{community.countriesServed?.length ? community.countriesServed.join(", ") : "—"}</p>
                      </div>
                    </div>
                    {community.embassyCountry && community.locationCountry && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">Embassy</p>
                        <p>{community.embassyCountry} → {community.locationCountry}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Description</p>
                      <p>{community.description ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      {getStatusBadge(status)}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Members</p>
                      <p>{community.memberCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /><p>{community.createdAt}</p></div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Updated</p>
                      <p>{community.updatedAt ?? "—"}</p>
                    </div>
                    {(community.contactEmail || community.contactPhone || community.website) && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-muted-foreground text-xs">Contact</p>
                        <p className="text-sm">
                          {community.contactEmail && <span>{community.contactEmail}</span>}
                          {community.contactPhone && <span className="ml-2">{community.contactPhone}</span>}
                          {community.website && <span className="ml-2">{community.website}</span>}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Linked Associations</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setLinkAssociationOpen(true)}><Link2 className="mr-2 h-4 w-4" /> Link</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {linkedAssociations.map((assoc) => (
                        <div key={assoc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{assoc.name}</p>
                              <p className="text-xs text-muted-foreground">{assoc.country}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/associations/${assoc.id}`)}>View</Button>
                            <Button variant="ghost" size="sm" className="text-destructive"><Unlink className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Community Admins</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setAssignAdminOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Assign</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {communityAdmins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{admin.name}</p>
                              <p className="text-xs text-muted-foreground">{admin.email}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Members ({communityMemberRows.length})</CardTitle>
                    <CardDescription>Community members and their roles.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                    <Button size="sm" onClick={() => setInviteMemberOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Invite Member</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Member Name</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Associations</TableHead>
                      <TableHead>Joined At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communityMemberRows.map((member) => (
                      <TableRow key={member.id} className="border-border/50">
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">{member.roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}</div>
                        </TableCell>
                        <TableCell>{member.associationsCount}</TableCell>
                        <TableCell className="text-muted-foreground">{member.joinedAt}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Posts</CardTitle>
                <CardDescription>Posts published by the community, reactions, comments, and moderation controls.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Post ID</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Content Preview</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postsData.map((post) => (
                      <TableRow key={post.id} className="border-border/50">
                        <TableCell className="font-mono text-xs">{post.id}</TableCell>
                        <TableCell>{post.author}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{post.contentPreview}</TableCell>
                        <TableCell>{post.media}</TableCell>
                        <TableCell>{post.likes}</TableCell>
                        <TableCell>{post.comments}</TableCell>
                        <TableCell className="text-muted-foreground">{post.createdAt}</TableCell>
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="text-success"><Check className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><X className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Events</CardTitle>
                    <CardDescription>Community events and meetups.</CardDescription>
                  </div>
                  <Button size="sm">Create Event</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Event ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communityEvents.map((evt) => (
                      <TableRow key={evt.id} className="border-border/50">
                        <TableCell className="font-mono text-xs">{evt.id}</TableCell>
                        <TableCell className="font-medium">{evt.title}</TableCell>
                        <TableCell>{evt.locationDetails?.city || evt.locationDetails?.venueName || evt.locationDetails?.platform || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{evt.startAt || "—"}</TableCell>
                        <TableCell>{evt.registrationCount ?? 0}</TableCell>
                        <TableCell>{getStatusBadge(evt.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    <CardDescription>Opportunities posted in this community.</CardDescription>
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
                    {communityOpportunities.map((opp) => (
                      <TableRow key={opp.id} className="border-border/50">
                        <TableCell className="font-mono text-xs">{opp.id}</TableCell>
                        <TableCell className="font-medium">{opp.title}</TableCell>
                        <TableCell><Badge variant="outline">{opp.type}</Badge></TableCell>
                        <TableCell>{opp.applicationCount ?? 0}</TableCell>
                        <TableCell>{getStatusBadge(opp.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{opp.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="text-success"><Check className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><X className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    <CardDescription>Manage community's vendor listings.</CardDescription>
                  </div>
                  <Button size="sm" disabled={!vendorEnabled}>Add Product/Service</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {vendorEnabled ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Item ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorItems.map((item) => (
                        <TableRow key={item.id} className="border-border/50">
                          <TableCell className="font-mono text-xs">{item.id}</TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.price}</TableCell>
                          <TableCell>{item.stock}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="text-success"><Check className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-warning"><Pause className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Vendor mode is disabled for this community.</p>
                  </div>
                )}
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
                    <CardDescription>Immutable log of admin actions on this community.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
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
                    {auditLogs.map((log, idx) => (
                      <TableRow key={idx} className="border-border/50">
                        <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                        <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                        <TableCell>{log.performedBy}</TableCell>
                        <TableCell className="text-muted-foreground">{log.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Link Association Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
            <DialogDescription>Update basic details for {community.name}.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Countries served (comma separated)</Label>
                <Input
                  placeholder="Belgium, Ghana"
                  value={editForm.countriesServed}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, countriesServed: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Embassy country</Label>
                  <Input value={editForm.embassyCountry} onChange={(e) => setEditForm((prev) => ({ ...prev, embassyCountry: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Location country</Label>
                  <Input value={editForm.locationCountry} onChange={(e) => setEditForm((prev) => ({ ...prev, locationCountry: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact phone</Label>
                  <Input value={editForm.contactPhone} onChange={(e) => setEditForm((prev) => ({ ...prev, contactPhone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={editForm.website} onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Who can post</Label>
                  <Select value={editForm.whoCanPost} onValueChange={(v) => setEditForm((prev) => ({ ...prev, whoCanPost: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="ADMIN_ONLY">Admin only</SelectItem>
                      <SelectItem value="ALL_MEMBERS">All members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Group creation permission</Label>
                  <Input
                    placeholder="Admins Only"
                    value={editForm.groupCreationPermission}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, groupCreationPermission: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Community rules</Label>
                <Textarea value={editForm.communityRules} onChange={(e) => setEditForm((prev) => ({ ...prev, communityRules: e.target.value }))} rows={4} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Association Modal */}
      <Dialog open={linkAssociationOpen} onOpenChange={setLinkAssociationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Association to Community</DialogTitle>
            <DialogDescription>Link one or more associations to {community.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Associations</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Search associations..." /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="asc1">Ghana Nurses Association</SelectItem>
                  <SelectItem value="asc2">Nigerian Engineers Association</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkAssociationOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Association Linked" }); setLinkAssociationOpen(false); }}>Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Admin Modal */}
      <Dialog open={assignAdminOpen} onOpenChange={setAssignAdminOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Community Admin</DialogTitle>
            <DialogDescription>Assign admin privileges to a user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Search users..." /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="usr1">Kwame Asante</SelectItem>
                  <SelectItem value="usr2">Ama Owusu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignAdminOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Admin Assigned" }); setAssignAdminOpen(false); }}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Community</DialogTitle>
            <DialogDescription>Suspending will block all posting and vendor activity.</DialogDescription>
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
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { toast({ title: "Community Suspended" }); setSuspendOpen(false); }}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="member@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteMemberOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Invitation Sent" }); setInviteMemberOpen(false); }}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
