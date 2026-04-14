import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "@/hooks/use-toast";
import {
  useDiscoverAssociations,
  useGetAuditLogs,
  useGetCommunity,
  useGetUsers,
  useListCommunityMembers,
  useUpdateCommunity,
  useUpdateCommunityJoinPolicy,
  useUpdateCommunityVisibility,
  useAssignCommunityAdmin,
} from "@/hooks/admin";
import { useListAdmins, useAssignAdminRole } from "@/hooks/admin/useAdminAccounts";
import { useLinkAssociation } from "@/hooks/admin/useAssociation";
import {
  countriesServedLabelsToIso2,
  groupCreationUiToApi,
  singleCountryLabelToIso2,
} from "@/lib/countriesServedIso";
import { useGetEventsByOwner } from "@/hooks/events";
import { useListOpportunities } from "@/hooks/opportunity";
import { OwnerType } from "@/types/opportunities";
import {
  ArrowLeft, Edit, Link2, UserPlus, Pause, Eye, Check, X, Trash2,
  MoreHorizontal, Download, Store, Unlink, Globe, Calendar, Users,
  FileText, Briefcase, History, Shield, Building2, Loader2, Upload,
} from "lucide-react";

const postsData = [
  { id: "PST-001", author: "John Doe", contentPreview: "Community Event Announcement...", media: "1 image", likes: 45, comments: 12, createdAt: "2024-01-20", status: "Pending" },
  { id: "PST-002", author: "Jane Smith", contentPreview: "New Member Introduction...", media: "-", likes: 32, comments: 8, createdAt: "2024-01-19", status: "Approved" },
];

const vendorItems = [
  { id: "ITM-001", title: "African Art Print", category: "Art", price: "$45", stock: 25, status: "Approved" },
  { id: "ITM-002", title: "Kente Cloth", category: "Fashion", price: "$120", stock: 10, status: "Pending" },
];

const typeOptions = ["Embassy", "NGO", "Church", "Association", "Club", "Other"];

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
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const countryOptions = allCountries.map((country) => ({ label: country, value: country }));

function joinPolicyToApi(joinUi: "FREE" | "PAID"): string {
  return joinUi === "FREE" ? "OPEN" : "PAID";
}

function joinPolicyFromCommunity(joinPolicy: string | undefined): "FREE" | "PAID" {
  return joinPolicy === "PAID" ? "PAID" : "FREE";
}

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
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error, refetch } = useGetCommunity(id ?? null);
  const [updateCommunityMutation, { loading: savingEdit }] = useUpdateCommunity();
  const [updateVisibilityMutation] = useUpdateCommunityVisibility();
  const [updateJoinPolicyMutation] = useUpdateCommunityJoinPolicy();
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
  const auditLogs = ((auditData as any)?.getAuditLogs?.items ?? []).map((log: any) => {
    const resource =
      log.resourceType && log.resourceId
        ? `${log.resourceType}: ${log.resourceId}`
        : log.resourceType || log.resourceId || "";
    const ip = log.ipAddress ? `IP ${log.ipAddress}` : "";
    const notes = [resource, ip].filter(Boolean).join(" · ") || "—";
    return {
      timestamp: log.createdAt,
      action: log.action,
      performedBy: log.actorId || "System",
      notes,
    };
  });

  const [vendorEnabled, setVendorEnabled] = useState(false);
  const [postingEnabled, setPostingEnabled] = useState(true);
  const [linkAssociationOpen, setLinkAssociationOpen] = useState(false);
  const [selectedAssociationId, setSelectedAssociationId] = useState<string>("");

  const { data: associationsData, loading: associationsLoading } = useDiscoverAssociations({
    limit: 1000,
    offset: 0,
  });
  const associationOptions =
    (
      associationsData as
        | { discoverAssociations?: { associations?: Array<{ id: string; name: string }> } }
        | undefined
    )?.discoverAssociations?.associations ?? [];

  const [linkAssociationMutation, { loading: linkingAssociation }] = useLinkAssociation();
  const [assignAdminOpen, setAssignAdminOpen] = useState(false);
  const [assignAdminTab, setAssignAdminTab] = useState<"existing" | "create">("existing");
  const [selectedExistingAdminId, setSelectedExistingAdminId] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState("");
  const [assignAdminSubmitting, setAssignAdminSubmitting] = useState(false);
  const { data: listAdminsData, loading: listAdminsLoading } = useListAdmins(200, 0);
  const [assignAdminRoleMutation] = useAssignAdminRole();
  const [assignCommunityAdminMutation] = useAssignCommunityAdmin();

  const adminAccounts = listAdminsData?.listAdmins?.admins ?? [];
  const eligibleExistingAdmins = id
    ? adminAccounts.filter(
        (a) =>
          a.status === "ACTIVE" &&
          !a.roles.some(
            (r) =>
              r.roleType === "COMMUNITY_ADMIN" &&
              r.scopeType === "COMMUNITY" &&
              r.scopeId === id,
          ),
      )
    : [];

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    communityType: "",
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
    joinPolicy: "FREE" as "FREE" | "PAID",
    paymentType: "NONE" as "NONE" | "ONE_TIME" | "SUBSCRIPTION",
    priceAmount: "",
    priceCurrency: "EUR",
    countriesServed: [] as string[],
    logoBanner: null as File | null,
    rules: "",
    whoCanPost: "ADMIN_ONLY" as "ADMIN_ONLY" | "ALL_MEMBERS",
    groupCreationPermission: "Admins Only",
    postModeration: true,
    address: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    embassyCountry: "",
    locationCountry: "",
  });

  useEffect(() => {
    if (!community) return;
    setEditForm({
      name: community.name ?? "",
      description: community.description ?? "",
      communityType: community.communityTypeId ?? community.communityType?.name ?? "",
      visibility: community.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      joinPolicy: joinPolicyFromCommunity(community.joinPolicy),
      paymentType:
        community.paymentType === "ONE_TIME" || community.paymentType === "SUBSCRIPTION"
          ? community.paymentType
          : "NONE",
      priceAmount: community.priceAmount != null ? String(community.priceAmount) : "",
      priceCurrency: community.priceCurrency ?? "EUR",
      countriesServed: [...(community.countriesServed ?? [])],
      logoBanner: null,
      rules: community.communityRules ?? "",
      whoCanPost: community.whoCanPost === "ALL_MEMBERS" ? "ALL_MEMBERS" : "ADMIN_ONLY",
      groupCreationPermission: community.groupCreationPermission ?? "Admins Only",
      postModeration: true,
      address: community.address ?? "",
      contactEmail: community.contactEmail ?? "",
      contactPhone: community.contactPhone ?? "",
      website: community.website ?? "",
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

  const handleEditLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setEditForm((prev) => ({ ...prev, logoBanner: file }));
  };

  const handleLinkAssociationSubmit = async () => {
    if (!community?.id || !selectedAssociationId) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.selectAssociations"),
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await linkAssociationMutation({
        variables: {
          input: {
            associationId: selectedAssociationId,
            communityId: community.id,
          },
        },
      });
      const payload = result.data?.linkAssociation;
      if (payload?.success) {
        toast({
          title: t("communities.associationLinked"),
          description: t("communities.associationLinkedDesc"),
        });
        setLinkAssociationOpen(false);
        setSelectedAssociationId("");
        await refetch();
      } else {
        toast({
          title: t("communities.validationError"),
          description: payload?.message ?? "Link failed.",
          variant: "destructive",
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Link failed.";
      toast({
        title: t("communities.validationError"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const resetAssignAdminForm = () => {
    setAssignAdminTab("existing");
    setSelectedExistingAdminId("");
    setNewAdminEmail("");
    setNewAdminPassword("");
    setNewAdminConfirmPassword("");
  };

  const handleAssignAdminDialogChange = (open: boolean) => {
    setAssignAdminOpen(open);
    if (!open) resetAssignAdminForm();
  };

  const handleAssignExistingCommunityAdmin = async () => {
    if (!id || !selectedExistingAdminId) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.assignAdmin.selectAdmin"),
        variant: "destructive",
      });
      return;
    }
    setAssignAdminSubmitting(true);
    try {
      const result = await assignAdminRoleMutation({
        variables: {
          input: {
            adminId: selectedExistingAdminId,
            roleType: "COMMUNITY_ADMIN",
            scopeType: "COMMUNITY",
            scopeId: id,
          },
        },
      });
      if (result.data?.assignAdminRole?.success) {
        toast({
          title: t("communities.assignAdmin.successTitle"),
          description: t("communities.assignAdmin.successExisting"),
        });
        handleAssignAdminDialogChange(false);
        await refetch();
      } else {
        toast({
          title: t("communities.validationError"),
          description: result.data?.assignAdminRole?.message ?? t("communities.assignAdmin.requestFailed"),
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: t("communities.validationError"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setAssignAdminSubmitting(false);
    }
  };

  const handleCreateCommunityAdmin = async () => {
    if (!id) return;
    const email = newAdminEmail.trim();
    if (!email) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.invalidEmail"),
        variant: "destructive",
      });
      return;
    }
    if (!newAdminPassword.trim()) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.assignAdmin.passwordRequired"),
        variant: "destructive",
      });
      return;
    }
    if (newAdminPassword.length < 8) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.assignAdmin.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }
    if (newAdminPassword !== newAdminConfirmPassword) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.assignAdmin.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }
    setAssignAdminSubmitting(true);
    try {
      const result = await assignCommunityAdminMutation({
        variables: {
          input: {
            entityId: id,
            email,
            password: newAdminPassword,
          },
        },
      });
      const payload = result.data?.assignCommunityAdmin;
      if (payload?.success) {
        toast({
          title: t("communities.assignAdmin.successTitle"),
          description: payload.message?.trim() || t("communities.assignAdmin.successCreate"),
        });
        handleAssignAdminDialogChange(false);
        await refetch();
      } else {
        toast({
          title: t("communities.validationError"),
          description: payload?.message ?? t("communities.assignAdmin.requestFailed"),
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: t("communities.validationError"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setAssignAdminSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!community) return;
    if (!editForm.name.trim()) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.fillRequired"),
        variant: "destructive",
      });
      return;
    }
    if (!editForm.communityType.trim()) {
      toast({
        title: t("communities.validationError"),
        description: t("communities.form.selectType"),
        variant: "destructive",
      });
      return;
    }
    const needsPrice = editForm.joinPolicy === "PAID" || editForm.paymentType !== "NONE";
    if (needsPrice && (!editForm.priceAmount.trim() || !editForm.priceCurrency.trim())) {
      toast({
        title: t("communities.validationError"),
        description: "Price amount and currency required when join is paid or payment type is set.",
        variant: "destructive",
      });
      return;
    }
    if (editForm.communityType === "Embassy") {
      if (!editForm.embassyCountry.trim() || !editForm.locationCountry.trim()) {
        toast({
          title: t("communities.validationError"),
          description: t("communities.embassyFieldsRequired"),
          variant: "destructive",
        });
        return;
      }
    }

    let priceAmountNum: number | undefined;
    if (needsPrice && editForm.priceAmount.trim()) {
      const amount = Number(editForm.priceAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        toast({
          title: t("communities.validationError"),
          description: "Invalid price amount.",
          variant: "destructive",
        });
        return;
      }
      priceAmountNum = amount;
    }

    const countriesServed = countriesServedLabelsToIso2(editForm.countriesServed);
    const desiredJoinApi = joinPolicyToApi(editForm.joinPolicy);

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
            groupCreationPermission: groupCreationUiToApi(editForm.groupCreationPermission),
            communityRules: editForm.rules.trim(),
            embassyCountry: singleCountryLabelToIso2(editForm.embassyCountry),
            locationCountry: singleCountryLabelToIso2(editForm.locationCountry),
            communityTypeId: editForm.communityType.trim(),
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

      if (editForm.visibility !== community.visibility) {
        await updateVisibilityMutation({
          variables: {
            input: { communityId: community.id, visibility: editForm.visibility },
          },
        });
      }

      const joinPolicyInput: {
        communityId: string;
        joinPolicy: string;
        priceAmount?: number;
        priceCurrency?: string;
      } = {
        communityId: community.id,
        joinPolicy: desiredJoinApi,
      };
      if (desiredJoinApi === "PAID" && priceAmountNum != null) {
        joinPolicyInput.priceAmount = priceAmountNum;
        joinPolicyInput.priceCurrency = editForm.priceCurrency.trim() || "EUR";
      }
      await updateJoinPolicyMutation({
        variables: { input: joinPolicyInput },
      });

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
                <CardTitle className="text-base">Events</CardTitle>
                <CardDescription>Community events and meetups.</CardDescription>
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
                <CardTitle className="text-base">Opportunities</CardTitle>
                <CardDescription>Opportunities posted in this community.</CardDescription>
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
                <CardTitle className="text-base">Vendor Products & Services</CardTitle>
                <CardDescription>Manage community's vendor listings.</CardDescription>
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

      {/* Edit Community (same fields as create, without admin assignment) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t("communities.editCommunity")}</DialogTitle>
            <DialogDescription>{t("communities.editCommunityFormDesc", { name: community.name })}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">{t("communities.form.basicInfo")}</h3>

                <div className="space-y-2">
                  <Label>{t("communities.communityName")} <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder={t("communities.form.namePlaceholder")}
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("common.description")}</Label>
                  <Textarea
                    placeholder={t("communities.form.descriptionPlaceholder")}
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.communityType")} <span className="text-destructive">*</span></Label>
                  <Select value={editForm.communityType} onValueChange={(value) => setEditForm((prev) => ({ ...prev, communityType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("communities.form.selectType")} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {typeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visibility <span className="text-destructive">*</span></Label>
                    <Select
                      value={editForm.visibility}
                      onValueChange={(v: "PUBLIC" | "PRIVATE") => setEditForm((prev) => ({ ...prev, visibility: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Join policy <span className="text-destructive">*</span></Label>
                    <Select
                      value={editForm.joinPolicy}
                      onValueChange={(v: "FREE" | "PAID") => setEditForm((prev) => ({ ...prev, joinPolicy: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment type <span className="text-destructive">*</span></Label>
                  <Select
                    value={editForm.paymentType}
                    onValueChange={(v: "NONE" | "ONE_TIME" | "SUBSCRIPTION") =>
                      setEditForm((prev) => ({ ...prev, paymentType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(editForm.joinPolicy === "PAID" || editForm.paymentType !== "NONE") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price amount</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0.00"
                        value={editForm.priceAmount}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, priceAmount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={editForm.priceCurrency} onValueChange={(v) => setEditForm((prev) => ({ ...prev, priceCurrency: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
                  <Label>{t("communities.countriesServed")}</Label>
                  <MultiSelect
                    options={countryOptions}
                    selected={editForm.countriesServed}
                    onChange={(selected) => setEditForm((prev) => ({ ...prev, countriesServed: selected }))}
                    placeholder={t("communities.form.selectCountries")}
                    searchPlaceholder={t("common.search")}
                    maxDisplay={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.form.logoBanner")}</Label>
                  <div className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-primary/50 transition-colors">
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={handleEditLogoUpload} className="hidden" id="edit-logo-upload" />
                    <label htmlFor="edit-logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("communities.form.uploadImage")}</span>
                      <span className="text-xs text-muted-foreground">{t("communities.form.acceptedFormats")}</span>
                    </label>
                    {editForm.logoBanner && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <Badge variant="secondary">{editForm.logoBanner.name}</Badge>
                        <X
                          className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive"
                          onClick={() => setEditForm((prev) => ({ ...prev, logoBanner: null }))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.form.rulesGuidelines")}</Label>
                  <Textarea
                    placeholder={t("communities.form.rulesPlaceholder")}
                    value={editForm.rules}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, rules: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.form.whoCanPost")}</Label>
                  <Select
                    value={editForm.whoCanPost}
                    onValueChange={(value: "ADMIN_ONLY" | "ALL_MEMBERS") =>
                      setEditForm((prev) => ({ ...prev, whoCanPost: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="ADMIN_ONLY">{t("communities.form.adminsOnly")}</SelectItem>
                      <SelectItem value="ALL_MEMBERS">All members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("communities.form.groupCreation")} <span className="text-destructive">*</span></Label>
                    <Select
                      value={editForm.groupCreationPermission}
                      onValueChange={(value) => setEditForm((prev) => ({ ...prev, groupCreationPermission: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Admins Only">{t("communities.form.adminsOnly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div>
                      <Label>{t("communities.form.postModeration")}</Label>
                      <p className="text-xs text-muted-foreground">{t("communities.form.postModerationDesc")}</p>
                    </div>
                    <Switch
                      checked={editForm.postModeration}
                      onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, postModeration: checked }))}
                    />
                  </div>
                </div>
              </div>

              {editForm.communityType && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">{t("communities.form.contactInfo")}</h3>

                  <div className="space-y-2">
                    <Label>{t("communities.form.address")}</Label>
                    <Input
                      placeholder={t("communities.form.addressPlaceholder")}
                      value={editForm.address}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("communities.form.contactEmail")}</Label>
                      <Input
                        type="email"
                        placeholder={t("communities.form.contactEmailPlaceholder")}
                        value={editForm.contactEmail}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("communities.form.contactPhone")}</Label>
                      <Input
                        placeholder={t("communities.form.contactPhonePlaceholder")}
                        value={editForm.contactPhone}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("communities.form.website")}</Label>
                    <Input
                      placeholder={t("communities.form.websitePlaceholder")}
                      value={editForm.website}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {editForm.communityType === "Embassy" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    {t("communities.form.embassyInfo")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("communities.form.embassyCountry")} <span className="text-destructive">*</span></Label>
                      <Select
                        value={editForm.embassyCountry}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, embassyCountry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("communities.form.embassyCountryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-64">
                          {allCountries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("communities.form.locationCountry")} <span className="text-destructive">*</span></Label>
                      <Select
                        value={editForm.locationCountry}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, locationCountry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("communities.form.locationCountryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-64">
                          {allCountries.map((country) => (
                            <SelectItem key={`loc-${country}`} value={country}>
                              {country}
                            </SelectItem>
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
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("common.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Association Modal */}
      <Dialog
        open={linkAssociationOpen}
        onOpenChange={(open) => {
          setLinkAssociationOpen(open);
          if (!open) setSelectedAssociationId("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("communities.linkAssociationTo")}</DialogTitle>
            <DialogDescription>{t("communities.linkAssociationDesc", { name: community.name })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                {t("communities.selectAssociations")} <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedAssociationId} onValueChange={setSelectedAssociationId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("communities.searchAssociations")} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-64">
                  {associationsLoading ? (
                    <SelectItem value="__loading" disabled>
                      {t("common.loading")}
                    </SelectItem>
                  ) : associationOptions.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      {t("common.noData")}
                    </SelectItem>
                  ) : (
                    associationOptions.map((assoc) => (
                      <SelectItem key={assoc.id} value={assoc.id}>
                        {assoc.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkAssociationOpen(false)}
              disabled={linkingAssociation}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleLinkAssociationSubmit} disabled={linkingAssociation || !selectedAssociationId}>
              {linkingAssociation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("communities.linkAssociation")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Admin Modal */}
      <Dialog open={assignAdminOpen} onOpenChange={handleAssignAdminDialogChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("communities.assignAdmin.title")}</DialogTitle>
            <DialogDescription>{t("communities.assignAdmin.description")}</DialogDescription>
          </DialogHeader>
          <Tabs value={assignAdminTab} onValueChange={(v) => setAssignAdminTab(v as "existing" | "create")} className="py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">{t("communities.assignAdmin.tabExisting")}</TabsTrigger>
              <TabsTrigger value="create">{t("communities.assignAdmin.tabCreate")}</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("communities.assignAdmin.selectAdmin")}</Label>
                <Select
                  value={selectedExistingAdminId || "__none__"}
                  onValueChange={(v) => setSelectedExistingAdminId(v === "__none__" ? "" : v)}
                  disabled={listAdminsLoading || assignAdminSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("communities.assignAdmin.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-64">
                    <SelectItem value="__none__">{t("communities.assignAdmin.selectPlaceholder")}</SelectItem>
                    {listAdminsLoading ? (
                      <SelectItem value="__loading" disabled>
                        {t("communities.assignAdmin.loadingAdmins")}
                      </SelectItem>
                    ) : eligibleExistingAdmins.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        {t("communities.assignAdmin.noEligibleAdmins")}
                      </SelectItem>
                    ) : (
                      eligibleExistingAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="create" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="assign-admin-email">{t("common.email")}</Label>
                <Input
                  id="assign-admin-email"
                  type="email"
                  autoComplete="off"
                  placeholder={t("communities.assignAdmin.emailPlaceholder")}
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  disabled={assignAdminSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-admin-password">{t("communities.assignAdmin.initialPassword")}</Label>
                <Input
                  id="assign-admin-password"
                  type="password"
                  autoComplete="new-password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  disabled={assignAdminSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-admin-confirm">{t("communities.assignAdmin.confirmPassword")}</Label>
                <Input
                  id="assign-admin-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={newAdminConfirmPassword}
                  onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                  disabled={assignAdminSubmitting}
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAssignAdminDialogChange(false)}
              disabled={assignAdminSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={
                assignAdminSubmitting ||
                (assignAdminTab === "existing" &&
                  (!selectedExistingAdminId || listAdminsLoading || eligibleExistingAdmins.length === 0))
              }
              onClick={
                assignAdminTab === "existing"
                  ? handleAssignExistingCommunityAdmin
                  : handleCreateCommunityAdmin
              }
            >
              {assignAdminSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : assignAdminTab === "existing" ? (
                t("communities.assignAdmin.assignRole")
              ) : (
                t("communities.assignAdmin.createAdmin")
              )}
            </Button>
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
