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
} from "@/hooks/opportunity";

export default function Opportunities() {
  const location = useLocation();
  const t = useT("opportunities");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
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
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
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
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (searchQuery && !opp.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && opp.status !== statusFilter) return false;
    if (typeFilter !== "all" && opp.type !== typeFilter) return false;
    if (visibilityFilter !== "all" && opp.visibility !== visibilityFilter) return false;
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
              <SelectItem value="published">{t.published}</SelectItem>
              <SelectItem value="draft">{t.draft}</SelectItem>
              <SelectItem value="scheduled">{t.scheduled}</SelectItem>
              <SelectItem value="closed">{t.closed}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t.typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTypes}</SelectItem>
              <SelectItem value="job">{t.job}</SelectItem>
              <SelectItem value="volunteer">{t.volunteer}</SelectItem>
              <SelectItem value="training">{t.training}</SelectItem>
              <SelectItem value="funding">{t.funding}</SelectItem>
              <SelectItem value="scholarship">{t.scholarship}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t.visibilityPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="members">{t.membersOnly}</SelectItem>
              <SelectItem value="public">{t.public}</SelectItem>
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
          onTogglePublish={(opp) => toast({ title: `Opportunity ${opp.status === "published" ? "unpublished" : "published"}` })}
          onClose={(opp) => toast({ title: "Applications closed" })}
          onViewApplicants={handleViewApplicants}
          onDelete={(opp) => { setDeleteOpportunity(opp); setDeleteModalOpen(true); }}
        />
      ) : viewMode === "card" ? (
        <OpportunitiesCardView
          opportunities={filteredOpportunities}
          onOpenDrawer={handleOpenDrawer}
          onEdit={(opp) => { setEditOpportunity(opp); setCreateModalOpen(true); }}
          onTogglePublish={(opp) => toast({ title: `Opportunity ${opp.status === "published" ? "unpublished" : "published"}` })}
          onViewApplicants={handleViewApplicants}
          onDelete={(opp) => { setDeleteOpportunity(opp); setDeleteModalOpen(true); }}
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
        onTogglePublish={() => toast({ title: "Toggled" })}
        onClose={() => toast({ title: "Closed" })}
        onViewApplicants={() => { setApplicantsOpportunity(drawerOpportunity); setApplicantsDrawerOpen(true); }}
        onDuplicate={() => toast({ title: "Duplicated" })}
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
        onShortlist={() => toast({ title: "Shortlisted" })}
        onMessage={() => { setMessageModalOpen(true); }}
        onReject={() => { setRejectModalOpen(true); }}
        onMarkHired={() => toast({ title: "Hired" })}
      />
      <DeleteOpportunityModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        opportunity={deleteOpportunity}
        onConfirm={() => toast({ title: "Deleted" })}
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
        onConfirm={() => toast({ title: "Rejected" })}
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
