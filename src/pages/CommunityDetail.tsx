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
  useListCommunityAdmins,
  useListCommunityAssociations,
  useUpdateCommunity,
  useUpdateCommunityJoinPolicy,
  useUpdateCommunityVisibility,
  useAssignCommunityAdmin,
  useGetCommunityPostsAdmin,
  useGetCommunityProductsAdmin,
} from "@/hooks/admin";
import { useListAdmins, useAssignAdminRole } from "@/hooks/admin/useAdminAccounts";
import { useListCommunityTypes } from "@/hooks/admin/useEntityTypes";
import type { CommunityType } from "@/services/networks/graphql/admin";
import { useLinkAssociation, useUnlinkAssociation } from "@/hooks/admin/useAssociation";
import type { CommunityAdminListItem } from "@/hooks/admin/useAssociation";
import {
  countriesServedLabelsToIso2,
  countriesServedIsoCodesToDisplayList,
  groupCreationUiToApi,
  iso2OrLabelToDisplayName,
  singleCountryLabelToIso2,
} from "@/lib/countriesServedIso";
import { useGetEventsByOwner } from "@/hooks/events";
import { useListOpportunities } from "@/hooks/opportunity";
import { OwnerType } from "@/types/opportunities";
import {
  ArrowLeft, Edit, Link2, UserPlus, Pause, Eye, Check, X, Trash2,
  MoreHorizontal, Download, Store, Unlink, Globe, Calendar, Users,
  FileText, Briefcase, History, Shield, Building2, Loader2, Upload,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { CommunityOverviewTab } from "@/components/community/CommunityOverviewTab";
import { CommunityMembersTab } from "@/components/community/CommunityMembersTab";
import { CommunityPostsTab } from "@/components/community/CommunityPostsTab";
import { CommunityEventsTab } from "@/components/community/CommunityEventsTab";
import { CommunityOpportunitiesTab } from "@/components/community/CommunityOpportunitiesTab";
import { CommunityVendorTab } from "@/components/community/CommunityVendorTab";
import { CommunityAuditTab } from "@/components/community/CommunityAuditTab";
import { EditCommunityDialog } from "@/components/community/EditCommunityDialog";
import { LinkAssociationDialog, AssignAdminDialog } from "@/components/community/CommunityAdminDialogs";

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

function groupCreationApiToUi(api: string | undefined): string {
  const map: Record<string, string> = {
    ADMIN_ONLY: "Admins Only",
    ALL_MEMBERS: "All Members",
    MODERATORS: "Moderators",
  };
  return map[api ?? ""] ?? api ?? "Admins Only";
}

/** Matches GET_AUDIT_LOGS `items` selection in admin operations. */
interface AuditLogItem {
  resourceType?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  createdAt?: string;
  action?: string;
  actorId?: string | null;
}

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
  const {
    data: communityAdminsData,
    loading: communityAdminsLoading,
    error: communityAdminsError,
    refetch: refetchCommunityAdmins,
  } = useListCommunityAdmins(id ?? null, 20, 0);
  const { data: usersData } = useGetUsers({ limit: 500, offset: 0, skip: false });
  const { data: communityTypesData, loading: communityTypesLoading } = useListCommunityTypes();
  const communityTypes: CommunityType[] = communityTypesData?.listCommunityTypes ?? [];
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

  // Community posts (admin view) — requires backend resolver getCommunityPosts
  const {
    data: communityPostsData,
    loading: communityPostsLoading,
  } = useGetCommunityPostsAdmin(id ?? null, 20, 0);
  const communityPosts = communityPostsData?.getCommunityPosts?.items ?? [];

  // Community vendor products (admin view) — requires backend resolver getCommunityProducts
  const {
    data: communityProductsData,
    loading: communityProductsLoading,
  } = useGetCommunityProductsAdmin(id ?? null, 20, 0);
  const communityProducts = communityProductsData?.getCommunityProducts?.items ?? [];

  const LINKED_ASSOCIATIONS_PAGE_SIZE = 20;
  const [linkedAssociationsOffset, setLinkedAssociationsOffset] = useState(0);
  const {
    data: linkedAssociationsData,
    loading: linkedAssociationsLoading,
    refetch: refetchLinkedAssociations,
  } = useListCommunityAssociations(id ?? null, LINKED_ASSOCIATIONS_PAGE_SIZE, linkedAssociationsOffset);

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

  const linkedAssociationsPayload = linkedAssociationsData?.listCommunityAssociations;
  const linkedAssociations = linkedAssociationsPayload?.associations ?? [];
  const linkedAssociationsTotal = linkedAssociationsPayload?.total ?? 0;

  const listCommunityAdminsPayload = communityAdminsData?.listCommunityAdmins;
  const adminsFromQuery: CommunityAdminListItem[] =
    listCommunityAdminsPayload?.admins ??
    (listCommunityAdminsPayload as { items?: CommunityAdminListItem[] } | undefined)?.items ??
    [];

  const adminsFromAssignedIds: CommunityAdminListItem[] = (community?.assignedAdminIds ?? []).map(
    (userId) => {
      const user = userById.get(userId);
      return {
        id: userId,
        email: user?.email ?? userId,
        status: "Assigned",
        adminType: "Community admin",
        roles: [] as CommunityAdminListItem['roles'],
      };
    },
  );

  const communityAdmins: CommunityAdminListItem[] =
    adminsFromQuery.length > 0 ? adminsFromQuery : adminsFromAssignedIds;
  const usingAssignedAdminFallback =
    adminsFromQuery.length === 0 && adminsFromAssignedIds.length > 0;
  const communityEvents =
    (communityEventsData as { getEventsByOwner?: { events?: Array<{ id: string; title?: string; locationDetails?: { city?: string; venueName?: string; platform?: string } | null; startAt?: string; registrationCount?: number; status?: string }> } } | undefined)
      ?.getEventsByOwner?.events ?? [];
  const communityOpportunities =
    (opportunitiesData as { listOpportunities?: { opportunities?: Array<{ id: string; title?: string; type?: string; applicationCount?: number; status?: string; createdAt?: string }> } } | undefined)
      ?.listOpportunities?.opportunities ?? [];
  const auditLogs = (
    (auditData as { getAuditLogs?: { items?: AuditLogItem[] } } | undefined)?.getAuditLogs?.items ?? []
  ).map((log) => {
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
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string } | null>(null);

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
  const [unlinkAssociationMutation, { loading: unlinkingAssociation }] = useUnlinkAssociation();
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
    setLinkedAssociationsOffset(0);
  }, [id]);

  useEffect(() => {
    if (!community) return;
    setEditForm({
      name: community.name ?? "",
      description: community.description ?? "",
      communityType: community.communityTypeId ?? community.communityType?.id ?? "",
      visibility: community.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      joinPolicy: joinPolicyFromCommunity(community.joinPolicy),
      paymentType:
        community.paymentType === "ONE_TIME" || community.paymentType === "SUBSCRIPTION"
          ? community.paymentType
          : "NONE",
      priceAmount: community.priceAmount != null ? String(community.priceAmount) : "",
      priceCurrency: community.priceCurrency ?? "EUR",
      countriesServed: (community.countriesServed ?? []).map(iso2OrLabelToDisplayName).filter(Boolean),
      logoBanner: null,
      rules: community.communityRules ?? "",
      whoCanPost: community.whoCanPost === "ALL_MEMBERS" ? "ALL_MEMBERS" : "ADMIN_ONLY",
      groupCreationPermission: groupCreationApiToUi(community.groupCreationPermission),
      postModeration: true,
      address: community.address ?? "",
      contactEmail: community.contactEmail ?? "",
      contactPhone: community.contactPhone ?? "",
      website: community.website ?? "",
      embassyCountry: iso2OrLabelToDisplayName(community.embassyCountry) || "",
      locationCountry: iso2OrLabelToDisplayName(community.locationCountry) || "",
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
        await refetchLinkedAssociations();
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

  const handleConfirmUnlinkAssociation = async () => {
    if (!community?.id || !unlinkTarget) return;
    try {
      const result = await unlinkAssociationMutation({
        variables: {
          input: {
            communityId: community.id,
            associationId: unlinkTarget.id,
          },
        },
      });
      const payload = result.data?.unlinkAssociation;
      if (payload?.success) {
        toast({
          title: "Association unlinked",
          description: payload.message?.trim() || "The association was removed from this community.",
        });
        setUnlinkTarget(null);
        await refetch();
        await refetchLinkedAssociations();
      } else {
        toast({
          title: t("communities.validationError"),
          description: payload?.message ?? "Unlink failed.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: t("communities.validationError"),
        description: e instanceof Error ? e.message : "Unlink failed.",
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
        await refetchCommunityAdmins();
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
        await refetchCommunityAdmins();
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
    if (communityTypes.find(t => t.id === editForm.communityType)?.isEmbassy) {
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
    const selectedEditType = communityTypes.find(t => t.id === editForm.communityType);
    const isEditEmbassy = selectedEditType?.isEmbassy ?? false;

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
            embassyCountry: isEditEmbassy ? singleCountryLabelToIso2(editForm.embassyCountry) : null,
            locationCountry: isEditEmbassy ? singleCountryLabelToIso2(editForm.locationCountry) : null,
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
        paymentType?: string;
      } = {
        communityId: community.id,
        joinPolicy: desiredJoinApi,
      };
      if (desiredJoinApi === "PAID") {
        joinPolicyInput.paymentType = (editForm.paymentType === "ONE_TIME" || editForm.paymentType === "SUBSCRIPTION") ? editForm.paymentType : "ONE_TIME";
        if (priceAmountNum != null) {
          joinPolicyInput.priceAmount = priceAmountNum;
          joinPolicyInput.priceCurrency = editForm.priceCurrency.trim() || "EUR";
        }
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
    ? countriesServedIsoCodesToDisplayList(community.countriesServed)
    : (() => {
        const e = iso2OrLabelToDisplayName(community.embassyCountry);
        const l = iso2OrLabelToDisplayName(community.locationCountry);
        if (e && l) return `${e} → ${l}`;
        return e || l || "—";
      })();

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
            <Button variant="ghost" size="icon" aria-label="Back to communities" onClick={() => navigate("/communities")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{community.name}</h1>
                {community.communityType && (
                  <Badge variant="outline" className={community.communityType.isEmbassy ? "border-info text-info" : ""}>
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
          <CommunityOverviewTab
            community={community}
            linkedAssociations={linkedAssociations}
            linkedAssociationsTotal={linkedAssociationsTotal}
            linkedAssociationsLoading={linkedAssociationsLoading}
            linkedAssociationsOffset={linkedAssociationsOffset}
            setLinkedAssociationsOffset={setLinkedAssociationsOffset}
            linkedAssociationsPageSize={LINKED_ASSOCIATIONS_PAGE_SIZE}
            setLinkAssociationOpen={setLinkAssociationOpen}
            setUnlinkTarget={setUnlinkTarget}
            navigate={navigate}
            t={t}
            communityAdmins={communityAdmins}
            communityAdminsLoading={communityAdminsLoading}
            communityAdminsError={communityAdminsError}
            usingAssignedAdminFallback={usingAssignedAdminFallback}
            setAssignAdminOpen={setAssignAdminOpen}
          />

          {/* Members Tab */}
          <CommunityMembersTab
            communityMemberRows={communityMemberRows}
            setInviteMemberOpen={setInviteMemberOpen}
          />

          {/* Posts Tab */}
          <CommunityPostsTab
            communityPosts={communityPosts}
            communityPostsLoading={communityPostsLoading}
            t={t}
          />

          {/* Events Tab */}
          <CommunityEventsTab communityEvents={communityEvents} t={t} />

          {/* Opportunities Tab */}
          <CommunityOpportunitiesTab communityOpportunities={communityOpportunities} t={t} />

          {/* Vendor Tab */}
          <CommunityVendorTab
            communityProducts={communityProducts}
            communityProductsLoading={communityProductsLoading}
          />

          {/* Audit Tab */}
          <CommunityAuditTab auditLogs={auditLogs} />
        </Tabs>
      </div>

      {/* Edit Community (same fields as create, without admin assignment) */}
      <EditCommunityDialog
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        t={t}
        community={community}
        editForm={editForm}
        setEditForm={setEditForm}
        communityTypesLoading={communityTypesLoading}
        communityTypes={communityTypes}
        countryOptions={countryOptions}
        allCountries={allCountries}
        handleEditLogoUpload={handleEditLogoUpload}
        handleSaveEdit={handleSaveEdit}
        savingEdit={savingEdit}
      />

      {/* Link Association Modal */}
      <LinkAssociationDialog
        linkAssociationOpen={linkAssociationOpen}
        setLinkAssociationOpen={setLinkAssociationOpen}
        setSelectedAssociationId={setSelectedAssociationId}
        selectedAssociationId={selectedAssociationId}
        t={t}
        community={community}
        associationsLoading={associationsLoading}
        associationOptions={associationOptions}
        linkingAssociation={linkingAssociation}
        handleLinkAssociationSubmit={handleLinkAssociationSubmit}
      />

      {/* Assign Admin Modal */}
      <AssignAdminDialog
        assignAdminOpen={assignAdminOpen}
        handleAssignAdminDialogChange={handleAssignAdminDialogChange}
        t={t}
        assignAdminTab={assignAdminTab}
        setAssignAdminTab={setAssignAdminTab}
        selectedExistingAdminId={selectedExistingAdminId}
        setSelectedExistingAdminId={setSelectedExistingAdminId}
        listAdminsLoading={listAdminsLoading}
        assignAdminSubmitting={assignAdminSubmitting}
        eligibleExistingAdmins={eligibleExistingAdmins}
        newAdminEmail={newAdminEmail}
        setNewAdminEmail={setNewAdminEmail}
        newAdminPassword={newAdminPassword}
        setNewAdminPassword={setNewAdminPassword}
        newAdminConfirmPassword={newAdminConfirmPassword}
        setNewAdminConfirmPassword={setNewAdminConfirmPassword}
        handleAssignExistingCommunityAdmin={handleAssignExistingCommunityAdmin}
        handleCreateCommunityAdmin={handleCreateCommunityAdmin}
      />

      {/* Unlink association confirmation */}
      <Dialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("communities.unlinkAssociation")}</DialogTitle>
            <DialogDescription>
              {unlinkTarget ? (
                <>
                  Remove <span className="font-medium text-foreground">{unlinkTarget.name}</span> from this
                  community? This does not delete the association.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setUnlinkTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={unlinkingAssociation}
              onClick={() => void handleConfirmUnlinkAssociation()}
            >
              {unlinkingAssociation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unlinking…
                </>
              ) : (
                t("associations.unlink")
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
