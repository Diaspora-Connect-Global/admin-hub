import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Plus, Eye, MoreHorizontal, Edit, Trash2, Link2, Users, 
  Download, ChevronDown, Upload, Building2, Globe, Mail, Phone, LinkIcon
} from "lucide-react";

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
const typeOptions = ["NGO", "Club", "Church", "Community Organization", "Other"];

const mockAdmins = [
  { id: "USR-001", name: "John Doe", email: "john@example.com", role: "Association Admin" },
  { id: "USR-002", name: "Jane Smith", email: "jane@example.com", role: "Moderator" },
  { id: "USR-003", name: "Michael Brown", email: "michael@example.com", role: "Association Admin" },
  { id: "USR-004", name: "Sarah Wilson", email: "sarah@example.com", role: "Editor" },
];

const mockCommunities = [
  { id: "COM-001", name: "Ghana Belgium Community", type: "Association", countriesServed: ["Belgium", "Ghana"] },
  { id: "COM-002", name: "Nigeria UK Diaspora", type: "NGO", countriesServed: ["United Kingdom", "Nigeria"] },
  { id: "COM-003", name: "Kenya Germany Network", type: "Club", countriesServed: ["Germany", "Kenya"] },
];

const sampleAssociations = [
  { 
    id: "ASC-001", 
    name: "Ghana Nurses Association - Belgium", 
    type: "NGO",
    description: "Professional association for Ghanaian nurses in Belgium.",
    countriesServed: ["Belgium", "Ghana"], 
    linkedCommunities: ["COM-001", "COM-002"],
    membersCount: 150, 
    postsCount: 45, 
    opportunitiesCount: 12,
    vendorProductsCount: 8,
    isPaid: true,
    paymentType: "Monthly",
    paymentAmount: 25,
    paymentCurrency: "EUR",
    assignedAdmins: ["USR-001", "USR-002"],
    joinPolicy: "Approval Required",
    whoCanPost: "Admins Only",
    logoUrl: null,
    address: "123 Main St, Brussels",
    contactEmail: "contact@ghananurses.be",
    contactPhone: "+32 471 234 567",
    website: "https://ghananurses.be",
    createdAt: "2024-01-10" 
  },
  { 
    id: "ASC-002", 
    name: "Nigerian Engineers Association", 
    type: "Club",
    description: "Network for Nigerian engineering professionals in France.",
    countriesServed: ["France", "Nigeria"], 
    linkedCommunities: ["COM-002"],
    membersCount: 85, 
    postsCount: 23, 
    opportunitiesCount: 5,
    vendorProductsCount: 0,
    isPaid: false,
    paymentType: null,
    paymentAmount: null,
    paymentCurrency: null,
    assignedAdmins: ["USR-003"],
    joinPolicy: "Open",
    whoCanPost: "All Members",
    logoUrl: null,
    address: "45 Rue de Paris, Paris",
    contactEmail: "info@nigerianengineers.fr",
    contactPhone: "+33 6 12 34 56 78",
    website: "https://nigerianengineers.fr",
    createdAt: "2024-01-12" 
  },
  { 
    id: "ASC-003", 
    name: "Cameroonian Teachers Union", 
    type: "Community Organization",
    description: "Supporting Cameroonian educators across Germany.",
    countriesServed: ["Germany", "Cameroon"], 
    linkedCommunities: ["COM-001", "COM-003"],
    membersCount: 200, 
    postsCount: 67, 
    opportunitiesCount: 18,
    vendorProductsCount: 15,
    isPaid: true,
    paymentType: "Yearly",
    paymentAmount: 120,
    paymentCurrency: "EUR",
    assignedAdmins: ["USR-001", "USR-004"],
    joinPolicy: "Approval Required",
    whoCanPost: "Admins Only",
    logoUrl: null,
    address: "78 Hauptstraße, Berlin",
    contactEmail: "contact@cameroonteachers.de",
    contactPhone: "+49 170 1234567",
    website: "https://cameroonteachers.de",
    createdAt: "2024-01-08" 
  },
  { 
    id: "ASC-004", 
    name: "Senegalese Business Network", 
    type: "Club",
    description: "Connecting Senegalese entrepreneurs in Italy.",
    countriesServed: ["Italy", "Senegal"], 
    linkedCommunities: [],
    membersCount: 45, 
    postsCount: 12, 
    opportunitiesCount: 3,
    vendorProductsCount: 2,
    isPaid: false,
    paymentType: null,
    paymentAmount: null,
    paymentCurrency: null,
    assignedAdmins: ["USR-002"],
    joinPolicy: "Open",
    whoCanPost: "All Members",
    logoUrl: null,
    address: "22 Via Roma, Milan",
    contactEmail: "hello@senegalbusiness.it",
    contactPhone: "+39 333 1234567",
    website: null,
    createdAt: "2024-01-14" 
  },
  { 
    id: "ASC-005", 
    name: "Ethiopian Cultural Society", 
    type: "Church",
    description: "Promoting Ethiopian culture and heritage in Netherlands.",
    countriesServed: ["Netherlands", "Ethiopia"], 
    linkedCommunities: ["COM-001"],
    membersCount: 120, 
    postsCount: 34, 
    opportunitiesCount: 8,
    vendorProductsCount: 5,
    isPaid: true,
    paymentType: "Monthly",
    paymentAmount: 15,
    paymentCurrency: "EUR",
    assignedAdmins: ["USR-003", "USR-004"],
    joinPolicy: "Approval Required",
    whoCanPost: "Admins Only",
    logoUrl: null,
    address: "56 Amstelstraat, Amsterdam",
    contactEmail: "info@ethiopiansociety.nl",
    contactPhone: "+31 6 12345678",
    website: "https://ethiopiansociety.nl",
    createdAt: "2024-01-05" 
  },
];

interface CreateFormData {
  name: string;
  description: string;
  type: string;
  countriesServed: string[];
  logoBanner: File | null;
  joinPolicy: string;
  whoCanPost: string;
  isPaid: boolean;
  paymentType: string;
  paymentAmount: string;
  paymentCurrency: string;
  assignedAdmins: string[];
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

const initialFormData: CreateFormData = {
  name: "",
  description: "",
  type: "",
  countriesServed: [],
  logoBanner: null,
  joinPolicy: "Approval Required",
  whoCanPost: "Admins Only",
  isPaid: false,
  paymentType: "Monthly",
  paymentAmount: "",
  paymentCurrency: "EUR",
  assignedAdmins: [],
  address: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
};

export default function Associations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [linkedCommunitiesFilter, setLinkedCommunitiesFilter] = useState<string[]>([]);
  const [countriesFilter, setCountriesFilter] = useState<string[]>([]);
  const [paidFilter, setPaidFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-az");
  
  // Selection
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([]);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignAdminsModalOpen, setAssignAdminsModalOpen] = useState(false);
  const [linkCommunitiesModalOpen, setLinkCommunitiesModalOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState<typeof sampleAssociations[0] | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateFormData>(initialFormData);

  const communityOptions = mockCommunities.map(c => ({ label: c.name, value: c.id }));

  const filteredAssociations = sampleAssociations
    .filter((assoc) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        assoc.name.toLowerCase().includes(searchLower) ||
        assoc.type.toLowerCase().includes(searchLower) ||
        assoc.countriesServed.some(c => c.toLowerCase().includes(searchLower)) ||
        assoc.linkedCommunities.some(cid => {
          const community = mockCommunities.find(c => c.id === cid);
          return community?.name.toLowerCase().includes(searchLower);
        });
      const matchesType = typeFilter === "all" || assoc.type === typeFilter;
      const matchesLinkedCommunities = linkedCommunitiesFilter.length === 0 || 
        assoc.linkedCommunities.some(cid => linkedCommunitiesFilter.includes(cid));
      const matchesCountries = countriesFilter.length === 0 || 
        assoc.countriesServed.some(c => countriesFilter.includes(c));
      const matchesPaid = paidFilter === "all" || 
        (paidFilter === "paid" && assoc.isPaid) || 
        (paidFilter === "free" && !assoc.isPaid);
      return matchesSearch && matchesType && matchesLinkedCommunities && matchesCountries && matchesPaid;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-az": return a.name.localeCompare(b.name);
        case "name-za": return b.name.localeCompare(a.name);
        case "date-newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "payment-high": return (b.paymentAmount || 0) - (a.paymentAmount || 0);
        case "payment-low": return (a.paymentAmount || 0) - (b.paymentAmount || 0);
        default: return 0;
      }
    });

  const handleSelectAll = (checked: boolean) => {
    setSelectedAssociations(checked ? sampleAssociations.map(a => a.id) : []);
  };

  const handleSelectAssociation = (id: string, checked: boolean) => {
    setSelectedAssociations(prev => checked ? [...prev, id] : prev.filter(aid => aid !== id));
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

  const handleCreateAssociation = () => {
    if (!formData.name || !formData.type || formData.countriesServed.length === 0 || formData.assignedAdmins.length === 0) {
      toast({ title: t('associations.validationError'), description: t('associations.fillRequired'), variant: "destructive" });
      return;
    }
    if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
      toast({ title: t('associations.validationError'), description: t('associations.invalidEmail'), variant: "destructive" });
      return;
    }
    if (formData.website && !validateUrl(formData.website)) {
      toast({ title: t('associations.validationError'), description: t('associations.invalidWebsite'), variant: "destructive" });
      return;
    }
    if (formData.isPaid && !formData.paymentAmount) {
      toast({ title: t('associations.validationError'), description: t('associations.paymentAmountRequired'), variant: "destructive" });
      return;
    }
    
    toast({ title: t('associations.createSuccess'), description: t('associations.createSuccessDesc') });
    setCreateModalOpen(false);
    setFormData(initialFormData);
  };

  const handleDeleteAssociation = () => {
    toast({ title: t('associations.deleteSuccess'), description: t('associations.deleteSuccessDesc') });
    setDeleteModalOpen(false);
    setSelectedAssociation(null);
  };

  const getAdminNames = (adminIds: string[]) => {
    return adminIds.map(id => mockAdmins.find(a => a.id === id)?.name || id).join(", ");
  };

  const getCommunityNames = (communityIds: string[]) => {
    return communityIds.map(id => mockCommunities.find(c => c.id === id)?.name || id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('associations.title')}</h1>
            <p className="text-muted-foreground">{t('associations.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedAssociations.length === 0}>
                  {t('associations.bulkActions')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> {t('associations.exportSelected')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> {t('associations.deleteSelected')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => toast({ title: "Export", description: "Exporting associations..." })}>
              <Download className="mr-2 h-4 w-4" /> {t('associations.exportAssociations')}
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('associations.createAssociation')}
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('associations.searchPlaceholder')}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('associations.typeFilter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {typeOptions.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={paidFilter} onValueChange={setPaidFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t('associations.paidFilter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="paid">{t('associations.paid')}</SelectItem>
                    <SelectItem value="free">{t('associations.free')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-[250px]">
                  <MultiSelect
                    options={communityOptions}
                    selected={linkedCommunitiesFilter}
                    onChange={setLinkedCommunitiesFilter}
                    placeholder={t('associations.linkedCommunitiesFilter')}
                  />
                </div>
                <div className="w-[250px]">
                  <MultiSelect
                    options={countryOptions}
                    selected={countriesFilter}
                    onChange={setCountriesFilter}
                    placeholder={t('associations.countriesFilter')}
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('associations.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-az">{t('associations.sortNameAZ')}</SelectItem>
                    <SelectItem value="name-za">{t('associations.sortNameZA')}</SelectItem>
                    <SelectItem value="date-newest">{t('associations.sortDateNewest')}</SelectItem>
                    <SelectItem value="date-oldest">{t('associations.sortDateOldest')}</SelectItem>
                    <SelectItem value="payment-high">{t('associations.sortPaymentHigh')}</SelectItem>
                    <SelectItem value="payment-low">{t('associations.sortPaymentLow')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <TableHead className="w-16">{t('associations.table.logo')}</TableHead>
                    <TableHead>{t('associations.table.name')}</TableHead>
                    <TableHead>{t('associations.table.type')}</TableHead>
                    <TableHead>{t('associations.table.countriesServed')}</TableHead>
                    <TableHead>{t('associations.table.linkedCommunities')}</TableHead>
                    <TableHead>{t('associations.table.paidStatus')}</TableHead>
                    <TableHead>{t('associations.table.paymentInfo')}</TableHead>
                    <TableHead>{t('associations.table.members')}</TableHead>
                    <TableHead>{t('associations.table.admins')}</TableHead>
                    <TableHead className="w-28">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssociations.map((assoc) => (
                    <TableRow key={assoc.id} className="border-border/50 cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedAssociation(assoc); setDetailModalOpen(true); }}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedAssociations.includes(assoc.id)}
                          onCheckedChange={(checked) => handleSelectAssociation(assoc.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{assoc.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{assoc.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {assoc.countriesServed.slice(0, 2).map(country => (
                            <Badge key={country} variant="secondary" className="text-xs">{country}</Badge>
                          ))}
                          {assoc.countriesServed.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{assoc.countriesServed.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assoc.linkedCommunities.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={assoc.isPaid ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>
                          {assoc.isPaid ? t('associations.paid') : t('associations.free')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assoc.isPaid ? (
                          <span className="text-sm">{assoc.paymentAmount} {assoc.paymentCurrency} / {assoc.paymentType}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{assoc.membersCount}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{getAdminNames(assoc.assignedAdmins).substring(0, 20)}...</span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setSelectedAssociation(assoc); setDetailModalOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedAssociation(assoc); setDetailModalOpen(true); }}>
                                <Eye className="mr-2 h-4 w-4" /> {t('associations.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/associations/${assoc.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedAssociation(assoc); setAssignAdminsModalOpen(true); }}>
                                <Users className="mr-2 h-4 w-4" /> {t('associations.manageAdmins')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedAssociation(assoc); setLinkCommunitiesModalOpen(true); }}>
                                <Link2 className="mr-2 h-4 w-4" /> {t('associations.linkUnlinkCommunities')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedAssociation(assoc); setDeleteModalOpen(true); }}>
                                <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
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
              <p className="text-sm text-muted-foreground">
                {t('associations.showing')} 1-{filteredAssociations.length} {t('associations.of')} {filteredAssociations.length}
              </p>
              <div className="flex items-center gap-2">
                <Select defaultValue="20">
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

      {/* Create Association Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('associations.createAssociation')}</DialogTitle>
            <DialogDescription>{t('associations.createDesc')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('associations.form.basicInfo')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t('associations.form.name')} <span className="text-destructive">*</span></Label>
                    <Input 
                      placeholder={t('associations.form.namePlaceholder')}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t('associations.form.description')}</Label>
                    <Textarea 
                      placeholder={t('associations.form.descriptionPlaceholder')}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('associations.form.type')} <span className="text-destructive">*</span></Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                      <SelectTrigger><SelectValue placeholder={t('associations.form.selectType')} /></SelectTrigger>
                      <SelectContent>
                        {typeOptions.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('associations.form.countriesServed')} <span className="text-destructive">*</span></Label>
                    <MultiSelect
                      options={countryOptions}
                      selected={formData.countriesServed}
                      onChange={(val) => setFormData(prev => ({ ...prev, countriesServed: val }))}
                      placeholder={t('associations.form.selectCountries')}
                    />
                  </div>
                </div>
              </div>

              {/* Logo / Banner */}
              <div className="space-y-2">
                <Label>{t('associations.form.logoBanner')}</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('associations.form.uploadImage')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('associations.form.acceptedFormats')}</p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('associations.form.settings')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('associations.form.joinPolicy')} <span className="text-destructive">*</span></Label>
                    <Select value={formData.joinPolicy} onValueChange={(val) => setFormData(prev => ({ ...prev, joinPolicy: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">{t('associations.form.joinOpen')}</SelectItem>
                        <SelectItem value="Approval Required">{t('associations.form.joinApproval')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('associations.form.whoCanPost')} <span className="text-destructive">*</span></Label>
                    <Select value={formData.whoCanPost} onValueChange={(val) => setFormData(prev => ({ ...prev, whoCanPost: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admins Only">{t('associations.form.adminsOnly')}</SelectItem>
                        <SelectItem value="All Members">{t('associations.form.allMembers')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('associations.form.contactInfo')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t('associations.form.address')}</Label>
                    <Input 
                      placeholder={t('associations.form.addressPlaceholder')}
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('associations.form.contactEmail')}</Label>
                    <Input 
                      type="email"
                      placeholder={t('associations.form.contactEmailPlaceholder')}
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('associations.form.contactPhone')}</Label>
                    <Input 
                      placeholder={t('associations.form.contactPhonePlaceholder')}
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t('associations.form.website')}</Label>
                    <Input 
                      placeholder={t('associations.form.websitePlaceholder')}
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Payment / Monetization */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('associations.form.paymentInfo')}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('associations.form.isPaid')}</Label>
                    <p className="text-sm text-muted-foreground">{t('associations.form.isPaidDesc')}</p>
                  </div>
                  <Switch 
                    checked={formData.isPaid}
                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, isPaid: val }))}
                  />
                </div>
                {formData.isPaid && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>{t('associations.form.paymentType')} <span className="text-destructive">*</span></Label>
                      <Select value={formData.paymentType} onValueChange={(val) => setFormData(prev => ({ ...prev, paymentType: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">{t('associations.form.monthly')}</SelectItem>
                          <SelectItem value="Yearly">{t('associations.form.yearly')}</SelectItem>
                          <SelectItem value="One-time">{t('associations.form.onetime')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('associations.form.paymentAmount')} <span className="text-destructive">*</span></Label>
                      <Input 
                        type="number"
                        placeholder="0.00"
                        value={formData.paymentAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('associations.form.paymentCurrency')} <span className="text-destructive">*</span></Label>
                      <Select value={formData.paymentCurrency} onValueChange={(val) => setFormData(prev => ({ ...prev, paymentCurrency: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Assigned Admins */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('associations.form.assignedAdmins')}</h3>
                <div className="space-y-2">
                  <Label>{t('associations.form.selectAdmins')} <span className="text-destructive">*</span></Label>
                  <MultiSelect
                    options={mockAdmins.map(a => ({ label: `${a.name} (${a.email})`, value: a.id }))}
                    selected={formData.assignedAdmins}
                    onChange={(val) => setFormData(prev => ({ ...prev, assignedAdmins: val }))}
                    placeholder={t('associations.form.selectAdminsPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); setFormData(initialFormData); }}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateAssociation}>{t('associations.createAssociation')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Association Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('associations.associationDetails')}</DialogTitle>
          </DialogHeader>
          {selectedAssociation && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">{t('associations.detail.basicInfo')}</TabsTrigger>
                <TabsTrigger value="communities">{t('associations.detail.linkedCommunities')}</TabsTrigger>
                <TabsTrigger value="admins">{t('associations.detail.admins')}</TabsTrigger>
                <TabsTrigger value="payment">{t('associations.detail.payment')}</TabsTrigger>
                <TabsTrigger value="metrics">{t('associations.detail.metrics')}</TabsTrigger>
              </TabsList>
              <ScrollArea className="max-h-[50vh] mt-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">{t('associations.form.name')}</Label>
                      <p className="font-medium">{selectedAssociation.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('associations.form.type')}</Label>
                      <p className="font-medium">{selectedAssociation.type}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-muted-foreground">{t('associations.form.description')}</Label>
                      <p>{selectedAssociation.description || "-"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-muted-foreground">{t('associations.form.countriesServed')}</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedAssociation.countriesServed.map(c => (
                          <Badge key={c} variant="secondary">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('associations.form.joinPolicy')}</Label>
                      <p>{selectedAssociation.joinPolicy}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('associations.form.whoCanPost')}</Label>
                      <p>{selectedAssociation.whoCanPost}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-muted-foreground">{t('associations.form.address')}</Label>
                      <p>{selectedAssociation.address || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('associations.form.contactEmail')}</Label>
                      <p>{selectedAssociation.contactEmail || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('associations.form.contactPhone')}</Label>
                      <p>{selectedAssociation.contactPhone || "-"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-muted-foreground">{t('associations.form.website')}</Label>
                      <p>{selectedAssociation.website || "-"}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="communities" className="space-y-4">
                  {selectedAssociation.linkedCommunities.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('associations.detail.communityName')}</TableHead>
                          <TableHead>{t('associations.detail.communityType')}</TableHead>
                          <TableHead>{t('associations.detail.countriesServed')}</TableHead>
                          <TableHead>{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCommunityNames(selectedAssociation.linkedCommunities).map((name, idx) => {
                          const community = mockCommunities.find(c => c.name === name);
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{name}</TableCell>
                              <TableCell>{community?.type || "-"}</TableCell>
                              <TableCell>{community?.countriesServed.join(", ") || "-"}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm">{t('common.view')}</Button>
                                  <Button variant="ghost" size="sm" className="text-destructive">{t('associations.unlink')}</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">{t('associations.noLinkedCommunities')}</p>
                  )}
                </TabsContent>
                <TabsContent value="admins" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('associations.detail.adminName')}</TableHead>
                        <TableHead>{t('associations.detail.adminEmail')}</TableHead>
                        <TableHead>{t('associations.detail.adminRole')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAssociation.assignedAdmins.map((adminId) => {
                        const admin = mockAdmins.find(a => a.id === adminId);
                        return (
                          <TableRow key={adminId}>
                            <TableCell className="font-medium">{admin?.name || adminId}</TableCell>
                            <TableCell>{admin?.email || "-"}</TableCell>
                            <TableCell>{admin?.role || "-"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">{t('common.edit')}</Button>
                                <Button variant="ghost" size="sm" className="text-destructive">{t('common.remove')}</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="payment" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">{t('associations.form.isPaid')}</Label>
                      <Badge className={selectedAssociation.isPaid ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>
                        {selectedAssociation.isPaid ? t('associations.paid') : t('associations.free')}
                      </Badge>
                    </div>
                    {selectedAssociation.isPaid && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">{t('associations.form.paymentType')}</Label>
                          <p className="font-medium">{selectedAssociation.paymentType}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">{t('associations.form.paymentAmount')}</Label>
                          <p className="font-medium">{selectedAssociation.paymentAmount} {selectedAssociation.paymentCurrency}</p>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t('associations.detail.members')}</p>
                        <p className="text-2xl font-bold">{selectedAssociation.membersCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t('associations.detail.posts')}</p>
                        <p className="text-2xl font-bold">{selectedAssociation.postsCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t('associations.detail.opportunities')}</p>
                        <p className="text-2xl font-bold">{selectedAssociation.opportunitiesCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t('associations.detail.vendorProducts')}</p>
                        <p className="text-2xl font-bold">{selectedAssociation.vendorProductsCount}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>{t('common.close')}</Button>
            <Button onClick={() => { setDetailModalOpen(false); navigate(`/associations/${selectedAssociation?.id}/edit`); }}>
              {t('associations.editAssociation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('associations.deleteAssociation')}</DialogTitle>
            <DialogDescription>{t('associations.deleteConfirm', { name: selectedAssociation?.name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteAssociation}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Admins Modal */}
      <Dialog open={assignAdminsModalOpen} onOpenChange={setAssignAdminsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('associations.manageAdmins')}</DialogTitle>
            <DialogDescription>{t('associations.manageAdminsDesc', { name: selectedAssociation?.name })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MultiSelect
              options={mockAdmins.map(a => ({ label: `${a.name} (${a.email})`, value: a.id }))}
              selected={selectedAssociation?.assignedAdmins || []}
              onChange={() => {}}
              placeholder={t('associations.form.selectAdminsPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignAdminsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => { 
              toast({ title: t('associations.adminAssignedSuccess') }); 
              setAssignAdminsModalOpen(false); 
            }}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link/Unlink Communities Modal */}
      <Dialog open={linkCommunitiesModalOpen} onOpenChange={setLinkCommunitiesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('associations.linkUnlinkCommunities')}</DialogTitle>
            <DialogDescription>{t('associations.linkCommunitiesDesc', { name: selectedAssociation?.name })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MultiSelect
              options={communityOptions}
              selected={selectedAssociation?.linkedCommunities || []}
              onChange={() => {}}
              placeholder={t('associations.selectCommunities')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkCommunitiesModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => { 
              toast({ title: t('associations.communityLinkSuccess') }); 
              setLinkCommunitiesModalOpen(false); 
            }}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
