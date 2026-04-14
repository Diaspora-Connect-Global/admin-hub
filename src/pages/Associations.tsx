import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Download, ChevronDown, Upload, Building2, Globe, Mail, Phone, LinkIcon,
  Loader2, X,
} from "lucide-react";
import {
  useSearchAssociations,
  useCreateAssociation,
  useUpdateAssociation,
  useLinkAssociation,
  useAssignAssociationAdmin,
  useSearchCommunitiesAdvanced,
  useGetAssociationAvatarUploadUrl,
  useGetAssociationCoverUploadUrl,
} from "@/hooks/admin/useAssociation";
import { uploadAssociationAvatar, uploadAssociationCover } from "@/lib/associationImageUpload";
import type { UpdateAssociationInput } from "@/services/networks/graphql/admin/operations";
import { useListAssociationTypes } from "@/hooks/admin/useEntityTypes";
import { useListAdmins } from "@/hooks/admin/useAdminAccounts";

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

interface CreateFormData {
  name: string;
  description: string;
  associationTypeId: string;
  visibility: string;
  countriesServed: string[];
  logoFile: File | null;
  bannerFile: File | null;
  joinPolicy: string;
  whoCanPost: string;
  isPaid: boolean;
  paymentType: string;
  paymentAmount: string;
  paymentCurrency: string;
  adminEmail: string;
  adminPassword: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

interface AssociationRow {
  id: string;
  associationTypeId: string;
  name: string;
  type: string;
  description: string;
  countriesServed: string[];
  linkedCommunities: string[];
  membersCount: number;
  postsCount: number;
  opportunitiesCount: number;
  vendorProductsCount: number;
  isPaid: boolean;
  paymentType: string | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  assignedAdmins: string[];
  joinPolicy: string;
  visibility: string;
  whoCanPost: string;
  logoUrl: string | null;
  coverUrl: string | null;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  createdAt: string;
  membershipStatus?: string;
}

const initialFormData: CreateFormData = {
  name: "",
  description: "",
  associationTypeId: "",
  visibility: "PUBLIC",
  countriesServed: [],
  logoFile: null,
  bannerFile: null,
  joinPolicy: "OPEN",
  whoCanPost: "Admins Only",
  isPaid: false,
  paymentType: "Monthly",
  paymentAmount: "",
  paymentCurrency: "EUR",
  adminEmail: "",
  adminPassword: "",
  address: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
};

export default function Associations() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const mapUiPaymentTypeToApi = (value: string): "NONE" | "ONE_TIME" | "SUBSCRIPTION" => {
    if (value === "One-time") return "ONE_TIME";
    if (value === "Monthly" || value === "Yearly") return "SUBSCRIPTION";
    return "NONE";
  };

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
  const [assocAdminEmail, setAssocAdminEmail] = useState("");
  const [assocAdminPassword, setAssocAdminPassword] = useState("");
  const [assocAdminConfirmPassword, setAssocAdminConfirmPassword] = useState("");
  const [linkCommunitiesModalOpen, setLinkCommunitiesModalOpen] = useState(false);
  const [selectedLinkCommunityIds, setSelectedLinkCommunityIds] = useState<string[]>([]);
  const [selectedAssociation, setSelectedAssociation] = useState<AssociationRow | null>(null);
  const [editingAssociationId, setEditingAssociationId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateFormData>(initialFormData);

  // Live API data
  const { data: searchData, loading: searchLoading } = useSearchAssociations({ limit: 50 });
  const [createAssociationMutation, { loading: createLoading }] = useCreateAssociation();
  const [updateAssociationMutation, { loading: updateLoading }] = useUpdateAssociation();
  const [getAvatarUploadUrl] = useGetAssociationAvatarUploadUrl();
  const [getCoverUploadUrl] = useGetAssociationCoverUploadUrl();
  const [linkAssociationMutation] = useLinkAssociation();
  const [assignAssociationAdminMutation, { loading: assignAssocAdminLoading }] = useAssignAssociationAdmin();
  const { data: assocTypesData } = useListAssociationTypes();
  const { data: communitiesData } = useSearchCommunitiesAdvanced({ limit: 200, offset: 0 });
  const { data: adminsData } = useListAdmins(200, 0, "ACTIVE", "ASSOCIATION_ADMIN");

  const typeNameById = new Map((assocTypesData?.listAssociationTypes ?? []).map((x) => [x.id, x.name]));
  const communityById = new Map(
    (communitiesData?.searchCommunitiesAdvanced.communities ?? []).map((c) => [c.id, c])
  );
  const adminById = new Map((adminsData?.listAdmins.admins ?? []).map((a) => [a.id, a]));

  const apiAssociations: AssociationRow[] = (searchData?.searchAssociations.associations ?? []).map((a) => ({
    id: a.id,
    associationTypeId: a.associationTypeId ?? "",
    name: a.name,
    type: (a.associationTypeId && typeNameById.get(a.associationTypeId)) || "Association",
    description: a.description ?? "",
    countriesServed: a.countriesServed ?? [],
    linkedCommunities: [],
    membersCount: a.memberCount ?? 0,
    postsCount: 0,
    opportunitiesCount: 0,
    vendorProductsCount: 0,
    isPaid: a.joinPolicy === "PAID",
    paymentType: a.paymentType ?? null,
    paymentAmount: a.priceAmount ?? null,
    paymentCurrency: a.priceCurrency ?? null,
    assignedAdmins: [],
    joinPolicy: a.joinPolicy ?? "OPEN",
    visibility: a.visibility ?? "PUBLIC",
    whoCanPost: a.whoCanPost ?? "All Members",
    logoUrl: a.avatarUrl ?? null,
    coverUrl:
      "coverImageUrl" in a && (a as { coverImageUrl?: string | null }).coverImageUrl != null
        ? (a as { coverImageUrl?: string | null }).coverImageUrl ?? null
        : null,
    address: a.address ?? "",
    contactEmail: a.contactEmail ?? "",
    contactPhone: a.contactPhone ?? "",
    website: a.website ?? "",
    createdAt: a.createdAt ?? new Date().toISOString(),
    membershipStatus: a.membershipStatus ?? undefined,
  }));

  const communityOptions = (communitiesData?.searchCommunitiesAdvanced.communities ?? []).map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const filteredAssociations = apiAssociations
    .filter((assoc) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        assoc.name.toLowerCase().includes(searchLower) ||
        assoc.type.toLowerCase().includes(searchLower) ||
        assoc.countriesServed.some(c => c.toLowerCase().includes(searchLower)) ||
        assoc.linkedCommunities.some(cid => {
          const community = communityById.get(cid);
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
    setSelectedAssociations(checked ? apiAssociations.map(a => a.id) : []);
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

  /** Never throws; toasts on failure. Retries update without `coverKey` if the API rejects it. */
  const persistAssociationImages = async (associationId: string) => {
    try {
      let avatarKey: string | undefined;
      let coverKey: string | undefined;
      if (formData.logoFile) {
        try {
          avatarKey = await uploadAssociationAvatar(associationId, formData.logoFile, (opts) =>
            getAvatarUploadUrl(opts),
          );
        } catch (logoErr) {
          toast({
            title: "Logo upload failed",
            description: logoErr instanceof Error ? logoErr.message : "Could not upload logo.",
            variant: "destructive",
          });
        }
      }
      if (formData.bannerFile) {
        try {
          coverKey = await uploadAssociationCover(associationId, formData.bannerFile, (opts) =>
            getCoverUploadUrl(opts),
          );
        } catch (coverErr) {
          toast({
            title: "Banner upload failed",
            description:
              coverErr instanceof Error ? coverErr.message : "Cover upload failed (API may not support it yet).",
            variant: "destructive",
          });
        }
      }
      if (avatarKey == null && coverKey == null) return;

      const withKeys = (k: { avatarKey?: string; coverKey?: string }): UpdateAssociationInput => ({
        id: associationId,
        ...k,
      });

      try {
        await updateAssociationMutation({
          variables: {
            input: withKeys({
              ...(avatarKey != null ? { avatarKey } : {}),
              ...(coverKey != null ? { coverKey } : {}),
            }),
          },
        });
      } catch (updateErr) {
        if (coverKey != null) {
          try {
            await updateAssociationMutation({
              variables: {
                input: withKeys({
                  ...(avatarKey != null ? { avatarKey } : {}),
                }),
              },
            });
            toast({
              title: "Images partly saved",
              description:
                "Logo was linked if uploaded; banner could not be saved (coverKey may not be supported by the API yet).",
            });
          } catch (retryErr) {
            toast({
              title: "Could not save image metadata",
              description: retryErr instanceof Error ? retryErr.message : "Update failed.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Could not save image metadata",
            description: updateErr instanceof Error ? updateErr.message : "Update failed.",
            variant: "destructive",
          });
        }
      }
    } catch (e) {
      toast({
        title: "Image upload",
        description: e instanceof Error ? e.message : "Something went wrong while uploading images.",
        variant: "destructive",
      });
    }
  };

  const resetAssocAssignAdminForm = () => {
    setAssocAdminEmail("");
    setAssocAdminPassword("");
    setAssocAdminConfirmPassword("");
  };

  const handleAssignAdminsModalChange = (open: boolean) => {
    setAssignAdminsModalOpen(open);
    if (!open) resetAssocAssignAdminForm();
  };

  const handleSubmitAssignAssociationAdmin = async () => {
    if (!selectedAssociation?.id) {
      toast({ title: t("associations.validationError"), description: t("associations.fillRequired"), variant: "destructive" });
      return;
    }
    const email = assocAdminEmail.trim();
    if (!email || !validateEmail(email)) {
      toast({ title: t("associations.validationError"), description: t("associations.invalidEmail"), variant: "destructive" });
      return;
    }
    if (!assocAdminPassword.trim()) {
      toast({
        title: t("associations.validationError"),
        description: t("communities.assignAdmin.passwordRequired"),
        variant: "destructive",
      });
      return;
    }
    if (assocAdminPassword.length < 8) {
      toast({
        title: t("associations.validationError"),
        description: t("communities.assignAdmin.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }
    if (assocAdminPassword !== assocAdminConfirmPassword) {
      toast({
        title: t("associations.validationError"),
        description: t("communities.assignAdmin.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await assignAssociationAdminMutation({
        variables: {
          input: {
            entityId: selectedAssociation.id,
            email,
            password: assocAdminPassword,
          },
        },
      });
      const payload = result.data?.assignAssociationAdmin;
      if (payload?.success) {
        toast({
          title: t("associations.adminAssignedSuccess"),
          description: payload.message?.trim() || t("communities.assignAdmin.successCreate"),
        });
        handleAssignAdminsModalChange(false);
      } else {
        toast({
          title: t("associations.validationError"),
          description: payload?.message ?? t("communities.assignAdmin.requestFailed"),
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: t("associations.validationError"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const handleCreateAssociation = async () => {
    if (!formData.name || !formData.associationTypeId || !formData.visibility) {
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
    if (formData.adminEmail && !formData.adminPassword) {
      toast({
        title: t("associations.validationError"),
        description: "Admin password is required when admin email is provided.",
        variant: "destructive",
      });
      return;
    }
    const paidPolicy = formData.isPaid ? "PAID" : "OPEN";
    const paymentType = formData.isPaid ? mapUiPaymentTypeToApi(formData.paymentType) : "NONE";
    const paymentAmount = formData.isPaid ? Number(formData.paymentAmount) : undefined;
    const paymentCurrency = formData.isPaid ? formData.paymentCurrency : undefined;
    const whoCanPost = formData.whoCanPost === "Admins Only" ? "ADMIN_ONLY" : "ALL_MEMBERS";

    try {
      if (editingAssociationId) {
        await updateAssociationMutation({
          variables: {
            input: {
              id: editingAssociationId,
              name: formData.name,
              description: formData.description || undefined,
              joinPolicy: paidPolicy,
              visibility: formData.visibility as "PUBLIC" | "PRIVATE",
              contactEmail: formData.contactEmail || undefined,
              contactPhone: formData.contactPhone || undefined,
              website: formData.website || undefined,
              address: formData.address || undefined,
              countriesServed: formData.countriesServed.length > 0 ? formData.countriesServed : undefined,
            },
          },
        });
        await persistAssociationImages(editingAssociationId);
        toast({ title: t('associations.editAssociation'), description: "Association updated successfully." });
        setCreateModalOpen(false);
        setEditingAssociationId(null);
        setSelectedAssociation(null);
        setFormData(initialFormData);
        return;
      }
      const createResult = await createAssociationMutation({
        variables: {
          input: {
            name: formData.name,
            description: formData.description || undefined,
            associationTypeId: formData.associationTypeId,
            joinPolicy: paidPolicy,
            visibility: formData.visibility as "PUBLIC" | "PRIVATE",
            paymentType,
            priceAmount: paymentAmount,
            priceCurrency: paymentCurrency,
            whoCanPost,
            countriesServed: formData.countriesServed.length > 0 ? formData.countriesServed : undefined,
            contactEmail: formData.contactEmail || undefined,
            contactPhone: formData.contactPhone || undefined,
            website: formData.website || undefined,
            address: formData.address || undefined,
            adminEmail: formData.adminEmail || undefined,
            adminPassword: formData.adminPassword || undefined,
          },
        },
      });
      const newId = createResult.data?.createAssociation?.id;
      if (newId) {
        await persistAssociationImages(newId);
      }
      toast({ title: t('associations.createSuccess'), description: t('associations.createSuccessDesc') });
      setCreateModalOpen(false);
      setFormData(initialFormData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({
        title: editingAssociationId ? "Error updating association" : "Error creating association",
        description: message,
        variant: "destructive",
      });
    }
  };

  const openCreateAssociationModal = () => {
    setEditingAssociationId(null);
    setSelectedAssociation(null);
    setFormData(initialFormData);
    setCreateModalOpen(true);
  };

  const openEditAssociationModal = (assoc: AssociationRow) => {
    setEditingAssociationId(assoc.id);
    setSelectedAssociation(assoc);
    setFormData({
      ...initialFormData,
      name: assoc.name,
      description: assoc.description,
      associationTypeId: assoc.associationTypeId,
      visibility: assoc.visibility || "PUBLIC",
      countriesServed: [...assoc.countriesServed],
      joinPolicy: ["OPEN", "REQUEST", "INVITE_ONLY"].includes(assoc.joinPolicy) ? assoc.joinPolicy : "OPEN",
      whoCanPost: assoc.whoCanPost || "Admins Only",
      isPaid: assoc.isPaid,
      paymentType: assoc.paymentType ?? "Monthly",
      paymentAmount: assoc.paymentAmount != null ? String(assoc.paymentAmount) : "",
      paymentCurrency: assoc.paymentCurrency ?? "EUR",
      address: assoc.address || "",
      contactEmail: assoc.contactEmail || "",
      contactPhone: assoc.contactPhone || "",
      website: assoc.website || "",
      adminEmail: "",
      adminPassword: "",
      logoFile: null,
      bannerFile: null,
    });
    setCreateModalOpen(true);
  };

  useEffect(() => {
    const state = location.state as { editAssociationId?: string } | null;
    const editAssociationId = state?.editAssociationId;
    if (!editAssociationId || searchLoading) return;

    const target = apiAssociations.find((assoc) => assoc.id === editAssociationId);
    if (target) {
      openEditAssociationModal(target);
    } else {
      toast({
        title: t("associations.validationError"),
        description: "Association not found for editing.",
        variant: "destructive",
      });
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, searchLoading, apiAssociations, navigate, toast, t]);

  const handleDeleteAssociation = () => {
    toast({ title: t('associations.deleteSuccess'), description: t('associations.deleteSuccessDesc') });
    setDeleteModalOpen(false);
    setSelectedAssociation(null);
  };

  const getAdminNames = (adminIds: string[]) => {
    return adminIds.map(id => adminById.get(id)?.email || id).join(", ");
  };

  const getCommunityNames = (communityIds: string[]) => {
    return communityIds.map(id => communityById.get(id)?.name || id);
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
            <Button onClick={openCreateAssociationModal} disabled={createLoading || updateLoading}>
              {createLoading || updateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {t('associations.createAssociation')}
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
                    {(assocTypesData?.listAssociationTypes ?? []).map((type) => (
                      <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
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
                        checked={apiAssociations.length > 0 && selectedAssociations.length === apiAssociations.length}
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
                  {searchLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : filteredAssociations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        {t("common.noData")}
                      </TableCell>
                    </TableRow>
                  ) : filteredAssociations.map((assoc) => (
                    <TableRow
                      key={assoc.id}
                      className="border-border/50 cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/associations/${assoc.id}`)}
                    >
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
                        <span className="text-sm text-muted-foreground">
                          {assoc.assignedAdmins.length > 0 ? getAdminNames(assoc.assignedAdmins) : "-"}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/associations/${assoc.id}`)}
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
                              <DropdownMenuItem onClick={() => navigate(`/associations/${assoc.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> {t('associations.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditAssociationModal(assoc)}>
                                <Edit className="mr-2 h-4 w-4" /> {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedAssociation(assoc); setAssignAdminsModalOpen(true); }}>
                                <Users className="mr-2 h-4 w-4" /> {t('associations.manageAdmins')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAssociation(assoc);
                                  setSelectedLinkCommunityIds(assoc.linkedCommunities);
                                  setLinkCommunitiesModalOpen(true);
                                }}
                              >
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
                {filteredAssociations.length > 0
                  ? `${t("associations.showing")} 1-${filteredAssociations.length} ${t("associations.of")} ${filteredAssociations.length}`
                  : `${t("associations.showing")} 0 ${t("associations.of")} 0`}
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
            <DialogTitle>{editingAssociationId ? t('associations.editAssociation') : t('associations.createAssociation')}</DialogTitle>
            <DialogDescription>{editingAssociationId ? t('associations.associationDetails') : t('associations.createDesc')}</DialogDescription>
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
                    <Select value={formData.associationTypeId} onValueChange={(val) => setFormData(prev => ({ ...prev, associationTypeId: val }))}>
                      <SelectTrigger><SelectValue placeholder={t('associations.form.selectType')} /></SelectTrigger>
                      <SelectContent>
                        {(assocTypesData?.listAssociationTypes ?? []).map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
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
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t('associations.form.logoBanner')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        id="assoc-create-logo"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setFormData((prev) => ({ ...prev, logoFile: f ?? null }));
                          e.target.value = "";
                        }}
                      />
                      <label htmlFor="assoc-create-logo" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('associations.form.uploadImage')}</span>
                        <span className="text-xs text-muted-foreground">{t('associations.form.acceptedFormats')}</span>
                      </label>
                      {formData.logoFile && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <Badge variant="secondary">{formData.logoFile.name}</Badge>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove logo"
                            onClick={() => setFormData((prev) => ({ ...prev, logoFile: null }))}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {editingAssociationId && selectedAssociation?.logoUrl && !formData.logoFile && (
                        <img
                          src={selectedAssociation.logoUrl}
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
                        id="assoc-create-banner"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setFormData((prev) => ({ ...prev, bannerFile: f ?? null }));
                          e.target.value = "";
                        }}
                      />
                      <label htmlFor="assoc-create-banner" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Wide image (hero / header)</span>
                        <span className="text-xs text-muted-foreground">{t('associations.form.acceptedFormats')}</span>
                      </label>
                      {formData.bannerFile && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <Badge variant="secondary">{formData.bannerFile.name}</Badge>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove banner"
                            onClick={() => setFormData((prev) => ({ ...prev, bannerFile: null }))}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {editingAssociationId && selectedAssociation?.coverUrl && !formData.bannerFile && (
                        <img
                          src={selectedAssociation.coverUrl}
                          alt=""
                          className="mt-3 mx-auto h-16 w-full max-w-xs rounded-md object-cover border border-border"
                        />
                      )}
                    </div>
                  </div>
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
                        <SelectItem value="OPEN">{t('associations.form.joinOpen')}</SelectItem>
                        <SelectItem value="REQUEST">{t('associations.form.joinApproval')}</SelectItem>
                        <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visibility <span className="text-destructive">*</span></Label>
                    <Select value={formData.visibility} onValueChange={(val) => setFormData(prev => ({ ...prev, visibility: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
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

              {/* Auto-create Association Admin Account */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Auto-create Association Admin</h3>
                <p className="text-sm text-muted-foreground">Optionally create an admin panel account scoped to this association.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Admin Email</Label>
                    <Input
                      type="email"
                      placeholder="assoc.admin@example.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Password</Label>
                    <Input
                      type="password"
                      placeholder="Secure password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setEditingAssociationId(null);
                setFormData(initialFormData);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateAssociation} disabled={createLoading || updateLoading}>
              {editingAssociationId ? t('common.save') : t('associations.createAssociation')}
            </Button>
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
                          const community = (communitiesData?.searchCommunitiesAdvanced.communities ?? []).find(
                            (c) => c.name === name
                          );
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{name}</TableCell>
                              <TableCell>{community?.communityType?.name || "-"}</TableCell>
                              <TableCell>-</TableCell>
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
                        const admin = adminById.get(adminId);
                        return (
                          <TableRow key={adminId}>
                            <TableCell className="font-medium">{admin?.email || adminId}</TableCell>
                            <TableCell>{admin?.email || "-"}</TableCell>
                            <TableCell>{admin?.adminType || "-"}</TableCell>
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
            <Button
              onClick={() => {
                if (!selectedAssociation) return;
                setDetailModalOpen(false);
                openEditAssociationModal(selectedAssociation);
              }}
            >
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

      {/* Assign Admins Modal — assignAssociationAdmin(entityId, email, password) */}
      <Dialog open={assignAdminsModalOpen} onOpenChange={handleAssignAdminsModalChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('associations.manageAdmins')}</DialogTitle>
            <DialogDescription>{t('associations.manageAdminsDesc', { name: selectedAssociation?.name })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assoc-assign-email">{t('common.email')}</Label>
              <Input
                id="assoc-assign-email"
                type="email"
                autoComplete="off"
                placeholder={t('communities.assignAdmin.emailPlaceholder')}
                value={assocAdminEmail}
                onChange={(e) => setAssocAdminEmail(e.target.value)}
                disabled={assignAssocAdminLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assoc-assign-password">{t('communities.assignAdmin.initialPassword')}</Label>
              <Input
                id="assoc-assign-password"
                type="password"
                autoComplete="new-password"
                value={assocAdminPassword}
                onChange={(e) => setAssocAdminPassword(e.target.value)}
                disabled={assignAssocAdminLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assoc-assign-confirm">{t('communities.assignAdmin.confirmPassword')}</Label>
              <Input
                id="assoc-assign-confirm"
                type="password"
                autoComplete="new-password"
                value={assocAdminConfirmPassword}
                onChange={(e) => setAssocAdminConfirmPassword(e.target.value)}
                disabled={assignAssocAdminLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleAssignAdminsModalChange(false)} disabled={assignAssocAdminLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleSubmitAssignAssociationAdmin} disabled={assignAssocAdminLoading}>
              {assignAssocAdminLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('communities.assignAdmin.createAdmin')
              )}
            </Button>
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
              selected={selectedLinkCommunityIds}
              onChange={setSelectedLinkCommunityIds}
              placeholder={t('associations.selectCommunities')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkCommunitiesModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={async () => { 
              if (selectedAssociation) {
                try {
                  const targetCommunityId = selectedLinkCommunityIds[0];
                  if (!targetCommunityId) {
                    toast({ title: t("associations.validationError"), description: t("associations.selectCommunities"), variant: "destructive" });
                    return;
                  }
                  await linkAssociationMutation({
                    variables: { input: { associationId: selectedAssociation.id, communityId: targetCommunityId } },
                  });
                  toast({ title: t('associations.communityLinkSuccess') });
                } catch {
                  toast({ title: "Error linking community", variant: "destructive" });
                }
              }
              setLinkCommunitiesModalOpen(false); 
            }}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
