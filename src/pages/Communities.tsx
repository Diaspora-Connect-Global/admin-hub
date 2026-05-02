import { useState, useEffect } from "react";
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
import { Search, Plus, MoreHorizontal, Eye, Edit, Link2, Pause, ChevronDown, Download, FileJson, BarChart3, Trash2, Upload, Globe, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateCommunity, useDiscoverAssociations, useGetUsers, useListCommunities } from "@/hooks/admin";
import { useListCommunityTypes } from "@/hooks/admin/useEntityTypes";
import type { CreateCommunityInput, Community, CommunityType } from "@/services/networks/graphql/admin";
import {
  countriesServedLabelsToIso2,
  groupCreationUiToApi,
  iso2OrLabelToDisplayName,
  singleCountryLabelToIso2,
} from "@/lib/countriesServedIso";

/** Table row shape for the communities list (mapped from API Community). */
interface CommunityRow {
  id: string;
  name: string;
  type: string;
  countriesServed: string[];
  embassyCountry: string | null;
  locationCountry: string | null;
  associationsCount: number;
  membersCount: number;
  postsCount: number;
  eventsCount: number;
  vendorEnabled: boolean;
  createdAt: string;
}

function mapCommunityToRow(c: Community): CommunityRow {
  return {
    id: c.id,
    name: c.name,
    type: c.communityType?.name ?? c.communityTypeId ?? "—",
    countriesServed: c.countriesServed ?? [],
    embassyCountry: c.embassyCountry ?? null,
    locationCountry: c.locationCountry ?? null,
    associationsCount: 0,
    membersCount: c.memberCount ?? 0,
    postsCount: 0,
    eventsCount: 0,
    vendorEnabled: false,
    createdAt: c.createdAt ?? "",
  };
}

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

interface CommunityAdminDraft {
  email: string;
  password: string;
}

/** API-aligned create community form (Community Service CreateCommunityInput). */
interface CreateFormData {
  communityName: string;
  description: string;
  communityType: string; // -> communityTypeId
  visibility: "PUBLIC" | "PRIVATE";
  joinPolicy: "FREE" | "PAID";
  paymentType: "NONE" | "ONE_TIME" | "SUBSCRIPTION";
  priceAmount: string;
  priceCurrency: string;
  // Legacy form fields (kept for future / not sent to createCommunity)
  countriesServed: string[];
  logoBanner: File | null;
  rules: string;
  whoCanPost: "ADMIN_ONLY" | "ALL_MEMBERS";
  groupCreationPermission: string;
  postModeration: boolean;
  assignedAdminIds: string[];
  communityAdmins: CommunityAdminDraft[];
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  embassyCountry: string;
  locationCountry: string;
}

const initialFormData: CreateFormData = {
  communityName: "",
  description: "",
  communityType: "",
  visibility: "PUBLIC",
  joinPolicy: "FREE",
  paymentType: "NONE",
  priceAmount: "",
  priceCurrency: "EUR",
  countriesServed: [],
  logoBanner: null,
  rules: "",
  whoCanPost: "ADMIN_ONLY",
  groupCreationPermission: "Admins Only",
  postModeration: true,
  assignedAdminIds: [],
  communityAdmins: [],
  address: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  embassyCountry: "",
  locationCountry: "",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function Communities() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [createCommunityMutation, { loading: creating }] = useCreateCommunity();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-az");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, visibilityFilter, typeFilter]);

  const { data: listData, loading: listLoading, error: listError, refetch: refetchCommunities } = useListCommunities({
    limit: pageSize,
    offset: page * pageSize,
    searchTerm: searchTerm || undefined,
    visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
    communityTypeId: typeFilter === "all" ? undefined : typeFilter,
  });

  const apiCommunities = listData?.listCommunities?.communities ?? [];
  const totalCount = listData?.listCommunities?.total ?? 0;
  const rows = apiCommunities.map(mapCommunityToRow);

  const { data: associationsData, loading: associationsLoading } = useDiscoverAssociations({
    limit: 1000,
    offset: 0,
  });
  const associationOptions = (
    associationsData as { discoverAssociations?: { associations?: Array<{ id: string; name: string }> } } | undefined
  )?.discoverAssociations?.associations ?? [];

  const { data: usersData, loading: usersLoading } = useGetUsers({
    limit: 200,
    offset: 0,
  });

  const adminUserOptions = (
    usersData as { getUsers?: { items?: Array<{ id: string; email: string; displayName?: string | null }> } } | undefined
  )?.getUsers?.items ?? [];

  const { data: communityTypesData, loading: communityTypesLoading } = useListCommunityTypes();
  const communityTypes: CommunityType[] = communityTypesData?.listCommunityTypes ?? [];

  const filteredCommunities = rows
    .filter((community) => {
      const matchesCountry = countryFilter === "all" || community.countriesServed.includes(countryFilter);
      return matchesCountry;
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

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [linkAssociationOpen, setLinkAssociationOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityRow | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateFormData>(initialFormData);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPrevious = page > 0;
  const canNext = page < totalPages - 1;

  const handleSelectAll = (checked: boolean) => {
    setSelectedCommunities(checked ? filteredCommunities.map(c => c.id) : []);
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

  const handleCreateCommunity = async () => {
    if (!formData.communityName.trim()) {
      toast({ title: t('communities.validationError'), description: t('communities.fillRequired'), variant: "destructive" });
      return;
    }
    if (!formData.communityType) {
      toast({ title: t('communities.validationError'), description: t('communities.form.selectType'), variant: "destructive" });
      return;
    }
    const needsPrice = formData.joinPolicy === "PAID" || (formData.paymentType !== "NONE");
    if (needsPrice && (!formData.priceAmount.trim() || !formData.priceCurrency.trim())) {
      toast({ title: t('communities.validationError'), description: "Price amount and currency required when join is paid or payment type is set.", variant: "destructive" });
      return;
    }
    for (const admin of formData.communityAdmins) {
      if (!validateEmail(admin.email)) {
        toast({ title: t('communities.validationError'), description: "Please enter a valid email for each new admin.", variant: "destructive" });
        return;
      }
      if (!admin.password || admin.password.length < 8) {
        toast({ title: t('communities.validationError'), description: "Each new admin password must be at least 8 characters.", variant: "destructive" });
        return;
      }
    }

    const selectedType = communityTypes.find(t => t.id === formData.communityType);
    const isEmbassy = selectedType?.isEmbassy ?? false;

    if (isEmbassy) {
      if (!formData.embassyCountry) {
        toast({ title: t('communities.validationError'), description: "Embassy communities must specify the country the embassy represents.", variant: "destructive" });
        return;
      }
      if (!formData.locationCountry) {
        toast({ title: t('communities.validationError'), description: "Embassy communities must specify the country where the embassy is located.", variant: "destructive" });
        return;
      }
    }

    const joinPolicyApi: CreateCommunityInput["joinPolicy"] =
      formData.joinPolicy === "FREE" ? "OPEN" : "PAID";
    const paymentTypeApi: CreateCommunityInput["paymentType"] =
      formData.joinPolicy === "FREE" ? "NONE" : formData.paymentType;

    const input: CreateCommunityInput = {
      name: formData.communityName.trim(),
      description: formData.description.trim() || "",
      visibility: formData.visibility,
      joinPolicy: joinPolicyApi,
      paymentType: paymentTypeApi,
      communityTypeId: formData.communityType,
      assignedAdminIds: formData.assignedAdminIds,
      whoCanPost: formData.whoCanPost,
      groupCreationPermission: groupCreationUiToApi(formData.groupCreationPermission),
      countriesServed: countriesServedLabelsToIso2(formData.countriesServed),
      communityRules: formData.rules.trim() || "",
      contactEmail: formData.contactEmail.trim() || "",
      contactPhone: formData.contactPhone.trim() || "",
      website: formData.website.trim() || "",
      address: formData.address.trim() || "",
      embassyCountry: isEmbassy ? singleCountryLabelToIso2(formData.embassyCountry) : null,
      locationCountry: isEmbassy ? singleCountryLabelToIso2(formData.locationCountry) : null,
    };
    if (formData.communityAdmins.length > 0) {
      input.communityAdmins = formData.communityAdmins;
    }
    if (needsPrice && formData.priceAmount) {
      const amount = Number(formData.priceAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        toast({ title: t('communities.validationError'), description: "Invalid price amount.", variant: "destructive" });
        return;
      }
      input.priceAmount = amount;
      input.priceCurrency = formData.priceCurrency;
    }

    try {
      const result = await createCommunityMutation({ variables: { input } });
      if (result.data?.createCommunity) {
        toast({ title: t('communities.communityCreated'), description: t('communities.communityCreatedDesc', { name: formData.communityName }) });
        setCreateModalOpen(false);
        setFormData(initialFormData);
        refetchCommunities();
      } else if (result.error) {
        toast({ title: t('communities.validationError'), description: result.error.message, variant: "destructive" });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create community";
      toast({ title: t('communities.validationError'), description: message, variant: "destructive" });
    }
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

  const handleAssignedAdminToggle = (adminId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedAdminIds: prev.assignedAdminIds.includes(adminId)
        ? prev.assignedAdminIds.filter(id => id !== adminId)
        : [...prev.assignedAdminIds, adminId]
    }));
  };

  const handleAddCommunityAdminDraft = () => {
    setFormData(prev => ({
      ...prev,
      communityAdmins: [...prev.communityAdmins, { email: "", password: "" }],
    }));
  };

  const handleCommunityAdminDraftChange = (
    index: number,
    field: "email" | "password",
    value: string,
  ) => {
    setFormData(prev => ({
      ...prev,
      communityAdmins: prev.communityAdmins.map((admin, i) => i === index ? { ...admin, [field]: value } : admin),
    }));
  };

  const handleRemoveCommunityAdminDraft = (index: number) => {
    setFormData(prev => ({
      ...prev,
      communityAdmins: prev.communityAdmins.filter((_, i) => i !== index),
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
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('communities.countriesServed')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-64">
                  <SelectItem value="all">{t('communities.allCountries')}</SelectItem>
                  {allCountries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Visibility" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  {communityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
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
                        checked={filteredCommunities.length > 0 && selectedCommunities.length === filteredCommunities.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t('communities.communityName')}</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>{t('communities.countriesServed')}</TableHead>
                    <TableHead>{t('communities.embassyInfo')}</TableHead>
                    <TableHead>{t('communities.associationsLinked')}</TableHead>
                    <TableHead>{t('communities.members')}</TableHead>
                    <TableHead>{t('communities.posts')}</TableHead>
                    <TableHead>{t('communities.events')}</TableHead>
                    <TableHead>{t('communities.vendorEnabled')}</TableHead>
                    <TableHead className="w-28">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        {t('common.loading') || "Loading..."}
                      </TableCell>
                    </TableRow>
                  ) : listError ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-destructive">
                        {listError.message}
                      </TableCell>
                    </TableRow>
                  ) : filteredCommunities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        {t('communities.noCommunities') || "No communities found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                  filteredCommunities.map((community) => (
                    <TableRow key={community.id} className="border-border/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedCommunities.includes(community.id)}
                          onCheckedChange={(checked) => handleSelectCommunity(community.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell>
                        {community.type !== "—" ? (
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{community.type}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {community.countriesServed.map((country) => (
                            <Badge key={country} variant="outline" className="text-xs">
                              {iso2OrLabelToDisplayName(country)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {community.type === "Embassy" && community.embassyCountry && community.locationCountry ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Globe className="h-3 w-3 text-blue-500" />
                            <span>
                              {iso2OrLabelToDisplayName(community.embassyCountry)} →{" "}
                              {iso2OrLabelToDisplayName(community.locationCountry)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums text-muted-foreground">{community.associationsCount}</span>
                      </TableCell>
                      <TableCell>{community.membersCount.toLocaleString()}</TableCell>
                      <TableCell>{community.postsCount}</TableCell>
                      <TableCell>{community.eventsCount}</TableCell>
                      <TableCell>
                        <span className={community.vendorEnabled ? "text-foreground" : "text-muted-foreground"}>
                          {community.vendorEnabled ? t('communities.enabled') : t('communities.disabled')}
                        </span>
                      </TableCell>
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
                              <DropdownMenuItem onClick={() => navigate(`/communities/${community.id}?edit=1`)}>
                                <Edit className="mr-2 h-4 w-4" /> {t('communities.editCommunity')}
                              </DropdownMenuItem>
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
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {t('communities.showing')} {listLoading ? "…" : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalCount)}`} {t('communities.of')} {totalCount} {t('communities.title').toLowerCase()}
              </p>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                  <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" disabled={!canPrevious || listLoading} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
                <Button variant="outline" size="sm" disabled={!canNext || listLoading} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
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
                    <SelectTrigger>
                      <SelectValue placeholder={communityTypesLoading ? "Loading types..." : t('communities.form.selectType')} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {communityTypesLoading ? (
                        <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                      ) : communityTypes.length === 0 ? (
                        <SelectItem value="__empty__" disabled>No types available</SelectItem>
                      ) : (
                        communityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visibility <span className="text-destructive">*</span></Label>
                    <Select value={formData.visibility} onValueChange={(v: "PUBLIC" | "PRIVATE") => setFormData({ ...formData, visibility: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Join policy <span className="text-destructive">*</span></Label>
                    <Select value={formData.joinPolicy} onValueChange={(v: "FREE" | "PAID") => setFormData({ ...formData, joinPolicy: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment type <span className="text-destructive">*</span></Label>
                  <Select value={formData.paymentType} onValueChange={(v: "NONE" | "ONE_TIME" | "SUBSCRIPTION") => setFormData({ ...formData, paymentType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.joinPolicy === "PAID" || formData.paymentType !== "NONE") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price amount</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0.00"
                        value={formData.priceAmount}
                        onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={formData.priceCurrency} onValueChange={(v) => setFormData({ ...formData, priceCurrency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('communities.countriesServed')}</Label>
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

                <div className="space-y-2">
                  <Label>{t('communities.form.whoCanPost')}</Label>
                  <Select value={formData.whoCanPost} onValueChange={(value: "ADMIN_ONLY" | "ALL_MEMBERS") => setFormData({ ...formData, whoCanPost: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="ADMIN_ONLY">{t('communities.form.adminsOnly')}</SelectItem>
                      <SelectItem value="ALL_MEMBERS">All members</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label>{t('communities.form.communityAdmins')} (existing users)</Label>
                  <div className="border border-border rounded-md p-3 max-h-32 overflow-y-auto bg-background">
                    {usersLoading ? (
                      <p className="text-sm text-muted-foreground">Loading users...</p>
                    ) : adminUserOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No users found.</p>
                    ) : (
                      adminUserOptions.map((admin) => (
                        <div key={admin.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`admin-${admin.id}`}
                            checked={formData.assignedAdminIds.includes(admin.id)}
                            onCheckedChange={() => handleAssignedAdminToggle(admin.id)}
                          />
                          <label htmlFor={`admin-${admin.id}`} className="text-sm cursor-pointer flex-1">
                            {admin.displayName || admin.email} <span className="text-muted-foreground">({admin.email})</span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.assignedAdminIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.assignedAdminIds.map((adminId) => {
                        const admin = adminUserOptions.find(a => a.id === adminId);
                        return admin ? (
                          <Badge key={adminId} variant="secondary" className="gap-1">
                            {admin.displayName || admin.email}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => handleAssignedAdminToggle(adminId)} />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Create new community admins (optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCommunityAdminDraft}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add admin
                    </Button>
                  </div>
                  {formData.communityAdmins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No new admin accounts added.</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.communityAdmins.map((admin, index) => (
                        <div key={`community-admin-draft-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                          <Input
                            type="email"
                            placeholder="admin@example.com"
                            value={admin.email}
                            onChange={(e) => handleCommunityAdminDraftChange(index, "email", e.target.value)}
                          />
                          <Input
                            type="password"
                            placeholder="Password (min 8 chars)"
                            value={admin.password}
                            onChange={(e) => handleCommunityAdminDraftChange(index, "password", e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCommunityAdminDraft(index)}
                            aria-label="Remove admin"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
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
              {communityTypes.find(t => t.id === formData.communityType)?.isEmbassy && (
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
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); setFormData(initialFormData); }} disabled={creating}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateCommunity} disabled={creating}>
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.creating') || "Creating..."}</> : t('communities.createCommunity')}
            </Button>
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
                  {associationsLoading ? (
                    <SelectItem value="associations-loading" disabled>{t('common.loading')}</SelectItem>
                  ) : associationOptions.length === 0 ? (
                    <SelectItem value="associations-empty" disabled>{t('common.noData')}</SelectItem>
                  ) : (
                    associationOptions.map((assoc) => (
                      <SelectItem key={assoc.id} value={assoc.id}>{assoc.name}</SelectItem>
                    ))
                  )}
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
