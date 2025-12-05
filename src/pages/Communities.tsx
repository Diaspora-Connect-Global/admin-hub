import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, MoreHorizontal, Eye, Edit, Link2, Pause, ChevronDown, Download, FileJson, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const communitiesData = [
  { id: "COM-001", name: "Ghana Belgium Community", country: "Belgium", associationsCount: 12, membersCount: 1245, postsCount: 342, opportunitiesCount: 28, vendorEnabled: true, status: "Active", createdAt: "2024-01-15" },
  { id: "COM-002", name: "Nigeria UK Diaspora", country: "United Kingdom", associationsCount: 8, membersCount: 2103, postsCount: 567, opportunitiesCount: 45, vendorEnabled: true, status: "Active", createdAt: "2023-11-20" },
  { id: "COM-003", name: "Kenya Germany Network", country: "Germany", associationsCount: 5, membersCount: 432, postsCount: 89, opportunitiesCount: 12, vendorEnabled: false, status: "Inactive", createdAt: "2024-02-01" },
  { id: "COM-004", name: "South Africa Netherlands", country: "Netherlands", associationsCount: 15, membersCount: 1876, postsCount: 421, opportunitiesCount: 67, vendorEnabled: true, status: "Active", createdAt: "2023-09-10" },
  { id: "COM-005", name: "Uganda France Community", country: "France", associationsCount: 3, membersCount: 287, postsCount: 45, opportunitiesCount: 8, vendorEnabled: false, status: "Suspended", createdAt: "2023-06-15" },
];

const countryOptions = ["Ghana", "Nigeria", "Kenya", "South Africa", "Uganda", "Belgium", "United Kingdom", "Germany", "Netherlands", "France", "USA"];

const associationOptions = [
  { id: "ASC-001", name: "Ghana Nurses Association" },
  { id: "ASC-002", name: "Nigerian Engineers Association" },
  { id: "ASC-003", name: "African Professionals Network" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Active": "badge-status badge-success",
    "Inactive": "badge-status badge-warning",
    "Suspended": "badge-status badge-destructive",
  };
  return <span className={styles[status] || "badge-status badge-muted"}>{status}</span>;
};

export default function Communities() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [linkAssociationOpen, setLinkAssociationOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<typeof communitiesData[0] | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    country: "",
    vendorEnabled: false,
  });

  const filteredCommunities = communitiesData.filter((community) => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === "all" || community.country === countryFilter;
    const matchesStatus = statusFilter === "all" || community.status === statusFilter;
    return matchesSearch && matchesCountry && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedCommunities(checked ? communitiesData.map(c => c.id) : []);
  };

  const handleSelectCommunity = (id: string, checked: boolean) => {
    setSelectedCommunities(prev => checked ? [...prev, id] : prev.filter(cid => cid !== id));
  };

  const handleCreateCommunity = () => {
    if (!formData.name || !formData.country) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    toast({ title: "Community created successfully!", description: `${formData.name} has been created.` });
    setCreateModalOpen(false);
    setFormData({ name: "", description: "", country: "", vendorEnabled: false });
  };

  const handleSuspend = () => {
    toast({ title: "Community suspended", description: `${selectedCommunity?.name} has been suspended.` });
    setSuspendModalOpen(false);
    setSelectedCommunity(null);
  };

  const handleLinkAssociation = () => {
    toast({ title: "Association linked", description: "Association has been linked to the community." });
    setLinkAssociationOpen(false);
    setSelectedCommunity(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('communities.title')}</h1>
            <p className="text-muted-foreground">{t('communities.searchPlaceholder')}</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedCommunities.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem className="text-destructive"><Pause className="mr-2 h-4 w-4" /> Bulk Suspend</DropdownMenuItem>
                <DropdownMenuItem><Link2 className="mr-2 h-4 w-4" /> Bulk Link Associations</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Community
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name, country, community ID"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Countries</SelectItem>
                  {countryOptions.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
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
                        checked={selectedCommunities.length === communitiesData.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Community Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Associations Linked</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Opportunities</TableHead>
                    <TableHead>Vendor Enabled</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommunities.map((community) => (
                    <TableRow key={community.id} className="border-border/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedCommunities.includes(community.id)}
                          onCheckedChange={(checked) => handleSelectCommunity(community.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell><Badge variant="outline">{community.country}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                          {community.associationsCount}
                        </Badge>
                      </TableCell>
                      <TableCell>{community.membersCount.toLocaleString()}</TableCell>
                      <TableCell>{community.postsCount}</TableCell>
                      <TableCell>{community.opportunitiesCount}</TableCell>
                      <TableCell>
                        {community.vendorEnabled ? (
                          <Badge className="badge-status badge-success gap-1"><Store className="w-3 h-3" /> Enabled</Badge>
                        ) : (
                          <Badge className="badge-status badge-muted gap-1"><X className="w-3 h-3" /> Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{community.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/communities/${community.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedCommunity(community); setLinkAssociationOpen(true); }}>
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem onClick={() => navigate(`/communities/${community.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedCommunity(community); setLinkAssociationOpen(true); }}>
                                <Link2 className="mr-2 h-4 w-4" /> Link Association
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedCommunity(community); setSuspendModalOpen(true); }}>
                                <Pause className="mr-2 h-4 w-4" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
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
              <p className="text-sm text-muted-foreground">Showing 1-{filteredCommunities.length} of {filteredCommunities.length} communities</p>
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

      {/* Create Community Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Community</DialogTitle>
            <DialogDescription>Create a new community for the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Community Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Belgian Ghanaians Network" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Country <span className="text-destructive">*</span></Label>
              <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {countryOptions.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Description of the community..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Vendor Mode</Label>
                <p className="text-xs text-muted-foreground">Allow the community to sell products/services</p>
              </div>
              <Switch checked={formData.vendorEnabled} onCheckedChange={(checked) => setFormData({ ...formData, vendorEnabled: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCommunity}>Create Community</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Association Modal */}
      <Dialog open={linkAssociationOpen} onOpenChange={setLinkAssociationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Association to Community</DialogTitle>
            <DialogDescription>Link {selectedCommunity?.name} to one or more associations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Community</Label>
              <Input value={selectedCommunity?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Select Associations <span className="text-destructive">*</span></Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Search associations..." /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {associationOptions.map((assoc) => (
                    <SelectItem key={assoc.id} value={assoc.id}>{assoc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">You can select multiple associations</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkAssociationOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkAssociation}>Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Community Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Community</DialogTitle>
            <DialogDescription>Suspend {selectedCommunity?.name}</DialogDescription>
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
                  <SelectItem value="1day">1 day</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Suspending will block all posting and vendor activity for this community.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspend}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
