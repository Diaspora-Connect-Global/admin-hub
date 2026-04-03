import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useT } from "@/hooks/useT";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpportunitiesTable } from "@/components/opportunities/OpportunitiesTable";
import { OpportunitiesCardView } from "@/components/opportunities/OpportunitiesCardView";
import { CreateEditOpportunityModal } from "@/components/opportunities/CreateEditOpportunityModal";
import { OpportunityModal } from "@/components/opportunities/OpportunityModal";
import { ApplicantsDrawer } from "@/components/opportunities/ApplicantsDrawer";
import { ApplicationModal } from "@/components/opportunities/ApplicationModal";
import { DeleteOpportunityModal } from "@/components/opportunities/DeleteOpportunityModal";
import { MessageApplicantModal } from "@/components/opportunities/MessageApplicantModal";
import { RejectApplicantModal } from "@/components/opportunities/RejectApplicantModal";
import { OpportunityBulkActionsBar } from "@/components/opportunities/OpportunityBulkActionsBar";
import { Plus, RefreshCw, LayoutList, LayoutGrid, Search } from "lucide-react";
import {
  Opportunity,
  Applicant,
  OpportunityType as OpportunityTypeEnum,
  Visibility,
  ApplicationMethod,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
  type Application,
  OpportunityStatus,
  type OpportunityStatusFilter,
  ApplicationStatus,
} from "@/types/opportunities";
import type {
  ListOpportunitiesResponse,
  GetApplicationsResponse,
} from "@/hooks/opportunity";
import { toast } from "@/hooks/use-toast";
import {
  useListOpportunities,
  useGetApplications,
  useCreateOpportunity,
  useUpdateOpportunity,
  usePublishOpportunity,
  useDraftOpportunity,
  useCloseOpportunity,
  useDeleteOpportunity,
  useAcceptApplication,
  useRejectApplication,
  useReviewApplication,
} from "@/hooks/opportunity";
import { useSetOpportunityPriority } from "@/hooks/opportunity/superAdmin";
import { LIST_OPPORTUNITIES } from "@/services/networks/graphql/opportunity";

export default function Opportunities() {
  const location = useLocation();
  const t = useT("opportunities");
  const { isSystemAdmin, adminProfile } = useAdminAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OpportunityStatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

  // Modals (declare before useGetApplications so applicantsOpportunity is defined)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editOpportunity, setEditOpportunity] = useState<Opportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOpportunity, setDrawerOpportunity] = useState<Opportunity | null>(null);
  const [applicantsDrawerOpen, setApplicantsDrawerOpen] = useState(false);
  const [applicantsOpportunity, setApplicantsOpportunity] = useState<Opportunity | null>(null);

  const listInput = {
    limit: 50,
    offset: 0,
    // Match backend-verified behavior: send only limit, offset, status (no sort)
    status: statusFilter,
  };
  const { data: listData, loading: listLoading, error: listError, refetch: refetchList } = useListOpportunities(listInput);

  // Debug logging
  if (listError) {
    console.error("❌ ListOpportunities error:", listError);
  }
  if (listData) {
    const typedData = listData as ListOpportunitiesResponse | undefined;
    console.log("✅ ListOpportunities query succeeded", {
      query: listInput,
      response: {
        total: typedData?.listOpportunities?.total ?? 0,
        count: typedData?.listOpportunities?.opportunities?.length ?? 0,
        opportunities: typedData?.listOpportunities?.opportunities?.map((o) => ({
          id: o.id,
          title: o.title,
          status: o.status,
          type: o.type,
          category: o.category,
          createdAt: o.createdAt,
        })) ?? [],
      },
    });
  }

  const listDataTyped = listData as ListOpportunitiesResponse | undefined;
  const listTotal = listDataTyped?.listOpportunities?.total ?? 0;
  const rawOpportunities = Array.isArray(listDataTyped?.listOpportunities?.opportunities)
    ? listDataTyped.listOpportunities.opportunities
    : [];
  const opportunities: Opportunity[] = rawOpportunities.map((o) => ({
    ...o,
    // Normalize enum fields
    status: ((o.status as string | undefined) ?? OpportunityStatus.DRAFT).toUpperCase() as OpportunityStatus,
    visibility: ((o.visibility as string | undefined) ?? Visibility.PUBLIC).toUpperCase() as Visibility,
    // Provide default for applicationMethod if null from backend
    applicationMethod: (o.applicationMethod ?? ApplicationMethod.IN_PLATFORM_FORM) as ApplicationMethod,
    // UI-derived fields
    applicantsCount: o.applicationCount ?? 0,
    shortDescription: typeof o.description === "string" ? o.description.slice(0, 120) : "",
  }));

  const { data: applicationsData, refetch: refetchApplications } = useGetApplications(
    applicantsOpportunity?.id ? { opportunityId: applicantsOpportunity.id, limit: 100 } : null
  );

  const applicationsDataTyped = applicationsData as GetApplicationsResponse | undefined;
  const rawApplications = Array.isArray(applicationsDataTyped?.getApplications?.applications)
    ? applicationsDataTyped.getApplications.applications
    : [];

  const applicants: Applicant[] = rawApplications.map((a) => ({
    id: a.id,
    createdAt: a.createdAt,
    opportunityId: a.opportunityId,
    applicantId: a.applicantId,
    status: ((a.status as string | undefined) ?? ApplicationStatus.PENDING).toUpperCase() as ApplicationStatus,
    appliedAt: a.createdAt,
    name: (a as Application & { fullName?: string }).fullName ?? a.applicantId ?? "Unknown applicant",
    email: (a as Application & { email?: string }).email ?? "",
    phone: (a as Application & { phoneNumber?: string }).phoneNumber,
    location: (a as Application & { location?: string }).location,
    cvUrl: a.resumeFileRef?.path,
    responses: (() => {
      const answers = (a as { customAnswers?: string | Record<string, string> | null }).customAnswers;
      if (!answers) return undefined;
      if (typeof answers === "string") {
        try {
          return JSON.parse(answers) as Record<string, string>;
        } catch {
          return { Answers: answers };
        }
      }
      return answers;
    })(),
    notes: a.reviewNotes
      ? [
          {
            id: `review-${a.id}`,
            authorName: "Admin",
            createdAt: a.createdAt ?? "",
            content: a.reviewNotes ?? "",
            isPrivate: false,
          },
        ]
      : [],
  }));
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteOpportunity, setDeleteOpportunity] = useState<Opportunity | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const [createOpportunityMutation] = useCreateOpportunity();
  const [updateOpportunityMutation] = useUpdateOpportunity();
  const [publishOpportunityMutation] = usePublishOpportunity();
  const [draftOpportunityMutation] = useDraftOpportunity();
  const [closeOpportunityMutation] = useCloseOpportunity();
  const [deleteOpportunityMutation] = useDeleteOpportunity();
  const [setPriorityMutation] = useSetOpportunityPriority();
  const [reviewApplicationMutation] = useReviewApplication();
  const [acceptApplicationMutation] = useAcceptApplication();
  const [rejectApplicationMutation] = useRejectApplication();

  const allowedLifecycleRoles = new Set([
    "SYSTEM_ADMIN",
    "SUPER_ADMIN",
    "COMMUNITY_ADMIN",
    "ASSOCIATION_ADMIN",
  ]);
  const allowedReviewRoles = new Set([
    "SYSTEM_ADMIN",
    "SUPER_ADMIN",
    "COMMUNITY_ADMIN",
    "ASSOCIATION_ADMIN",
    "MODERATOR",
  ]);
  const allowedPriorityRoles = allowedReviewRoles;
  const currentRoleName = adminProfile?.role?.name?.toUpperCase() ?? "";
  const canManageOpportunityLifecycle = isSystemAdmin || allowedLifecycleRoles.has(currentRoleName);
  const canReviewApplications = isSystemAdmin || allowedReviewRoles.has(currentRoleName);
  const canSetPriority = isSystemAdmin || allowedPriorityRoles.has(currentRoleName);
  const isOpportunityReadAdmin = canManageOpportunityLifecycle || canReviewApplications;
  const canUsePriorityActions = canSetPriority || window.location.hostname === "localhost";
  const adminRoleName = adminProfile?.role?.name ?? "UNKNOWN_ROLE";
  const adminScopeType = adminProfile?.scopeType ?? "UNKNOWN_SCOPE";

  const ensureLifecycleAdmin = (actionLabel: string) => {
    if (canManageOpportunityLifecycle) return true;

    toast({
      title: "Permission denied",
      description: `${actionLabel} requires SYSTEM_ADMIN, COMMUNITY_ADMIN, or ASSOCIATION_ADMIN. Current role: ${adminRoleName} (${adminScopeType}).`,
      variant: "destructive",
    });
    return false;
  };

  const ensureReviewAdmin = (actionLabel: string) => {
    if (canReviewApplications) return true;

    toast({
      title: "Permission denied",
      description: `${actionLabel} requires an admin review role. Current role: ${adminRoleName} (${adminScopeType}).`,
      variant: "destructive",
    });
    return false;
  };

  const ensurePriorityAdmin = (actionLabel: string) => {
    if (canSetPriority) return true;

    toast({
      title: "Permission denied",
      description: `${actionLabel} requires an admin role with priority access. Current role: ${adminRoleName} (${adminScopeType}).`,
      variant: "destructive",
    });
    return false;
  };

  const handleSaveOpportunity = async (
    data: CreateOpportunityInput | UpdateOpportunityInput,
    action: "draft" | "publish"
  ) => {
    if (!ensureLifecycleAdmin(editOpportunity?.id ? "Updating opportunities" : "Creating opportunities")) {
      return;
    }

    if (editOpportunity?.id) {
      try {
        if (editOpportunity.status !== OpportunityStatus.DRAFT) {
          await draftOpportunityMutation({ variables: { id: editOpportunity.id } });
        }

        await updateOpportunityMutation({
          variables: { id: editOpportunity.id, input: data as UpdateOpportunityInput },
        });

        if (action === "publish") {
          await publishOpportunityMutation({ variables: { id: editOpportunity.id } });
        }

        toast({
          title: "Opportunity updated",
          description: action === "publish" ? "Opportunity updated and published." : "Opportunity moved to draft and updated.",
        });
        setCreateModalOpen(false);
        setEditOpportunity(null);
        refetchList();
      } catch (e) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      }
      return;
    }

    try {
      const result = await createOpportunityMutation({ variables: { input: data as CreateOpportunityInput } });
      const createdId = (result.data as { createOpportunity?: string } | undefined)?.createOpportunity;
      if (!createdId) {
        throw new Error("Create succeeded but no opportunity ID was returned.");
      }
      if (action === "publish" && createdId) {
        await publishOpportunityMutation({ variables: { id: createdId } });
      }
      toast({
        title: "Opportunity created",
        description: action === "draft" ? "Saved as draft." : "Opportunity is now live.",
      });
      setCreateModalOpen(false);
      setEditOpportunity(null);
      refetchList();
    } catch (e) {
      const error = e as { graphQLErrors?: Array<{ message: string; extensions?: { code?: string } }> };
      const graphQLError = error.graphQLErrors?.[0];
      if (graphQLError?.extensions?.code === "FORBIDDEN" || graphQLError?.message?.toLowerCase().includes("forbidden")) {
        toast({
          title: "Permission Denied",
          description: "You need SYSTEM_ADMIN role to create opportunities.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: graphQLError?.message || (e as Error).message || "Failed to create opportunity",
          variant: "destructive",
        });
      }
    }
  };

  // Admin Action Handlers
  const handlePublishOpportunity = async (opportunityId: string) => {
    if (!ensureLifecycleAdmin("Publishing opportunities")) return;
    try {
      await publishOpportunityMutation({ variables: { id: opportunityId } });
      toast({ title: "Success", description: "Opportunity published successfully." });
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleCloseOpportunity = async (opportunityId: string, reason?: string) => {
    if (!ensureLifecycleAdmin("Closing opportunities")) return;
    try {
      await closeOpportunityMutation({ variables: { id: opportunityId, reason } });
      toast({ title: "Success", description: "Opportunity closed successfully." });
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!ensureLifecycleAdmin("Deleting opportunities")) return;
    try {
      await deleteOpportunityMutation({ variables: { id: opportunityId } });
      toast({ title: "Success", description: "Opportunity deleted successfully." });
      setDeleteModalOpen(false);
      setDeleteOpportunity(null);
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleSetPriority = async (opportunityId: string, priority: "HIGH" | "NORMAL" | "LOW") => {
    if (!ensurePriorityAdmin("Setting opportunity priority")) return;
    try {
      await setPriorityMutation({ variables: { opportunityId, priority } });
      toast({ title: "Success", description: `Priority set to ${priority.toLowerCase()}.` });
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleReviewApplication = async (applicationId: string, notes?: string) => {
    if (!ensureReviewAdmin("Reviewing applications")) return;
    try {
      await reviewApplicationMutation({ variables: { applicationId, notes } });
      toast({ title: "Success", description: "Application marked for review." });
      refetchApplications();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleAcceptApplication = async (applicationId: string, notes?: string) => {
    if (!ensureReviewAdmin("Accepting applications")) return;
    try {
      await acceptApplicationMutation({ variables: { id: applicationId, notes } });
      toast({ title: "Success", description: "Application accepted." });
      refetchApplications();
      setApplicationModalOpen(false);
      setSelectedApplicant(null);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleRejectApplication = async (applicationId: string, reason?: string) => {
    if (!ensureReviewAdmin("Rejecting applications")) return;
    try {
      await rejectApplicationMutation({ variables: { id: applicationId, reason } });
      toast({ title: "Success", description: "Application rejected." });
      refetchApplications();
      setRejectModalOpen(false);
      setSelectedApplicant(null);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (searchQuery && !opp.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "ALL" && opp.status !== statusFilter) return false;
    if (typeFilter !== "all" && opp.type !== typeFilter.toUpperCase()) return false;
    return true;
  });

  const handleBulkPublish = async () => {
    if (!ensureLifecycleAdmin("Bulk publishing opportunities")) return;
    try {
      await Promise.all(selectedOpportunities.map((id) => publishOpportunityMutation({ variables: { id } })));
      toast({ title: "Success", description: `${selectedOpportunities.length} opportunities published.` });
      setSelectedOpportunities([]);
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleBulkClose = async () => {
    if (!ensureLifecycleAdmin("Bulk closing opportunities")) return;
    try {
      await Promise.all(
        selectedOpportunities.map((id) => closeOpportunityMutation({ variables: { id, reason: "Closed by system admin" } }))
      );
      toast({ title: "Success", description: `${selectedOpportunities.length} opportunities closed.` });
      setSelectedOpportunities([]);
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleBulkExport = () => {
    const selected = filteredOpportunities.filter((opp) => selectedOpportunities.includes(opp.id));
    const csvRows = [
      ["id", "title", "status", "priorityLevel", "type", "category", "applicationCount", "createdAt"].join(","),
      ...selected.map((opp) =>
        [opp.id, opp.title, opp.status, opp.priorityLevel, opp.type, opp.category, String(opp.applicantsCount ?? 0), opp.createdAt]
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "opportunities-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectOpportunity = (id: string) => {
    setSelectedOpportunities((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedOpportunities(selectedOpportunities.length === filteredOpportunities.length ? [] : filteredOpportunities.map((o) => o.id));
  };

  const handleOpenDrawer = (opp: Opportunity) => { setDrawerOpportunity(opp); setDrawerOpen(true); };
  const handleViewApplicants = (opp: Opportunity) => {
    if (!ensureReviewAdmin("Viewing applicants")) return;
    setApplicantsOpportunity(opp);
    setApplicantsDrawerOpen(true);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.opportunitiesTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.opportunitiesSubtitle}</p>
        {!isOpportunityReadAdmin && (
          <p className="mt-2 text-sm text-amber-600">
            Read-only access. Privileged opportunity actions require an admin role. Current role: {adminRoleName} ({adminScopeType}).
          </p>
        )}
      </div>
      {/* Top Controls Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search and Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.searchOpportunities}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OpportunityStatusFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.allStatus}</SelectItem>
              <SelectItem value="PUBLISHED">{t.published}</SelectItem>
              {canUsePriorityActions && <SelectItem value="DRAFT">{t.draft}</SelectItem>}
              <SelectItem value="CLOSED">{t.closed}</SelectItem>
              {canUsePriorityActions && <SelectItem value="ARCHIVED">{t.archived}</SelectItem>}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t.typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTypes}</SelectItem>
              <SelectItem value="EMPLOYMENT">{t.employment || "Employment"}</SelectItem>
              <SelectItem value="CONTRACT">{t.contract || "Contract"}</SelectItem>
              <SelectItem value="VOLUNTEER">{t.volunteer || "Volunteer"}</SelectItem>
              <SelectItem value="SCHOLARSHIP">{t.scholarship || "Scholarship"}</SelectItem>
              <SelectItem value="FELLOWSHIP">{t.fellowship || "Fellowship"}</SelectItem>
              <SelectItem value="GRANT">{t.grant || "Grant"}</SelectItem>
              <SelectItem value="PROGRAM">{t.program || "Program"}</SelectItem>
              <SelectItem value="INVESTMENT">{t.investment || "Investment"}</SelectItem>
              <SelectItem value="INITIATIVE">{t.initiative || "Initiative"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right: View Toggle and Actions */}
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "card")}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="px-3">
                <LayoutList className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="card" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetchList()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="gap-2"
            disabled={!canManageOpportunityLifecycle}
            onClick={() => {
              if (!ensureLifecycleAdmin("Creating opportunities")) return;
              setCreateModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t.newOpportunity}</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.totalOpportunities}</p>
          <p className="text-2xl font-semibold text-foreground">{opportunities.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.open}</p>
          <p className="text-2xl font-semibold text-foreground">{opportunities.filter((o) => o.status === OpportunityStatus.PUBLISHED).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.totalApplicants}</p>
          <p className="text-2xl font-semibold text-foreground">{opportunities.reduce((sum, o) => sum + (o.applicantsCount ?? 0), 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.shortlisted}</p>
          <p className="text-2xl font-semibold text-foreground">{opportunities.reduce((sum, o) => sum + (o.shortlistCount ?? 0), 0)}</p>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4">
        <p className="text-sm text-foreground/80">
          {listLoading
            ? "Loading…"
            : t.showingXOfYOpportunities
                .replace("{filtered}", filteredOpportunities.length.toString())
                .replace("{total}", listTotal.toString())}
        </p>
        {listError && (
          <p className="text-sm text-red-600 mt-2">
            ⚠️ Error loading opportunities: {listError.message}
          </p>
        )}
        {!listLoading && listTotal === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            ℹ️ No opportunities found. {!isOpportunityReadAdmin ? "Log in with an admin role to access opportunity moderation." : "Create your first opportunity!"}
          </p>
        )}
      </div>

      {/* Opportunities View */}
      {listLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading opportunities…</div>
      ) : viewMode === "list" ? (
        <OpportunitiesTable
          opportunities={filteredOpportunities}
          selectedOpportunities={selectedOpportunities}
          onSelectOpportunity={handleSelectOpportunity}
          onSelectAll={handleSelectAll}
          onOpenDrawer={handleOpenDrawer}
          onEdit={(opp) => { setEditOpportunity(opp); setCreateModalOpen(true); }}
          onTogglePublish={(opp) => opp.status === "DRAFT" ? handlePublishOpportunity(opp.id) : handleCloseOpportunity(opp.id)}
          onClose={(opp) => handleCloseOpportunity(opp.id, "Closed by admin")}
          onViewApplicants={handleViewApplicants}
          onDelete={(opp) => { setDeleteOpportunity(opp); setDeleteModalOpen(true); }}
          onSetPriority={canUsePriorityActions ? (opp, priority) => handleSetPriority(opp.id, priority) : undefined}
        />
      ) : viewMode === "card" ? (
        <OpportunitiesCardView
          opportunities={filteredOpportunities}
          onOpenDrawer={handleOpenDrawer}
          onEdit={(opp) => { setEditOpportunity(opp); setCreateModalOpen(true); }}
          onTogglePublish={(opp) => opp.status === "DRAFT" ? handlePublishOpportunity(opp.id) : handleCloseOpportunity(opp.id)}
          onViewApplicants={handleViewApplicants}
          onDelete={(opp) => { setDeleteOpportunity(opp); setDeleteModalOpen(true); }}
          onSetPriority={canUsePriorityActions ? (opp, priority) => handleSetPriority(opp.id, priority) : undefined}
        />
      ) : null}

      {/* Modals */}
      <CreateEditOpportunityModal
        open={createModalOpen}
        onOpenChange={(open) => { setCreateModalOpen(open); if (!open) setEditOpportunity(null); }}
        opportunity={editOpportunity}
        onSave={handleSaveOpportunity}
      />
      <OpportunityModal
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        opportunity={drawerOpportunity}
        onEdit={() => { setEditOpportunity(drawerOpportunity); setCreateModalOpen(true); setDrawerOpen(false); }}
        onTogglePublish={() => drawerOpportunity && (drawerOpportunity.status === "DRAFT" ? handlePublishOpportunity(drawerOpportunity.id) : handleCloseOpportunity(drawerOpportunity.id))}
        onClose={() => drawerOpportunity && handleCloseOpportunity(drawerOpportunity.id, "Closed by admin")}
        onViewApplicants={() => { setApplicantsOpportunity(drawerOpportunity); setApplicantsDrawerOpen(true); }}
        onSetPriority={canUsePriorityActions ? (priority) => drawerOpportunity && handleSetPriority(drawerOpportunity.id, priority) : undefined}
      />
      <ApplicantsDrawer
        open={applicantsDrawerOpen}
        onOpenChange={setApplicantsDrawerOpen}
        opportunity={applicantsOpportunity}
        applicants={applicants}
        onViewApplication={(a) => { setSelectedApplicant(a); setApplicationModalOpen(true); }}
        onReview={(a) => a.id && handleReviewApplication(a.id, "Moved to reviewing")}
        onMessage={(a) => { setSelectedApplicant(a); setMessageModalOpen(true); }}
        onReject={(a) => { setSelectedApplicant(a); setRejectModalOpen(true); }}
        onAccept={(a) => a.id && handleAcceptApplication(a.id, "Accepted")}
        onExport={() => toast({ title: "Exporting..." })}
      />
      <ApplicationModal
        open={applicationModalOpen}
        onOpenChange={setApplicationModalOpen}
        applicant={selectedApplicant}
        onReview={() => selectedApplicant?.id && handleReviewApplication(selectedApplicant.id, "Moved to reviewing")}
        onMessage={() => { setMessageModalOpen(true); }}
        onReject={() => { setRejectModalOpen(true); }}
        onAccept={() => selectedApplicant?.id && handleAcceptApplication(selectedApplicant.id, "Accepted")}
      />
      <DeleteOpportunityModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        opportunity={deleteOpportunity}
        onConfirm={() => deleteOpportunity?.id && handleDeleteOpportunity(deleteOpportunity.id)}
      />
      <MessageApplicantModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        applicant={selectedApplicant}
        onSend={(msg) => toast({ title: "Message sent" })}
      />
      <RejectApplicantModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        applicant={selectedApplicant}
        onConfirm={(reason) => selectedApplicant?.id && handleRejectApplication(selectedApplicant.id, reason)}
      />
      <OpportunityBulkActionsBar
        selectedCount={selectedOpportunities.length}
        onClearSelection={() => setSelectedOpportunities([])}
        onBulkPublish={handleBulkPublish}
        onBulkClose={handleBulkClose}
        onBulkExport={handleBulkExport}
      />
    </AdminLayout>
  );
}
