import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Plus, Eye, Check, X, Link2, MoreHorizontal, Edit, 
  Pause, FileJson, Download, ChevronDown, Upload
} from "lucide-react";

// Sample data
const sampleAssociations = [
  { 
    id: "ASC-001", 
    name: "Ghana Nurses Association - Belgium", 
    registration_id: "BE-GNA-2024-001", 
    country: "Belgium", 
    linked_communities_count: 2, 
    members_count: 150, 
    post_count: 45, 
    vendor_enabled: true, 
    verification_status: "Verified", 
    created_at: "2024-01-10" 
  },
  { 
    id: "ASC-002", 
    name: "Nigerian Engineers Association", 
    registration_id: "FR-NEA-2024-002", 
    country: "France", 
    linked_communities_count: 1, 
    members_count: 85, 
    post_count: 23, 
    vendor_enabled: false, 
    verification_status: "Pending", 
    created_at: "2024-01-12" 
  },
  { 
    id: "ASC-003", 
    name: "Cameroonian Teachers Union", 
    registration_id: "DE-CTU-2024-003", 
    country: "Germany", 
    linked_communities_count: 3, 
    members_count: 200, 
    post_count: 67, 
    vendor_enabled: true, 
    verification_status: "Verified", 
    created_at: "2024-01-08" 
  },
  { 
    id: "ASC-004", 
    name: "Senegalese Business Network", 
    registration_id: "IT-SBN-2024-004", 
    country: "Italy", 
    linked_communities_count: 0, 
    members_count: 45, 
    post_count: 12, 
    vendor_enabled: false, 
    verification_status: "Rejected", 
    created_at: "2024-01-14" 
  },
  { 
    id: "ASC-005", 
    name: "Ethiopian Cultural Society", 
    registration_id: "NL-ECS-2024-005", 
    country: "Netherlands", 
    linked_communities_count: 1, 
    members_count: 120, 
    post_count: 34, 
    vendor_enabled: true, 
    verification_status: "Suspended", 
    created_at: "2024-01-05" 
  },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Verified": "badge-status badge-success",
    "Pending": "badge-status badge-warning",
    "Rejected": "badge-status badge-destructive",
    "Suspended": "badge-status bg-destructive/20 text-destructive",
  };
  return <span className={styles[status] || "badge-status badge-muted"}>{status}</span>;
};

export default function Associations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [linkCommunitiesOpen, setLinkCommunitiesOpen] = useState(false);
  const [approveRejectOpen, setApproveRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState<typeof sampleAssociations[0] | null>(null);
  
  // Filters
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSelectAll = (checked: boolean) => {
    setSelectedAssociations(checked ? sampleAssociations.map(a => a.id) : []);
  };

  const handleSelectAssociation = (id: string, checked: boolean) => {
    setSelectedAssociations(prev => 
      checked ? [...prev, id] : prev.filter(aid => aid !== id)
    );
  };

  const handleCreateAssociation = () => {
    toast({ title: "Association Created", description: "Association created and submitted for verification." });
    setCreateModalOpen(false);
  };

  const handleApproveReject = (decision: "approve" | "reject") => {
    toast({ 
      title: decision === "approve" ? "Association Approved" : "Association Rejected",
      description: decision === "approve" 
        ? "Association has been approved and notified."
        : "Association has been rejected. Notification sent."
    });
    setApproveRejectOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Associations</h1>
            <p className="text-muted-foreground">Create and manage associations; link them to one or many communities and countries.</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedAssociations.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Check className="mr-2 h-4 w-4" /> Bulk Approve Low-Risk</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><X className="mr-2 h-4 w-4" /> Bulk Reject</DropdownMenuItem>
                <DropdownMenuItem><Link2 className="mr-2 h-4 w-4" /> Bulk Link to Community</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Association
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name, registration ID, country, association ID"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="belgium">Belgium</SelectItem>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="germany">Germany</SelectItem>
                  <SelectItem value="italy">Italy</SelectItem>
                  <SelectItem value="netherlands">Netherlands</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedAssociations.length === sampleAssociations.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Association Name</TableHead>
                    <TableHead>Registration ID</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Linked Communities</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Vendor Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleAssociations.map((association) => (
                    <TableRow key={association.id} className="border-border/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedAssociations.includes(association.id)}
                          onCheckedChange={(checked) => handleSelectAssociation(association.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{association.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{association.registration_id}</TableCell>
                      <TableCell>{association.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{association.linked_communities_count}</Badge>
                      </TableCell>
                      <TableCell>{association.members_count}</TableCell>
                      <TableCell>{association.post_count}</TableCell>
                      <TableCell>
                        {association.vendor_enabled ? (
                          <Badge className="badge-status badge-success">Enabled</Badge>
                        ) : (
                          <Badge className="badge-status badge-muted">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(association.verification_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{association.created_at}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/associations/${association.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {association.verification_status === "Pending" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-success hover:text-success"
                                onClick={() => { setSelectedAssociation(association); setApproveRejectOpen(true); }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => { setSelectedAssociation(association); setApproveRejectOpen(true); }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setSelectedAssociation(association); setLinkCommunitiesOpen(true); }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/associations/${association.id}`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => { setSelectedAssociation(association); setSuspendOpen(true); }}
                              >
                                <Pause className="mr-2 h-4 w-4" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <FileJson className="mr-2 h-4 w-4" /> Export Data
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
              <p className="text-sm text-muted-foreground">Showing 1-5 of 5 associations</p>
              <div className="flex items-center gap-2">
                <Select defaultValue="10">
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

      {/* Create Association Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Association</DialogTitle>
            <DialogDescription>Create a new association and submit for verification.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Association Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Ghana Nurses Association - Belgium" />
            </div>
            <div className="space-y-2">
              <Label>Registration ID</Label>
              <Input placeholder="Optional registration number" />
            </div>
            <div className="space-y-2">
              <Label>Country <span className="text-destructive">*</span></Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="belgium">Belgium</SelectItem>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="germany">Germany</SelectItem>
                  <SelectItem value="italy">Italy</SelectItem>
                  <SelectItem value="netherlands">Netherlands</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Contact Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Contact person name" />
            </div>
            <div className="space-y-2">
              <Label>Primary Contact Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="contact@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Primary Contact Phone</Label>
              <Input placeholder="+32 471 234 567" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the association..." />
            </div>
            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop files or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 10MB each)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAssociation}>Create Association</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Communities Modal */}
      <Dialog open={linkCommunitiesOpen} onOpenChange={setLinkCommunitiesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Association to Communities</DialogTitle>
            <DialogDescription>
              Link {selectedAssociation?.name} to one or more communities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Association</Label>
              <Input value={selectedAssociation?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Select Communities <span className="text-destructive">*</span></Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Search communities..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ghana-belgium">Ghana Belgium Community</SelectItem>
                  <SelectItem value="nigeria-france">Nigeria France Community</SelectItem>
                  <SelectItem value="african-professionals">African Professionals Network</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">You can select multiple communities</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkCommunitiesOpen(false)}>Cancel</Button>
            <Button onClick={() => { 
              toast({ title: "Communities Linked", description: "Association has been linked to selected communities." });
              setLinkCommunitiesOpen(false);
            }}>
              Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Modal */}
      <Dialog open={approveRejectOpen} onOpenChange={setApproveRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve / Reject Association</DialogTitle>
            <DialogDescription>Review and make a decision for {selectedAssociation?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="decision" value="approve" className="accent-primary" />
                  <span>Approve</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="decision" value="reject" className="accent-destructive" />
                  <span>Reject</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (required if rejecting)</Label>
              <Textarea placeholder="Enter reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveRejectOpen(false)}>Cancel</Button>
            <Button onClick={() => handleApproveReject("approve")}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Association Modal */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Association</DialogTitle>
            <DialogDescription>Suspend {selectedAssociation?.name}</DialogDescription>
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
                  <SelectItem value="1day">1 day</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              toast({ title: "Association Suspended", description: "Association has been suspended." });
              setSuspendOpen(false);
            }}>
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
