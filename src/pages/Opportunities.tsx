import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useT } from "@/hooks/useT";
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
  OpportunityCategory,
  Visibility,
  ApplicationMethod,
  OwnerType,
  type CreateOpportunityInput,
} from "@/types/opportunities";
import { toast } from "@/hooks/use-toast";
import { getUserId } from "@/stores/session";
import { debugAuthState } from "@/lib/auth-debug";
import {
  useListOpportunities,
  useGetApplications,
  useCreateOpportunity,
  useUpdateOpportunity,
  usePublishOpportunity,
  useCloseOpportunity,
  useDeleteOpportunity,
  useAcceptApplication,
  useRejectApplication,
  useReviewApplication,
} from "@/hooks/opportunity";
import { useSetOpportunityPriority } from "@/hooks/opportunity/superAdmin";

export default function Opportunities() {
  const location = useLocation();
  const t = useT("opportunities");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    searchTerm: searchQuery.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
    type: typeFilter === "all" ? undefined : (typeFilter.toUpperCase() as OpportunityTypeEnum),
    sortBy: "createdAt",
    sortOrder: "DESC",
  };
  const { data: listData, loading: listLoading, refetch: refetchList } = useListOpportunities(listInput);
  const rawOpportunities = Array.isArray(listData?.listOpportunities?.opportunities) ? listData.listOpportunities.opportunities : [];
  const opportunities: Opportunity[] = rawOpportunities.map((o: { applicationCount?: number; [k: string]: unknown }) => ({
    ...o,
    applicantsCount: o.applicationCount ?? 0,
    shortlistCount: 0,
    hireCount: 0,
  })) as Opportunity[];

  const { data: applicationsData } = useGetApplications(
    applicantsOpportunity?.id ? { opportunityId: applicantsOpportunity.id, limit: 100 } : null
  );
  const rawApplications = Array.isArray(applicationsData?.getApplications?.applications) ? applicationsData.getApplications.applications : [];
  const applicants: Applicant[] = rawApplications.map((a: { applicantId?: string; createdAt?: string; [k: string]: unknown }) => ({
    id: (a as { id: string }).id,
    opportunityId: (a as { opportunityId: string }).opportunityId,
    applicantId: a.applicantId,
    status: (a as { status: string }).status?.toLowerCase() ?? "pending",
    appliedAt: a.createdAt,
    name: "",
    email: "",
  })) as Applicant[];
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteOpportunity, setDeleteOpportunity] = useState<Opportunity | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const [createOpportunityMutation] = useCreateOpportunity();
  const [updateOpportunityMutation] = useUpdateOpportunity();
  const [publishOpportunityMutation] = usePublishOpportunity();
  const [closeOpportunityMutation] = useCloseOpportunity();
  const [deleteOpportunityMutation] = useDeleteOpportunity();
  const [setPriorityMutation] = useSetOpportunityPriority();
  const [reviewApplicationMutation] = useReviewApplication();
  const [acceptApplicationMutation] = useAcceptApplication();
  const [rejectApplicationMutation] = useRejectApplication();

  function mapFormTypeToEnums(
    typeStr: string
  ): { type: OpportunityTypeEnum; category: OpportunityCategory } {
    const t = (typeStr || "job").toLowerCase();
    if (t === "volunteer") return { type: OpportunityTypeEnum.VOLUNTEER, category: OpportunityCategory.VOLUNTEERING_SOCIAL_IMPACT };
    if (t === "funding") return { type: OpportunityTypeEnum.GRANT, category: OpportunityCategory.FUNDING_GRANTS };
    if (t === "scholarship") return { type: OpportunityTypeEnum.SCHOLARSHIP, category: OpportunityCategory.FELLOWSHIPS_LEADERSHIP };
    if (t === "training") return { type: OpportunityTypeEnum.PROGRAM, category: OpportunityCategory.EDUCATION_TRAINING };
    return { type: OpportunityTypeEnum.EMPLOYMENT, category: OpportunityCategory.EMPLOYMENT_CAREER };
  }

  const handleSaveOpportunity = async (
    data: Partial<Opportunity>,
    action: "draft" | "publish" | "schedule"
  ) => {
    const { type: typeEnum, category } = mapFormTypeToEnums(data.type as string);
    const visibility =
      data.visibility === "public" ? Visibility.PUBLIC : Visibility.COMMUNITY_ONLY;
    const deadlineStr = data.deadline
      ? (typeof data.deadline === "string" && data.deadline.includes(",")
          ? new Date(data.deadline).toISOString()
          : (data.deadline as string))
      : undefined;

    if (editOpportunity?.id) {
      try {
        await updateOpportunityMutation({
          variables: {
            id: editOpportunity.id,
            input: {
              title: data.title,
              description: data.description ?? "",
              location: data.location ?? undefined,
              deadline: deadlineStr,
            },
          },
        });
        toast({ title: "Opportunity updated", description: "Your changes have been saved." });
        setCreateModalOpen(false);
        setEditOpportunity(null);
        refetchList();
      } catch (e) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      }
      return;
    }

    const ownerId = getUserId();
    if (!ownerId) {
      toast({
        title: "Session error",
        description: "Your user id is not available. Please log out and log in again.",
        variant: "destructive",
      });
      return;
    }

    const input: CreateOpportunityInput = {
      ownerType: OwnerType.USER,
      ownerId,
      type: typeEnum,
      category,
      title: data.title ?? "",
      description: data.description ?? "",
      visibility,
      applicationMethod: ApplicationMethod.IN_PLATFORM_FORM,
      location: data.location ?? undefined,
      deadline: deadlineStr,
    };

    try {
      await createOpportunityMutation({ variables: { input } });
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
      
      if (graphQLError?.extensions?.code === "FORBIDDEN" || graphQLError?.message?.toLowerCase().includes('forbidden')) {
        toast({ 
          title: "Permission Denied", 
          description: "You need SYSTEM_ADMIN role to create opportunities. Please contact your administrator.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: graphQLError?.message || (e as Error).message || "Failed to create opportunity", 
          variant: "destructive" 
        });
      }
    }
  };

  // Admin Action Handlers
  const handlePublishOpportunity = async (opportunityId: string) => {
    try {
      await publishOpportunityMutation({ variables: { id: opportunityId } });
      toast({ title: "Success", description: "Opportunity published successfully." });
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleCloseOpportunity = async (opportunityId: string, reason?: string) => {
    try {
      await closeOpportunityMutation({ variables: { id: opportunityId, reason } });
      toast({ title: "Success", description: "Opportunity closed successfully." });
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
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
    try {
      await setPriorityMutation({ variables: { opportunityId, priority } });
      toast({ title: "Success", description: `Priority set to ${priority.toLowerCase()}.` });
      refetchList();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleReviewApplication = async (applicationId: string, notes?: string) => {
    try {
      await reviewApplicationMutation({ variables: { applicationId, notes } });
      toast({ title: "Success", description: "Application marked for review." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleAcceptApplication = async (applicationId: string, notes?: string) => {
    try {
      await acceptApplicationMutation({ variables: { id: applicationId, notes } });
      toast({ title: "Success", description: "Application accepted." });
      setApplicationModalOpen(false);
      setSelectedApplicant(null);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleRejectApplication = async (applicationId: string, reason?: string) => {
    try {
      await rejectApplicationMutation({ variables: { id: applicationId, reason } });
      toast({ title: "Success", description: "Application rejected." });
      setRejectModalOpen(false);
      setSelectedApplicant(null);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (searchQuery && !opp.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && opp.status !== statusFilter) return false;
    if (typeFilter !== "all" && opp.type !== typeFilter) return false;
    return true;
  });

  const handleSelectOpportunity = (id: string) => {
    setSelectedOpportunities((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedOpportunities(selectedOpportunities.length === filteredOpportunities.length ? [] : filteredOpportunities.map((o) => o.id));
  };

  const handleOpenDrawer = (opp: Opportunity) => { setDrawerOpportunity(opp); setDrawerOpen(true); };
  const handleViewApplicants = (opp: Opportunity) => { setApplicantsOpportunity(opp); setApplicantsDrawerOpen(true); };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.opportunitiesTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.opportunitiesSubtitle}</p>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allStatus}</SelectItem>
              <SelectItem value="PUBLISHED">{t.published}</SelectItem>
              <SelectItem value="DRAFT">{t.draft}</SelectItem>
              <SelectItem value="CLOSED">{t.closed}</SelectItem>
              <SelectItem value="ARCHIVED">{t.archived}</SelectItem>
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
            variant="outline" 
            size="sm" 
            onClick={() => debugAuthState()}
            className="h-9"
          >
            🔍 Debug Auth
          </Button>
          <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
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
          <p className="text-2xl font-semibold text-foreground">{opportunities.filter(o => o.status === "published").length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.totalApplicants}</p>
          <p className="text-2xl font-semibold text-foreground">{opportunities.reduce((sum, o) => sum + o.applicantsCount, 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.shortlisted}</p>
          <p className="text-2xl font-semibold text-foreground">{opportunities.reduce((sum, o) => sum + o.shortlistCount, 0)}</p>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4">
        <p className="text-sm text-foreground/80">
          {listLoading
            ? "Loading…"
            : t.showingXOfYOpportunities
                .replace("{filtered}", filteredOpportunities.length.toString())
                .replace("{total}", opportunities.length.toString())}
        </p>
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
          onSetPriority={(opp, priority) => handleSetPriority(opp.id, priority)}
        />
      ) : viewMode === "card" ? (
        <OpportunitiesCardView
          opportunities={filteredOpportunities}
          onOpenDrawer={handleOpenDrawer}
          onEdit={(opp) => { setEditOpportunity(opp); setCreateModalOpen(true); }}
          onTogglePublish={(opp) => opp.status === "DRAFT" ? handlePublishOpportunity(opp.id) : handleCloseOpportunity(opp.id)}
          onViewApplicants={handleViewApplicants}
          onDelete={(opp) => { setDeleteOpportunity(opp); setDeleteModalOpen(true); }}
          onSetPriority={(opp, priority) => handleSetPriority(opp.id, priority)}
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
        onDuplicate={() => toast({ title: "Duplicate functionality not yet implemented" })}
      />
      <ApplicantsDrawer
        open={applicantsDrawerOpen}
        onOpenChange={setApplicantsDrawerOpen}
        opportunity={applicantsOpportunity}
        applicants={applicants}
        onViewApplication={(a) => { setSelectedApplicant(a); setApplicationModalOpen(true); }}
        onShortlist={(a) => toast({ title: `${a.name} shortlisted` })}
        onMessage={(a) => { setSelectedApplicant(a); setMessageModalOpen(true); }}
        onReject={(a) => { setSelectedApplicant(a); setRejectModalOpen(true); }}
        onMarkHired={(a) => toast({ title: `${a.name} marked as hired` })}
        onExport={() => toast({ title: "Exporting..." })}
      />
      <ApplicationModal
        open={applicationModalOpen}
        onOpenChange={setApplicationModalOpen}
        applicant={selectedApplicant}
        onShortlist={() => selectedApplicant?.id && handleReviewApplication(selectedApplicant.id, "Shortlisted for review")}
        onMessage={() => { setMessageModalOpen(true); }}
        onReject={() => { setRejectModalOpen(true); }}
        onMarkHired={() => selectedApplicant?.id && handleAcceptApplication(selectedApplicant.id, "Hired")}
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
        onBulkPublish={() => toast({ title: `${selectedOpportunities.length} published` })}
        onBulkClose={() => toast({ title: `${selectedOpportunities.length} closed` })}
        onBulkArchive={() => toast({ title: `${selectedOpportunities.length} archived` })}
        onBulkExport={() => toast({ title: "Exporting..." })}
      />
    </AdminLayout>
  );
}
