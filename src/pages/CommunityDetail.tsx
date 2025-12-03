import { useState } from "react";
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Edit, Link2, UserPlus, Pause, Eye, Check, X, Trash2, 
  MoreHorizontal, Download, Store, Unlink, Globe, Calendar, Users,
  FileText, Briefcase, History, Shield, Building2
} from "lucide-react";

const communityData = {
  id: "COM-001",
  name: "Ghana Belgium Community",
  country: "Belgium",
  description: "A vibrant community connecting Ghanaians living in Belgium with their homeland.",
  membersCount: 1245,
  postsCount: 342,
  opportunitiesCount: 28,
  vendorEnabled: true,
  postingEnabled: true,
  status: "Active",
  riskScore: 15,
  createdAt: "2024-01-15",
};

const linkedAssociations = [
  { id: "ASC-001", name: "Accra Alumni Belgium", country: "Belgium" },
  { id: "ASC-002", name: "Kumasi Cultural Group", country: "Belgium" },
  { id: "ASC-003", name: "Ghana Traders Network", country: "Ghana" },
];

const communityAdmins = [
  { id: "USR-001", name: "John Doe", email: "john@example.com", role: "Community Admin" },
  { id: "USR-002", name: "Jane Smith", email: "jane@example.com", role: "Community Admin" },
];

const membersData = [
  { id: "USR-003", name: "Kwame Asante", roles: ["Member"], associationsCount: 2, joinedAt: "2024-01-10", status: "Active" },
  { id: "USR-004", name: "Ama Owusu", roles: ["Member", "Vendor"], associationsCount: 1, joinedAt: "2024-01-08", status: "Active" },
  { id: "USR-005", name: "Kofi Mensah", roles: ["Member"], associationsCount: 3, joinedAt: "2024-01-05", status: "Active" },
];

const postsData = [
  { id: "PST-001", author: "John Doe", contentPreview: "Community Event Announcement...", media: "1 image", likes: 45, comments: 12, createdAt: "2024-01-20", status: "Pending" },
  { id: "PST-002", author: "Jane Smith", contentPreview: "New Member Introduction...", media: "-", likes: 32, comments: 8, createdAt: "2024-01-19", status: "Approved" },
];

const opportunitiesData = [
  { id: "OPP-001", title: "Business Partnership", type: "Business", applicationsCount: 15, status: "Open", postedAt: "2024-01-15" },
  { id: "OPP-002", title: "Job Opening - Marketing", type: "Job", applicationsCount: 28, status: "Open", postedAt: "2024-01-14" },
];

const vendorItems = [
  { id: "ITM-001", title: "African Art Print", category: "Art", price: "$45", stock: 25, status: "Approved" },
  { id: "ITM-002", title: "Kente Cloth", category: "Fashion", price: "$120", stock: 10, status: "Pending" },
];

const auditLogs = [
  { timestamp: "2024-01-20 14:30:00", action: "Post Approved", performedBy: "John Doe", notes: "Approved community event post" },
  { timestamp: "2024-01-18 10:15:00", action: "Association Linked", performedBy: "System Admin", notes: "Linked Ghana Traders Network" },
  { timestamp: "2024-01-15 09:00:00", action: "Community Created", performedBy: "System", notes: "Initial creation" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Active": "badge-status badge-success",
    "Inactive": "badge-status badge-warning",
    "Suspended": "badge-status badge-destructive",
    "Approved": "badge-status badge-success",
    "Pending": "badge-status badge-warning",
    "Open": "badge-status badge-info",
  };
  return <span className={styles[status] || "badge-status badge-muted"}>{status}</span>;
};

const getRiskBadge = (score: number) => {
  if (score <= 30) return <Badge className="badge-status badge-success">Low Risk ({score})</Badge>;
  if (score <= 60) return <Badge className="badge-status badge-warning">Medium Risk ({score})</Badge>;
  return <Badge className="badge-status badge-destructive">High Risk ({score})</Badge>;
};

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [vendorEnabled, setVendorEnabled] = useState(communityData.vendorEnabled);
  const [postingEnabled, setPostingEnabled] = useState(communityData.postingEnabled);
  const [linkAssociationOpen, setLinkAssociationOpen] = useState(false);
  const [assignAdminOpen, setAssignAdminOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);

  const handleTogglePosting = (checked: boolean) => {
    setPostingEnabled(checked);
    toast({ title: checked ? "Posting enabled" : "Posting disabled" });
  };

  const handleToggleVendor = (checked: boolean) => {
    setVendorEnabled(checked);
    toast({ title: checked ? "Vendor mode enabled" : "Vendor mode disabled" });
  };

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
            <BreadcrumbItem><BreadcrumbPage>{communityData.name}</BreadcrumbPage></BreadcrumbItem>
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
                <h1 className="text-2xl font-semibold text-foreground">{communityData.name}</h1>
                {getStatusBadge(communityData.status)}
                {getRiskBadge(communityData.riskScore)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{communityData.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
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
                      <p className="font-medium">{communityData.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Country</p>
                      <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-muted-foreground" /><p>{communityData.country}</p></div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Description</p>
                      <p>{communityData.description}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      {getStatusBadge(communityData.status)}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Risk Score</p>
                      {getRiskBadge(communityData.riskScore)}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /><p>{communityData.createdAt}</p></div>
                    </div>
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
                    <CardTitle className="text-base">Members ({membersData.length})</CardTitle>
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
                    {membersData.map((member) => (
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
                    {opportunitiesData.map((opp) => (
                      <TableRow key={opp.id} className="border-border/50">
                        <TableCell className="font-mono text-xs">{opp.id}</TableCell>
                        <TableCell className="font-medium">{opp.title}</TableCell>
                        <TableCell><Badge variant="outline">{opp.type}</Badge></TableCell>
                        <TableCell>{opp.applicationsCount}</TableCell>
                        <TableCell>{getStatusBadge(opp.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{opp.postedAt}</TableCell>
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
      <Dialog open={linkAssociationOpen} onOpenChange={setLinkAssociationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Association to Community</DialogTitle>
            <DialogDescription>Link one or more associations to {communityData.name}.</DialogDescription>
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
