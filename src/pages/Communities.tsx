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
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiSelect } from "@/components/ui/multi-select";
import { Search, Plus, MoreHorizontal, Eye, Edit, Link2, Pause, ChevronDown, Download, FileJson, Store, X, BarChart3, Trash2, Upload, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const communitiesData = [
  { id: "COM-001", name: "Ghana Belgium Community", type: "Association", countriesServed: ["Belgium", "Ghana"], embassyCountry: null, locationCountry: null, associationsCount: 12, membersCount: 1245, postsCount: 342, eventsCount: 28, vendorEnabled: true, status: "Active", createdAt: "2024-01-15" },
  { id: "COM-002", name: "Nigeria UK Diaspora", type: "NGO", countriesServed: ["United Kingdom", "Nigeria"], embassyCountry: null, locationCountry: null, associationsCount: 8, membersCount: 2103, postsCount: 567, eventsCount: 45, vendorEnabled: true, status: "Active", createdAt: "2023-11-20" },
  { id: "COM-003", name: "Kenya Germany Network", type: "Club", countriesServed: ["Germany", "Kenya"], embassyCountry: null, locationCountry: null, associationsCount: 5, membersCount: 432, postsCount: 89, eventsCount: 12, vendorEnabled: false, status: "Inactive", createdAt: "2024-02-01" },
  { id: "COM-004", name: "South Africa Embassy Netherlands", type: "Embassy", countriesServed: ["Netherlands"], embassyCountry: "South Africa", locationCountry: "Netherlands", associationsCount: 15, membersCount: 1876, postsCount: 421, eventsCount: 67, vendorEnabled: true, status: "Active", createdAt: "2023-09-10" },
  { id: "COM-005", name: "Uganda France Community", type: "Church", countriesServed: ["France", "Uganda"], embassyCountry: null, locationCountry: null, associationsCount: 3, membersCount: 287, postsCount: 45, eventsCount: 8, vendorEnabled: false, status: "Suspended", createdAt: "2023-06-15" },
];

// Complete list of all countries
const allCountries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Brazzaville)", "Congo (Kinshasa)",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const countryOptions = allCountries.map(country => ({ label: country, value: country }));
const typeOptions = ["Embassy", "NGO", "Church", "Association", "Club", "Other"];

const mockAdmins = [
  { id: "USR-001", name: "John Doe", email: "john@example.com" },
  { id: "USR-002", name: "Jane Smith", email: "jane@example.com" },
  { id: "USR-003", name: "Michael Brown", email: "michael@example.com" },
  { id: "USR-004", name: "Sarah Wilson", email: "sarah@example.com" },
];

const associationOptions = [
  { id: "ASC-001", name: "Ghana Nurses Association" },
  { id: "ASC-002", name: "Nigerian Engineers Association" },
  { id: "ASC-003", name: "African Professionals Network" },
];

interface CreateFormData {
  communityName: string;
  description: string;
  communityType: string;
  countriesServed: string[];
  logoBanner: File | null;
  rules: string;
  joinPolicy: string;
  whoCanPost: string;
  groupCreationPermission: string;
  postModeration: boolean;
  communityAdmins: string[];
  // Contact fields (for all types)
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  // Embassy-specific fields
  embassyCountry: string;
  locationCountry: string;
}

const initialFormData: CreateFormData = {
  communityName: "",
  description: "",
  communityType: "",
  countriesServed: [],
  logoBanner: null,
  rules: "",
  joinPolicy: "Approval Required",
  whoCanPost: "Admins Only",
  groupCreationPermission: "Admins Only",
  postModeration: true,
  communityAdmins: [],
  address: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  embassyCountry: "",
  locationCountry: "",
};

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
  const [formData, setFormData] = useState<CreateFormData>(initialFormData);

  const filteredCommunities = communitiesData
    .filter((community) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        community.name.toLowerCase().includes(searchLower) ||
        community.countriesServed.some(c => c.toLowerCase().includes(searchLower)) ||
        community.type.toLowerCase().includes(searchLower) ||
        community.id.toLowerCase().includes(searchLower) ||
        (community.embassyCountry && community.embassyCountry.toLowerCase().includes(searchLower)) ||
        (community.locationCountry && community.locationCountry.toLowerCase().includes(searchLower));
      const matchesCountry = countryFilter === "all" || community.countriesServed.includes(countryFilter);
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

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateCommunity = () => {
    // Validate required fields
    if (!formData.communityName || !formData.communityType || formData.countriesServed.length === 0 || formData.communityAdmins.length === 0) {
      toast({ title: t('communities.validationError'), description: t('communities.fillRequired'), variant: "destructive" });
      return;
    }

    // Embassy-specific validation
    if (formData.communityType === "Embassy" && (!formData.embassyCountry || !formData.locationCountry)) {
      toast({ title: t('communities.validationError'), description: t('communities.embassyFieldsRequired'), variant: "destructive" });
      return;
    }

    // Email validation
    if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
      toast({ title: t('communities.validationError'), description: t('communities.invalidEmail'), variant: "destructive" });
      return;
    }

    // URL validation
    if (formData.website && !validateUrl(formData.website)) {
      toast({ title: t('communities.validationError'), description: t('communities.invalidWebsite'), variant: "destructive" });
      return;
    }

    toast({ title: t('communities.communityCreated'), description: t('communities.communityCreatedDesc', { name: formData.communityName }) });
    setCreateModalOpen(false);
    setFormData(initialFormData);
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

  const handleAdminToggle = (adminId: string) => {
    setFormData(prev => ({
      ...prev,
      communityAdmins: prev.communityAdmins.includes(adminId)
        ? prev.communityAdmins.filter(id => id !== adminId)
        : [...prev.communityAdmins, adminId]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({ title: t('communities.validationError'), description: t('communities.invalidFileType'), variant: "destructive" });
        return;
      }
      setFormData(prev => ({ ...prev, logoBanner: file }));
    }
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
                <SelectContent className="bg-popover border-border max-h-64">
                  <SelectItem value="all">{t('communities.allCountries')}</SelectItem>
                  {allCountries.map((country) => (
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
                    <TableHead>{t('communities.embassyInfo')}</TableHead>
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
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {community.countriesServed.map((country) => (
                            <Badge key={country} variant="outline" className="text-xs">{country}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {community.type === "Embassy" && community.embassyCountry && community.locationCountry ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Globe className="h-3 w-3 text-blue-500" />
                            <span>{community.embassyCountry} → {community.locationCountry}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('communities.createCommunity')}</DialogTitle>
            <DialogDescription>{t('communities.createCommunityDesc')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">{t('communities.form.basicInfo')}</h3>
                
                <div className="space-y-2">
                  <Label>{t('communities.communityName')} <span className="text-destructive">*</span></Label>
                  <Input 
                    placeholder={t('communities.form.namePlaceholder')} 
                    value={formData.communityName} 
                    onChange={(e) => setFormData({ ...formData, communityName: e.target.value })} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('common.description')}</Label>
                  <Textarea 
                    placeholder={t('communities.form.descriptionPlaceholder')} 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('communities.communityType')} <span className="text-destructive">*</span></Label>
                  <Select value={formData.communityType} onValueChange={(value) => setFormData({ ...formData, communityType: value })}>
                    <SelectTrigger><SelectValue placeholder={t('communities.form.selectType')} /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {typeOptions.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('communities.countriesServed')} <span className="text-destructive">*</span></Label>
                  <MultiSelect
                    options={countryOptions}
                    selected={formData.countriesServed}
                    onChange={(selected) => setFormData({ ...formData, countriesServed: selected })}
                    placeholder={t('communities.form.selectCountries')}
                    searchPlaceholder={t('common.search')}
                    maxDisplay={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('communities.form.logoBanner')}</Label>
                  <div className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t('communities.form.uploadImage')}</span>
                      <span className="text-xs text-muted-foreground">{t('communities.form.acceptedFormats')}</span>
                    </label>
                    {formData.logoBanner && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <Badge variant="secondary">{formData.logoBanner.name}</Badge>
                        <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => setFormData({ ...formData, logoBanner: null })} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('communities.form.rulesGuidelines')}</Label>
                  <Textarea 
                    placeholder={t('communities.form.rulesPlaceholder')} 
                    value={formData.rules} 
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })} 
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('communities.form.joinPolicy')} <span className="text-destructive">*</span></Label>
                    <Select value={formData.joinPolicy} onValueChange={(value) => setFormData({ ...formData, joinPolicy: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Open">{t('communities.form.joinOpen')}</SelectItem>
                        <SelectItem value="Approval Required">{t('communities.form.joinApproval')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('communities.form.whoCanPost')} <span className="text-destructive">*</span></Label>
                    <Select value={formData.whoCanPost} onValueChange={(value) => setFormData({ ...formData, whoCanPost: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Admins Only">{t('communities.form.adminsOnly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('communities.form.groupCreation')} <span className="text-destructive">*</span></Label>
                    <Select value={formData.groupCreationPermission} onValueChange={(value) => setFormData({ ...formData, groupCreationPermission: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Admins Only">{t('communities.form.adminsOnly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div>
                      <Label>{t('communities.form.postModeration')}</Label>
                      <p className="text-xs text-muted-foreground">{t('communities.form.postModerationDesc')}</p>
                    </div>
                    <Switch 
                      checked={formData.postModeration} 
                      onCheckedChange={(checked) => setFormData({ ...formData, postModeration: checked })} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('communities.form.communityAdmins')} <span className="text-destructive">*</span></Label>
                  <div className="border border-border rounded-md p-3 max-h-32 overflow-y-auto bg-background">
                    {mockAdmins.map((admin) => (
                      <div key={admin.id} className="flex items-center space-x-2 py-1">
                        <Checkbox 
                          id={`admin-${admin.id}`}
                          checked={formData.communityAdmins.includes(admin.id)}
                          onCheckedChange={() => handleAdminToggle(admin.id)}
                        />
                        <label htmlFor={`admin-${admin.id}`} className="text-sm cursor-pointer flex-1">
                          {admin.name} <span className="text-muted-foreground">({admin.email})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.communityAdmins.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.communityAdmins.map((adminId) => {
                        const admin = mockAdmins.find(a => a.id === adminId);
                        return admin ? (
                          <Badge key={adminId} variant="secondary" className="gap-1">
                            {admin.name}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => handleAdminToggle(adminId)} />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information Section - For All Types */}
              {formData.communityType && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    {t('communities.form.contactInfo')}
                  </h3>

                  <div className="space-y-2">
                    <Label>{t('communities.form.address')}</Label>
                    <Input 
                      placeholder={t('communities.form.addressPlaceholder')} 
                      value={formData.address} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('communities.form.contactEmail')}</Label>
                      <Input 
                        type="email"
                        placeholder={t('communities.form.contactEmailPlaceholder')} 
                        value={formData.contactEmail} 
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('communities.form.contactPhone')}</Label>
                      <Input 
                        placeholder={t('communities.form.contactPhonePlaceholder')} 
                        value={formData.contactPhone} 
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('communities.form.website')}</Label>
                    <Input 
                      placeholder={t('communities.form.websitePlaceholder')} 
                      value={formData.website} 
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {/* Embassy Information Section - Conditional */}
              {formData.communityType === "Embassy" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    {t('communities.form.embassyInfo')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('communities.form.embassyCountry')} <span className="text-destructive">*</span></Label>
                      <Select value={formData.embassyCountry} onValueChange={(value) => setFormData({ ...formData, embassyCountry: value })}>
                        <SelectTrigger><SelectValue placeholder={t('communities.form.embassyCountryPlaceholder')} /></SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-64">
                          {allCountries.map((country) => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('communities.form.locationCountry')} <span className="text-destructive">*</span></Label>
                      <Select value={formData.locationCountry} onValueChange={(value) => setFormData({ ...formData, locationCountry: value })}>
                        <SelectTrigger><SelectValue placeholder={t('communities.form.locationCountryPlaceholder')} /></SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-64">
                          {allCountries.map((country) => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); setFormData(initialFormData); }}>{t('common.cancel')}</Button>
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
