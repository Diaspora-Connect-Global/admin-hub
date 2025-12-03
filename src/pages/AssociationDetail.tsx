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
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Edit, Check, X, Link2, UserPlus, Users, FileText, 
  Briefcase, Store, Settings, History, Download, Upload, Eye,
  Trash2, Flag, MessageSquare, Globe, Mail, Phone, MapPin, Calendar,
  Building2, Shield, AlertTriangle
} from "lucide-react";

// Sample data
const associationData = {
  id: "ASC-001",
  name: "Ghana Nurses Association - Belgium",
  registration_id: "BE-GNA-2024-001",
  country: "Belgium",
  address: "123 Healthcare Street, Brussels 1000",
  primary_contact: "Dr. Akua Mensah",
  email: "contact@gna-belgium.org",
  phone: "+32 2 123 4567",
  website: "https://gna-belgium.org",
  description: "Supporting Ghanaian nurses in Belgium with professional development, networking, and community support.",
  verification_status: "Verified",
  risk_score: 15,
  vendor_enabled: true,
  posting_enabled: true,
  created_at: "2024-01-10",
  linked_communities: [
    { id: "COM-001", name: "Ghana Belgium Community", country: "Belgium" },
    { id: "COM-002", name: "Healthcare Professionals Network", country: "Europe" }
  ]
};

const sampleMembers = [
  { id: "USR-001", name: "Akua Mensah", email: "akua@example.com", phone: "+32 471 234 567", role: "President", joined_at: "2024-01-10", status: "Active" },
  { id: "USR-002", name: "Kwame Asante", email: "kwame@example.com", phone: "+32 472 345 678", role: "Secretary", joined_at: "2024-01-11", status: "Active" },
  { id: "USR-003", name: "Ama Owusu", email: "ama@example.com", phone: "+32 473 456 789", role: "Member", joined_at: "2024-01-12", status: "Active" },
];

const samplePosts = [
  { id: "PST-001", author: "Akua Mensah", content_preview: "Exciting news! Our annual conference...", likes: 45, comments: 12, created_at: "2024-01-15", status: "Published" },
  { id: "PST-002", author: "Kwame Asante", content_preview: "New opportunities for healthcare...", likes: 32, comments: 8, created_at: "2024-01-14", status: "Published" },
];

const sampleOpportunities = [
  { id: "OPP-001", title: "Senior Nurse Position", type: "Job", applications_count: 25, status: "Open", posted_at: "2024-01-12" },
  { id: "OPP-002", title: "Healthcare Conference 2024", type: "Event", applications_count: 150, status: "Open", posted_at: "2024-01-10" },
];

const sampleDocuments = [
  { id: "DOC-001", doc_type: "Registration Certificate", filename: "registration_cert.pdf", uploaded_by: "Akua Mensah", uploaded_at: "2024-01-10", verification_status: "Verified" },
  { id: "DOC-002", doc_type: "Constitution", filename: "constitution.pdf", uploaded_by: "Akua Mensah", uploaded_at: "2024-01-10", verification_status: "Verified" },
  { id: "DOC-003", doc_type: "Leadership ID", filename: "president_id.jpg", uploaded_by: "System", uploaded_at: "2024-01-11", verification_status: "Pending" },
];

const sampleAuditLogs = [
  { timestamp: "2024-01-15 14:30:00", action: "Document Approved", performed_by: "Admin User", notes: "Registration certificate verified" },
  { timestamp: "2024-01-12 10:15:00", action: "Association Approved", performed_by: "System Admin", notes: "Initial approval" },
  { timestamp: "2024-01-10 09:00:00", action: "Association Created", performed_by: "System", notes: "Created via registration form" },
];

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

const getRiskBadge = (score: number) => {
  if (score <= 30) return <Badge className="badge-status badge-success">Low Risk ({score})</Badge>;
  if (score <= 60) return <Badge className="badge-status badge-warning">Medium Risk ({score})</Badge>;
  return <Badge className="badge-status badge-destructive">High Risk ({score})</Badge>;
};

export default function AssociationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [vendorEnabled, setVendorEnabled] = useState(associationData.vendor_enabled);
  const [postingEnabled, setPostingEnabled] = useState(associationData.posting_enabled);
  const [linkCommunitiesOpen, setLinkCommunitiesOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [rejectDocOpen, setRejectDocOpen] = useState(false);

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
              <h1 className="text-2xl font-semibold text-foreground">{associationData.name}</h1>
              {getStatusBadge(associationData.verification_status)}
              {getRiskBadge(associationData.risk_score)}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{associationData.registration_id}</span>
              <span>•</span>
              <span>{associationData.country}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/associations/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" onClick={() => setLinkCommunitiesOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" /> Link Community
            </Button>
            <Button variant="outline" onClick={() => setInviteMemberOpen(true)}>
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
                      <p className="font-medium">{associationData.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Registration ID</p>
                      <p className="font-mono">{associationData.registration_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Country</p>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <p>{associationData.country}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Address</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p>{associationData.address}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Primary Contact</p>
                      <p>{associationData.primary_contact}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p>{associationData.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p>{associationData.phone}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p>{associationData.created_at}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Description</p>
                    <p className="text-sm">{associationData.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base">Linked Communities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {associationData.linked_communities.map((community) => (
                      <div key={community.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{community.name}</p>
                            <p className="text-xs text-muted-foreground">{community.country}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm" className="text-destructive">Unlink</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setLinkCommunitiesOpen(true)}>
                    <Link2 className="mr-2 h-4 w-4" /> Link Community
                  </Button>
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
                    <CardTitle className="text-base">Members ({sampleMembers.length})</CardTitle>
                    <CardDescription>List of association members and their roles.</CardDescription>
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
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Member Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleMembers.map((member) => (
                      <TableRow key={member.id} className="border-border/50">
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell><Badge variant="secondary">{member.role}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell className="text-muted-foreground">{member.phone}</TableCell>
                        <TableCell className="text-muted-foreground">{member.joined_at}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm" className="text-primary">Promote</Button>
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
                    {samplePosts.map((post) => (
                      <TableRow key={post.id} className="border-border/50">
                        <TableCell className="font-mono text-xs">{post.id}</TableCell>
                        <TableCell>{post.author}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{post.content_preview}</TableCell>
                        <TableCell>{post.likes}</TableCell>
                        <TableCell>{post.comments}</TableCell>
                        <TableCell className="text-muted-foreground">{post.created_at}</TableCell>
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><MessageSquare className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
                    {sampleOpportunities.map((opp) => (
                      <TableRow key={opp.id} className="border-border/50">
                        <TableCell className="font-mono text-xs">{opp.id}</TableCell>
                        <TableCell className="font-medium">{opp.title}</TableCell>
                        <TableCell><Badge variant="outline">{opp.type}</Badge></TableCell>
                        <TableCell>{opp.applications_count}</TableCell>
                        <TableCell>{getStatusBadge(opp.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{opp.posted_at}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm" className="text-warning">Close</Button>
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
                    {sampleDocuments.map((doc) => (
                      <TableRow key={doc.id} className="border-border/50">
                        <TableCell>{doc.doc_type}</TableCell>
                        <TableCell className="font-mono text-xs">{doc.filename}</TableCell>
                        <TableCell>{doc.uploaded_by}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.uploaded_at}</TableCell>
                        <TableCell>{getStatusBadge(doc.verification_status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                            {doc.verification_status === "Pending" && (
                              <>
                                <Button variant="ghost" size="icon" className="text-success"><Check className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setRejectDocOpen(true)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    {sampleAuditLogs.map((log, idx) => (
                      <TableRow key={idx} className="border-border/50">
                        <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                        <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                        <TableCell>{log.performed_by}</TableCell>
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

      {/* Link Communities Modal */}
      <Dialog open={linkCommunitiesOpen} onOpenChange={setLinkCommunitiesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Association to Communities</DialogTitle>
            <DialogDescription>Link to one or more communities.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Communities</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Search communities..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="com1">Ghana Belgium Community</SelectItem>
                  <SelectItem value="com2">Nigeria France Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkCommunitiesOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Community Linked" }); setLinkCommunitiesOpen(false); }}>Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>Invite a new member to the association.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="member@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteMemberOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Invitation Sent" }); setInviteMemberOpen(false); }}>Send Invitation</Button>
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
