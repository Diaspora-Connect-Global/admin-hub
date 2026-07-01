import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  Search,
  Eye,
  UserCheck,
  Edit,
  Send,
  Upload,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  useAllCases,
  useSupportCase,
  useCaseInternalNotes,
  useCaseEvidence,
  useCaseStatusHistory,
  useAssignCase,
  useUpdateCaseStatus,
  useAddCaseInternalNote,
  useRequestCaseEvidenceUploadUrl,
  useAddCaseEvidence,
  useListAdmins,
  type SupportCaseSummary,
  type CaseStatus,
  type OwnerType,
  type CasePriority,
} from "@/hooks/admin";

// ─── constants ──────────────────────────────────────────────────────────────

const CASE_STATUSES: CaseStatus[] = [
  "SUBMITTED",
  "ASSIGNED",
  "INVESTIGATING",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
  "REJECTED",
  "CANCELLED",
];
const OWNER_TYPES: OwnerType[] = ["COMMUNITY", "ASSOCIATION", "MARKETPLACE", "SYSTEM"];
const PRIORITIES: CasePriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const PAGE_LIMIT = 25;

// ─── helpers ──────────────────────────────────────────────────────────────────

const titleCase = (value?: string | null) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "—";

const formatTs = (ts?: string | null) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString();
};

const statusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "SUBMITTED":
    case "REOPENED":
      return "secondary";
    case "ASSIGNED":
    case "INVESTIGATING":
      return "default";
    case "REJECTED":
    case "CANCELLED":
      return "destructive";
    case "RESOLVED":
    case "CLOSED":
    default:
      return "outline";
  }
};

const priorityVariant = (
  priority?: string | null,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (priority) {
    case "URGENT":
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "secondary";
    case "LOW":
    default:
      return "outline";
  }
};

const isImage = (mime?: string | null) => !!mime && mime.startsWith("image/");

// ─── component ────────────────────────────────────────────────────────────────

export default function SupportTicketing() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // ── filters / pagination ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);

  // ── detail / dialogs ───────────────────────────────────────────────────────
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // ── form state ─────────────────────────────────────────────────────────────
  const [assignTo, setAssignTo] = useState("");
  const [targetStatus, setTargetStatus] = useState<CaseStatus>("ASSIGNED");
  const [statusReason, setStatusReason] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionError, setResolutionError] = useState(false);
  const [newNote, setNewNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── admin list for assignment (same hook DisputesResolution uses) ──────────
  const { data: adminsData, loading: adminsLoading } = useListAdmins(100, 0);
  const adminList = (adminsData?.listAdmins?.admins ?? []).map((admin) => ({
    id: admin.id,
    name: admin.email,
  }));

  // ── list query ─────────────────────────────────────────────────────────────
  const { data, loading } = useAllCases({
    ownerType: ownerTypeFilter !== "all" ? (ownerTypeFilter as OwnerType) : undefined,
    status: statusFilter !== "all" ? (statusFilter as CaseStatus) : undefined,
    priority: priorityFilter !== "all" ? (priorityFilter as CasePriority) : undefined,
    limit: PAGE_LIMIT,
    offset,
  });
  const total = data?.allCases?.total ?? 0;

  // Client-side search across the current page.
  const cases = useMemo(() => {
    const allCases = data?.allCases?.cases ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCases;
    return allCases.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.reporterUserId.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  // ── detail queries ─────────────────────────────────────────────────────────
  const { data: caseData, loading: caseLoading } = useSupportCase(selectedCaseId);
  const supportCase = caseData?.supportCase ?? null;
  const { data: notesData, loading: notesLoading } =
    useCaseInternalNotes(selectedCaseId);
  const notes = notesData?.caseInternalNotes ?? [];
  const { data: evidenceData, loading: evidenceLoading } =
    useCaseEvidence(selectedCaseId);
  const evidence = evidenceData?.caseEvidence ?? [];
  const { data: historyData, loading: historyLoading } =
    useCaseStatusHistory(selectedCaseId);
  const history = historyData?.caseStatusHistory ?? [];

  // ── mutations ──────────────────────────────────────────────────────────────
  const [assignCase, { loading: assignLoading }] = useAssignCase();
  const [updateCaseStatus, { loading: statusLoading }] = useUpdateCaseStatus();
  const [addNote, { loading: noteLoading }] = useAddCaseInternalNote();
  const [requestUploadUrl] = useRequestCaseEvidenceUploadUrl();
  const [addEvidence, { loading: evidenceUploading }] = useAddCaseEvidence();
  const [uploadInFlight, setUploadInFlight] = useState(false);

  // ── handlers ───────────────────────────────────────────────────────────────
  const openDetail = (c: SupportCaseSummary) => {
    setSelectedCaseId(c.id);
    setIsDetailOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedCaseId || !assignTo) return;
    try {
      await assignCase({ variables: { caseId: selectedCaseId, assigneeUserId: assignTo } });
      toast({ title: t("common.save"), description: t("supportCases.assignSuccess") });
      setIsAssignOpen(false);
      setAssignTo("");
    } catch (err: unknown) {
      const message = friendlyErrorMessage(err, t("supportCases.assignError"));
      toast({ title: t("common.errorTitle"), description: message, variant: "destructive" });
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedCaseId) return;
    const needsResolution = targetStatus === "RESOLVED";
    if (needsResolution && !resolutionSummary.trim()) {
      setResolutionError(true);
      return;
    }
    try {
      await updateCaseStatus({
        variables: {
          caseId: selectedCaseId,
          targetStatus,
          reason: statusReason.trim() || undefined,
          resolutionSummary: needsResolution ? resolutionSummary.trim() : undefined,
        },
      });
      toast({ title: t("common.save"), description: t("supportCases.statusSuccess") });
      setIsStatusOpen(false);
      setStatusReason("");
      setResolutionSummary("");
      setResolutionError(false);
    } catch (err: unknown) {
      const message = friendlyErrorMessage(err, t("supportCases.statusError"));
      toast({ title: t("common.errorTitle"), description: message, variant: "destructive" });
    }
  };

  const handleAddNote = async () => {
    if (!selectedCaseId || !newNote.trim()) return;
    try {
      await addNote({ variables: { input: { caseId: selectedCaseId, body: newNote.trim() } } });
      toast({ title: t("common.save"), description: t("supportCases.noteSuccess") });
      setNewNote("");
    } catch (err: unknown) {
      const message = friendlyErrorMessage(err, t("supportCases.noteError"));
      toast({ title: t("common.errorTitle"), description: message, variant: "destructive" });
    }
  };

  // Two-step upload: request signed URL -> PUT bytes -> confirm via addEvidence.
  const handleEvidenceSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedCaseId) return;
    setUploadInFlight(true);
    try {
      const { data: urlData } = await requestUploadUrl({
        variables: {
          caseId: selectedCaseId,
          contentType: file.type || "application/octet-stream",
          fileName: file.name,
        },
      });
      const ticket = urlData?.requestCaseEvidenceUploadUrl;
      if (!ticket?.uploadUrl || !ticket?.evidenceId) {
        throw new Error(t("supportCases.evidenceError"));
      }
      const putRes = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
      }
      await addEvidence({
        variables: {
          caseId: selectedCaseId,
          evidenceId: ticket.evidenceId,
          sizeBytes: file.size,
        },
      });
      toast({ title: t("common.save"), description: t("supportCases.evidenceSuccess") });
    } catch (err: unknown) {
      const message = friendlyErrorMessage(err, t("supportCases.evidenceError"));
      toast({ title: t("common.errorTitle"), description: message, variant: "destructive" });
    } finally {
      setUploadInFlight(false);
    }
  };

  const resetFilters = () => {
    setOwnerTypeFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
    setOffset(0);
  };

  const linkedEntities = supportCase
    ? [
        { key: "linkedDispute", value: supportCase.linkedDisputeId },
        { key: "linkedEscrow", value: supportCase.linkedEscrowId },
        { key: "linkedOrder", value: supportCase.linkedOrderId },
        { key: "linkedVendor", value: supportCase.linkedVendorId },
      ].filter((x) => !!x.value)
    : [];

  const hasMore = offset + PAGE_LIMIT < total;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("supportCases.title")}</h1>
          <p className="text-muted-foreground">{t("supportCases.subtitle")}</p>
        </div>

        {/* Top bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("supportCases.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 p-4 bg-card rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">{t("supportCases.ownerType")}</Label>
            <Select
              value={ownerTypeFilter}
              onValueChange={(v) => {
                setOwnerTypeFilter(v);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {OWNER_TYPES.map((o) => (
                  <SelectItem key={o} value={o}>
                    {titleCase(o)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("supportCases.status")}</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {CASE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("supportCases.priority")}</Label>
            <Select
              value={priorityFilter}
              onValueChange={(v) => {
                setPriorityFilter(v);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {titleCase(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            {t("supportCases.clearFilters")}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("supportCases.caseNumber")}</TableHead>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("supportCases.ownerType")}</TableHead>
                <TableHead>{t("supportCases.priority")}</TableHead>
                <TableHead>{t("supportCases.status")}</TableHead>
                <TableHead>{t("supportCases.reporter")}</TableHead>
                <TableHead>{t("supportCases.assignee")}</TableHead>
                <TableHead>{t("supportCases.submitted")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t("supportCases.loading")}
                  </TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t("supportCases.noCases")}
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.caseNumber}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{titleCase(c.ownerType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(c.priority)}>{titleCase(c.priority)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(c.status)}>{titleCase(c.status)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.reporterUserId ? c.reporterUserId.slice(0, 8) + "…" : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.assigneeUserId
                        ? c.assigneeUserId.slice(0, 8) + "…"
                        : t("supportCases.unassigned")}
                    </TableCell>
                    <TableCell className="text-sm">{formatTs(c.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.view")}
                          onClick={() => openDetail(c)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("supportCases.assign")}
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setAssignTo("");
                            setIsAssignOpen(true);
                          }}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("supportCases.updateStatus")}
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setTargetStatus(c.status as CaseStatus);
                            setStatusReason("");
                            setResolutionSummary("");
                            setResolutionError(false);
                            setIsStatusOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {t("supportCases.showing", {
                from: total === 0 ? 0 : offset + 1,
                to: offset + cases.length,
                total,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0 || loading}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_LIMIT))}
              >
                {t("common.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore || loading}
                onClick={() => setOffset((o) => o + PAGE_LIMIT)}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        </div>

        {/* Detail sheet */}
        <Sheet
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) setSelectedCaseId(null);
          }}
        >
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {caseLoading && !supportCase ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("supportCases.loading")}
              </p>
            ) : supportCase ? (
              <>
                <SheetHeader>
                  <SheetTitle>{supportCase.title}</SheetTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{supportCase.caseNumber}</Badge>
                    <Badge variant="outline">{titleCase(supportCase.ownerType)}</Badge>
                    <Badge variant={priorityVariant(supportCase.priority)}>
                      {titleCase(supportCase.priority)}
                    </Badge>
                    <Badge variant={statusVariant(supportCase.status)}>
                      {titleCase(supportCase.status)}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAssignTo(supportCase.assigneeUserId ?? "");
                      setIsAssignOpen(true);
                    }}
                  >
                    <UserCheck className="mr-2 h-4 w-4" /> {t("supportCases.assign")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTargetStatus(supportCase.status as CaseStatus);
                      setStatusReason("");
                      setResolutionSummary(supportCase.resolutionSummary ?? "");
                      setResolutionError(false);
                      setIsStatusOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> {t("supportCases.updateStatus")}
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">{t("supportCases.tabOverview")}</TabsTrigger>
                    <TabsTrigger value="evidence">{t("supportCases.tabEvidence")}</TabsTrigger>
                    <TabsTrigger value="notes">{t("supportCases.tabNotes")}</TabsTrigger>
                    <TabsTrigger value="history">{t("supportCases.tabHistory")}</TabsTrigger>
                  </TabsList>

                  {/* Overview */}
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t("supportCases.caseType")}:</span>
                          <span className="ml-2">{supportCase.category ?? "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("supportCases.status")}:</span>
                          <span className="ml-2">{titleCase(supportCase.status)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("supportCases.reporter")}:</span>
                          <span className="ml-2 font-mono text-xs">{supportCase.reporterUserId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("supportCases.assignee")}:</span>
                          <span className="ml-2 font-mono text-xs">
                            {supportCase.assigneeUserId ?? t("supportCases.unassigned")}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("supportCases.submitted")}:</span>
                          <span className="ml-2">{formatTs(supportCase.submittedAt)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("supportCases.updated")}:</span>
                          <span className="ml-2">{formatTs(supportCase.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {linkedEntities.length > 0 && (
                      <div className="p-4 rounded-lg border bg-card space-y-2">
                        <h4 className="font-semibold">{t("supportCases.linkedEntities")}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {linkedEntities.map((le) => (
                            <div key={le.key}>
                              <span className="text-muted-foreground">
                                {t(`supportCases.${le.key}`)}:
                              </span>
                              <span className="ml-2 font-mono text-xs">{le.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-lg border bg-card space-y-2">
                      <h4 className="font-semibold">{t("supportCases.description")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {supportCase.description ?? t("supportCases.noDescription")}
                      </p>
                    </div>

                    {supportCase.resolutionSummary && (
                      <div className="p-4 rounded-lg border bg-card space-y-2">
                        <h4 className="font-semibold">{t("supportCases.resolutionSummary")}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {supportCase.resolutionSummary}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Evidence */}
                  <TabsContent value="evidence" className="mt-4 space-y-4">
                    <div className="flex justify-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleEvidenceSelected}
                      />
                      <Button
                        size="sm"
                        disabled={uploadInFlight || evidenceUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadInFlight || evidenceUploading
                          ? t("supportCases.uploading")
                          : t("supportCases.uploadEvidence")}
                      </Button>
                    </div>
                    {evidenceLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {t("supportCases.loadingEvidence")}
                      </p>
                    ) : evidence.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {t("supportCases.noEvidence")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {evidence.map((ev) => (
                          <a
                            key={ev.id}
                            href={ev.readUrl ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="group rounded-lg border bg-card p-2 hover:bg-accent transition-colors"
                          >
                            {isImage(ev.mimeType) && ev.readUrl ? (
                              <img
                                src={ev.readUrl}
                                alt={ev.fileName ?? ev.id}
                                className="h-24 w-full rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-24 w-full items-center justify-center rounded bg-muted">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-1 text-xs">
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {ev.fileName ?? titleCase(ev.kind) ?? ev.id}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Internal notes */}
                  <TabsContent value="notes" className="mt-4 space-y-4">
                    <ScrollArea className="h-[280px] rounded-lg border p-4">
                      {notesLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("supportCases.loadingNotes")}
                        </p>
                      ) : notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("supportCases.noNotes")}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {notes.map((note) => (
                            <div key={note.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {note.authorUserId.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs font-medium">
                                    {note.authorUserId.slice(0, 8)}…
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTs(note.createdAt)}
                                  </span>
                                </div>
                                <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                                  {note.body}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={t("supportCases.addNote")}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        aria-label={t("supportCases.postNote")}
                        disabled={noteLoading || !newNote.trim()}
                        onClick={handleAddNote}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  {/* History */}
                  <TabsContent value="history" className="mt-4">
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("supportCases.timestamp")}</TableHead>
                            <TableHead>{t("supportCases.transition")}</TableHead>
                            <TableHead>{t("supportCases.actor")}</TableHead>
                            <TableHead>{t("supportCases.reason")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyLoading ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                {t("supportCases.loadingHistory")}
                              </TableCell>
                            </TableRow>
                          ) : history.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                {t("supportCases.noHistory")}
                              </TableCell>
                            </TableRow>
                          ) : (
                            history.map((h) => (
                              <TableRow key={h.id}>
                                <TableCell className="text-sm">{formatTs(h.createdAt)}</TableCell>
                                <TableCell className="text-sm">
                                  {h.fromStatus ? `${titleCase(h.fromStatus)} → ` : ""}
                                  {titleCase(h.toStatus)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {h.actorUserId ? h.actorUserId.slice(0, 8) + "…" : "System"}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-muted-foreground">
                                  {h.reason ?? "—"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
          </SheetContent>
        </Sheet>

        {/* Assign dialog */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("supportCases.assignCase")}</DialogTitle>
              <DialogDescription>{t("supportCases.assign")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>{t("supportCases.assignTo")} *</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder={t("supportCases.selectAdmin")} />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {adminsLoading ? (
                    <SelectItem value="loading" disabled>
                      {t("supportCases.loadingAdmins")}
                    </SelectItem>
                  ) : (
                    adminList.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAssign} disabled={!assignTo || assignLoading}>
                {t("supportCases.assign")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status dialog */}
        <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("supportCases.updateStatus")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("supportCases.targetStatus")} *</Label>
                <Select
                  value={targetStatus}
                  onValueChange={(v) => {
                    setTargetStatus(v as CaseStatus);
                    if (v !== "RESOLVED") setResolutionError(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {CASE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {titleCase(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("supportCases.reason")}</Label>
                <Textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={t("supportCases.reasonOptional")}
                />
              </div>
              {targetStatus === "RESOLVED" && (
                <div className="space-y-2">
                  <Label>{t("supportCases.resolutionSummary")} *</Label>
                  <Textarea
                    value={resolutionSummary}
                    onChange={(e) => {
                      setResolutionSummary(e.target.value);
                      if (e.target.value.trim()) setResolutionError(false);
                    }}
                    aria-invalid={resolutionError}
                    className={resolutionError ? "border-destructive" : ""}
                  />
                  {resolutionError && (
                    <p className="text-xs text-destructive">
                      {t("supportCases.resolutionRequired")}
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdateStatus} disabled={statusLoading}>
                {t("supportCases.updateStatus")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
