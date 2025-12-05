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
import { Search, Plus, MoreHorizontal, Eye, Edit, Link2, Pause, ChevronDown, Download, FileJson, Store, X, BarChart3, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const communitiesData = [
  { id: "COM-001", name: "Ghana Belgium Community", type: "Association", country: "Belgium", associationsCount: 12, membersCount: 1245, postsCount: 342, eventsCount: 28, vendorEnabled: true, status: "Active", createdAt: "2024-01-15" },
  { id: "COM-002", name: "Nigeria UK Diaspora", type: "NGO", country: "United Kingdom", associationsCount: 8, membersCount: 2103, postsCount: 567, eventsCount: 45, vendorEnabled: true, status: "Active", createdAt: "2023-11-20" },
  { id: "COM-003", name: "Kenya Germany Network", type: "Club", country: "Germany", associationsCount: 5, membersCount: 432, postsCount: 89, eventsCount: 12, vendorEnabled: false, status: "Inactive", createdAt: "2024-02-01" },
  { id: "COM-004", name: "South Africa Netherlands", type: "Embassy", country: "Netherlands", associationsCount: 15, membersCount: 1876, postsCount: 421, eventsCount: 67, vendorEnabled: true, status: "Active", createdAt: "2023-09-10" },
  { id: "COM-005", name: "Uganda France Community", type: "Church", country: "France", associationsCount: 3, membersCount: 287, postsCount: 45, eventsCount: 8, vendorEnabled: false, status: "Suspended", createdAt: "2023-06-15" },
];

const countryOptions = ["Ghana", "Nigeria", "Kenya", "South Africa", "Uganda", "Belgium", "United Kingdom", "Germany", "Netherlands", "France", "USA"];
const typeOptions = ["Embassy", "NGO", "Church", "Association", "Club", "Other"];

const associationOptions = [
  { id: "ASC-001", name: "Ghana Nurses Association" },
  { id: "ASC-002", name: "Nigerian Engineers Association" },
  { id: "ASC-003", name: "African Professionals Network" },
];

export default function Communities() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-az");
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
    type: "",
    vendorEnabled: false,
  });

  const filteredCommunities = communitiesData
    .filter((community) => {
      const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = countryFilter === "all" || community.country === countryFilter;
      const matchesType = typeFilter === "all" || community.type === typeFilter;
      const matchesStatus = statusFilter === "all" || community.status === statusFilter;
      return matchesSearch && matchesCountry && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-az": return a.name.localeCompare(b.name);
        case "name-za": return b.name.localeCompare(a.name);
        case "date-newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });

  const handleSelectAll = (checked: boolean) => {
    setSelectedCommunities(checked ? communitiesData.map(c => c.id) : []);
  };

  const handleSelectCommunity = (id: string, checked: boolean) => {
    setSelectedCommunities(prev => checked ? [...prev, id] : prev.filter(cid => cid !== id));
  };

  const handleCreateCommunity = () => {
    if (!formData.name || !formData.country) {
      toast({ title: t('communities.validationError'), description: t('communities.fillRequired'), variant: "destructive" });
      return;
    }
    toast({ title: t('communities.communityCreated'), description: t('communities.communityCreatedDesc', { name: formData.name }) });
    setCreateModalOpen(false);
    setFormData({ name: "", description: "", country: "", type: "", vendorEnabled: false });
  };

  const handleSuspend = () => {
    toast({ title: t('communities.communitySuspended'), description: t('communities.communitySuspendedDesc', { name: selectedCommunity?.name }) });
    setSuspendModalOpen(false);
    setSelectedCommunity(null);
  };

  const handleLinkAssociation = () => {
    toast({ title: t('communities.associationLinked'), description: t('communities.associationLinkedDesc') });
    setLinkAssociationOpen(false);
    setSelectedCommunity(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "Active": "badge-status badge-success",
      "Inactive": "badge-status badge-warning",
      "Suspended": "badge-status badge-destructive",
    };
    const labels: Record<string, string> = {
      "Active": t('common.active'),
      "Inactive": t('common.inactive'),
      "Suspended": t('communities.suspended'),
    };
    return <span className={styles[status] || "badge-status badge-muted"}>{labels[status] || status}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('communities.title')}</h1>
            <p className="text-muted-foreground">{t('communities.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedCommunities.length === 0}>
                  {t('communities.bulkActions')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem className="text-destructive"><Pause className="mr-2 h-4 w-4" /> {t('communities.bulkSuspend')}</DropdownMenuItem>
                <DropdownMenuItem><Link2 className="mr-2 h-4 w-4" /> {t('communities.bulkLinkAssociations')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> {t('communities.exportCommunities')}
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('communities.createCommunity')}
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
                  placeholder={t('communities.searchPlaceholder')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('communities.communityType')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">{t('communities.allTypes')}</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('communities.countriesServed')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">{t('communities.allCountries')}</SelectItem>
                  {countryOptions.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">{t('communities.allStatus')}</SelectItem>
                  <SelectItem value="Active">{t('common.active')}</SelectItem>
                  <SelectItem value="Inactive">{t('common.inactive')}</SelectItem>
                  <SelectItem value="Suspended">{t('communities.suspended')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('communities.sortBy')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="name-az">{t('communities.nameAZ')}</SelectItem>
                  <SelectItem value="name-za">{t('communities.nameZA')}</SelectItem>
                  <SelectItem value="date-newest">{t('communities.dateNewest')}</SelectItem>
                  <SelectItem value="date-oldest">{t('communities.dateOldest')}</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>{t('communities.communityName')}</TableHead>
                    <TableHead>{t('communities.communityType')}</TableHead>
                    <TableHead>{t('communities.countriesServed')}</TableHead>
                    <TableHead>{t('communities.associationsLinked')}</TableHead>
                    <TableHead>{t('communities.members')}</TableHead>
                    <TableHead>{t('communities.posts')}</TableHead>
                    <TableHead>{t('communities.events')}</TableHead>
                    <TableHead>{t('communities.vendorEnabled')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="w-28">{t('common.actions')}</TableHead>
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
                      <TableCell>
                        <Badge variant="outline" className={community.type === "Embassy" ? "border-blue-500 text-blue-500" : ""}>
                          {community.type}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">{community.country}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                          {community.associationsCount}
                        </Badge>
                      </TableCell>
                      <TableCell>{community.membersCount.toLocaleString()}</TableCell>
                      <TableCell>{community.postsCount}</TableCell>
                      <TableCell>{community.eventsCount}</TableCell>
                      <TableCell>
                        {community.vendorEnabled ? (
                          <Badge className="badge-status badge-success gap-1"><Store className="w-3 h-3" /> {t('communities.enabled')}</Badge>
                        ) : (
                          <Badge className="badge-status badge-muted gap-1"><X className="w-3 h-3" /> {t('communities.disabled')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(community.status)}</TableCell>
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
                                <Eye className="mr-2 h-4 w-4" /> {t('communities.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> {t('communities.editCommunity')}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedCommunity(community); setLinkAssociationOpen(true); }}>
                                <Link2 className="mr-2 h-4 w-4" /> {t('communities.manageAssociations')}
                              </DropdownMenuItem>
                              <DropdownMenuItem><BarChart3 className="mr-2 h-4 w-4" /> {t('communities.viewAnalytics')}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedCommunity(community); setSuspendModalOpen(true); }}>
                                <Pause className="mr-2 h-4 w-4" /> {t('communities.suspend')}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> {t('communities.deleteCommunity')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem><FileJson className="mr-2 h-4 w-4" /> {t('communities.exportData')}</DropdownMenuItem>
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
              <p className="text-sm text-muted-foreground">{t('communities.showing')} 1-{filteredCommunities.length} {t('communities.of')} {filteredCommunities.length} {t('communities.title').toLowerCase()}</p>
              <div className="flex items-center gap-2">
                <Select defaultValue="20">
                  <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" disabled>{t('common.previous')}</Button>
                <Button variant="outline" size="sm" disabled>{t('common.next')}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Community Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('communities.createCommunity')}</DialogTitle>
            <DialogDescription>{t('communities.createCommunityDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('communities.communityName')} <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Belgian Ghanaians Network" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('communities.communityType')} <span className="text-destructive">*</span></Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger><SelectValue placeholder={t('communities.allTypes')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('communities.countriesServed')} <span className="text-destructive">*</span></Label>
              <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                <SelectTrigger><SelectValue placeholder={t('communities.selectCountry')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {countryOptions.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.description')}</Label>
              <Textarea placeholder={t('common.description') + "..."} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('communities.enableVendorMode')}</Label>
                <p className="text-xs text-muted-foreground">{t('communities.vendorModeDesc')}</p>
              </div>
              <Switch checked={formData.vendorEnabled} onCheckedChange={(checked) => setFormData({ ...formData, vendorEnabled: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateCommunity}>{t('communities.createCommunity')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Association Modal */}
      <Dialog open={linkAssociationOpen} onOpenChange={setLinkAssociationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('communities.linkAssociationTo')}</DialogTitle>
            <DialogDescription>{t('communities.linkAssociationDesc', { name: selectedCommunity?.name })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('communities.title')}</Label>
              <Input value={selectedCommunity?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('communities.selectAssociations')} <span className="text-destructive">*</span></Label>
              <Select>
                <SelectTrigger><SelectValue placeholder={t('communities.searchAssociations')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {associationOptions.map((assoc) => (
                    <SelectItem key={assoc.id} value={assoc.id}>{assoc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkAssociationOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleLinkAssociation}>{t('communities.linkAssociation')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Community Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('communities.suspendCommunity')}</DialogTitle>
            <DialogDescription>{t('communities.suspendConfirm', { name: selectedCommunity?.name })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('communities.suspendReason')} <span className="text-destructive">*</span></Label>
              <Textarea placeholder={t('communities.suspendReason') + "..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleSuspend}>{t('communities.suspend')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}