import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Brain,
  KeyRound,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  PlayCircle,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import {
  useAiListProviderCredentials,
  useAiGetClassifierConfig,
  useAiRevokeProviderCredential,
  useAiSetPrimaryProvider,
  useAiStartBackfill,
  useAiGetBackfillJob,
  useAiClassifyPost,
  type AiProviderCredential,
  type AiProviderType,
} from "@/hooks/admin";
import { AiProviderCredentialModal } from "@/components/admin/AiProviderCredentialModal";
import { AiClassifierConfigModal } from "@/components/admin/AiClassifierConfigModal";
import { StatusBadge } from "@/components/ui/StatusBadge";

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  OPENAI: "OpenAI",
  GROQ: "Groq",
  OPENROUTER: "OpenRouter",
  HUGGINGFACE: "Hugging Face",
};

const PROVIDER_OPTIONS: AiProviderType[] = ["GROQ", "OPENROUTER", "HUGGINGFACE", "OPENAI"];

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function AiConfiguration() {
  const { toast } = useToast();
  const { isSystemAdmin, isAuthenticated } = useAdminAuth();
  // Client-side role gate — the underlying GraphQL operations are server-gated
  // too (`@Roles('SYSTEM_ADMIN', 'SUPER_ADMIN')`), but rendering nothing keeps
  // non-system admins from even seeing a Forbidden error toast on this page.
  // The actual <Navigate /> is rendered at the bottom of this component so we
  // never break the rules-of-hooks order between renders.
  const shouldRedirect = isAuthenticated && !isSystemAdmin;

  // ── Provider credentials ─────────────────────────────────────────────────
  const {
    data: credentialsData,
    loading: credentialsLoading,
    refetch: refetchCredentials,
  } = useAiListProviderCredentials();
  const credentials = credentialsData?.aiListProviderCredentials ?? [];

  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<AiProviderCredential | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AiProviderCredential | null>(null);

  const [revokeMutation, { loading: revoking }] = useAiRevokeProviderCredential();

  const handleAddCredential = () => {
    setEditingCredential(null);
    setCredentialModalOpen(true);
  };

  const handleEditCredential = (cred: AiProviderCredential) => {
    setEditingCredential(cred);
    setCredentialModalOpen(true);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation({ variables: { id: revokeTarget.id } });
      toast({
        title: "Credential revoked",
        description: `${revokeTarget.label} can no longer be used for classification.`,
      });
      setRevokeTarget(null);
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  // ── Classifier config ────────────────────────────────────────────────────
  const {
    data: configData,
    loading: configLoading,
    refetch: refetchConfig,
  } = useAiGetClassifierConfig();
  const classifierConfig = configData?.aiGetClassifierConfig ?? null;
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // ── Primary provider ─────────────────────────────────────────────────────
  const [primaryDraft, setPrimaryDraft] = useState<AiProviderType | "">("");
  const [primaryConfirmOpen, setPrimaryConfirmOpen] = useState(false);
  const [setPrimary, { loading: settingPrimary }] = useAiSetPrimaryProvider();

  const currentPrimary = (classifierConfig?.providerOrder?.[0] as AiProviderType | undefined) ?? "";
  const fallbackChain = useMemo(
    () => classifierConfig?.providerOrder?.slice(1) ?? [],
    [classifierConfig?.providerOrder],
  );

  useEffect(() => {
    if (currentPrimary && !primaryDraft) setPrimaryDraft(currentPrimary);
  }, [currentPrimary, primaryDraft]);

  const handleApplyPrimary = async () => {
    if (!primaryDraft || primaryDraft === currentPrimary) {
      setPrimaryConfirmOpen(false);
      return;
    }
    try {
      await setPrimary({ variables: { provider: primaryDraft as AiProviderType } });
      toast({
        title: "Primary provider updated",
        description: `${PROVIDER_LABELS[primaryDraft as AiProviderType]} is now the default.`,
      });
      setPrimaryConfirmOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  // ── Backfill ─────────────────────────────────────────────────────────────
  const [backfillForm, setBackfillForm] = useState({
    batchSize: 100,
    maxBatches: 50,
    onlyMissing: true,
    dryRun: false,
    since: "",
  });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [startBackfill, { loading: startingBackfill }] = useAiStartBackfill();
  const { data: jobData, loading: jobLoading } = useAiGetBackfillJob(activeJobId, 5000);
  const job = jobData?.aiGetBackfillJob;

  const handleStartBackfill = async () => {
    try {
      const res = await startBackfill({
        variables: {
          input: {
            batchSize: Number(backfillForm.batchSize) || 100,
            maxBatches: Number(backfillForm.maxBatches) || 50,
            onlyMissing: backfillForm.onlyMissing,
            dryRun: backfillForm.dryRun,
            since: backfillForm.since.trim() || undefined,
          },
        },
      });
      const newJob = res.data?.aiStartBackfill;
      if (newJob) {
        setActiveJobId(newJob.id);
        toast({
          title: "Backfill started",
          description: `${backfillForm.dryRun ? "Dry-run" : "Live"} job ${newJob.id.slice(0, 8)}… is now running.`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  // ── Manual re-classify ───────────────────────────────────────────────────
  const [reclassifyPostId, setReclassifyPostId] = useState("");
  const [classifyPost, { loading: classifying, data: classifyData, reset: resetClassify }] =
    useAiClassifyPost();

  const handleReclassify = async () => {
    if (!reclassifyPostId.trim()) {
      toast({ title: "Post ID required", variant: "destructive" });
      return;
    }
    try {
      await classifyPost({ variables: { postId: reclassifyPostId.trim() } });
      toast({ title: "Classified", description: "Post re-classified successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const classifyResult = classifyData?.aiClassifyPost;

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              AI Configuration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage LLM provider credentials, the active classifier, and post-categorization backfills.
            </p>
          </div>
        </div>

        <SettingsTabs />

        {/* Active Default (Primary Provider) */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Primary Provider
              {configLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>
              The first provider tried at classify time. On failure (rate-limit, HTTP error, decrypt error)
              the chain falls through in order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configLoading && !classifierConfig ? (
              <Skeleton className="h-6 w-64" />
            ) : (
              <div className="text-sm">
                <span className="text-muted-foreground">Current primary: </span>
                <span className="font-semibold text-foreground">
                  {currentPrimary ? PROVIDER_LABELS[currentPrimary] : "—"}
                </span>
                {fallbackChain.length > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    (fallback chain:{" "}
                    {fallbackChain
                      .map((p) => PROVIDER_LABELS[p as AiProviderType] ?? p)
                      .join(" → ")}
                    )
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <Label>Change primary</Label>
                <Select
                  value={primaryDraft || undefined}
                  onValueChange={(v) => setPrimaryDraft(v as AiProviderType)}
                  disabled={configLoading || settingPrimary}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {PROVIDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {PROVIDER_LABELS[opt]}
                        {opt === "OPENAI" ? " (paid)" : " (free)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setPrimaryConfirmOpen(true)}
                disabled={
                  configLoading ||
                  settingPrimary ||
                  !primaryDraft ||
                  primaryDraft === currentPrimary
                }
                className="gap-2"
              >
                {settingPrimary && <Loader2 className="w-4 h-4 animate-spin" />}
                Apply
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Free providers (Groq, OpenRouter, Hugging Face) don't require a credit card. OpenAI requires a paid account.
            </p>
          </CardContent>
        </Card>

        {/* Provider Credentials */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Provider Credentials
                </CardTitle>
                <CardDescription>
                  Encrypted-at-rest API keys. Only the masked preview (e.g. <code>sk-...XYZ4</code>) is ever displayed.
                </CardDescription>
              </div>
              <Button onClick={handleAddCredential} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Provider
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {credentialsLoading && credentials.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No provider credentials yet. Add one to enable post classification.
              </p>
            ) : (
              <div className="table-container overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Provider</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Default Model</TableHead>
                      <TableHead>Key Preview</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Last Rotated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials.map((cred) => (
                      <TableRow key={cred.id} className="border-border">
                        <TableCell className="font-medium">
                          {PROVIDER_LABELS[cred.provider] ?? cred.provider}
                        </TableCell>
                        <TableCell>{cred.label}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {cred.modelDefault || "—"}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {cred.keyPreview}
                          </code>
                        </TableCell>
                        <TableCell>
                          {cred.isActive ? (
                            <StatusBadge variant="active">Active</StatusBadge>
                          ) : (
                            <StatusBadge variant="inactive">Inactive</StatusBadge>
                          )}
                        </TableCell>
                        <TableCell>{cred.priority}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(cred.lastRotatedAt ?? cred.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Credential actions">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleEditCredential(cred)}
                              >
                                <Pencil className="w-4 h-4" /> Edit / Rotate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => setRevokeTarget(cred)}
                              >
                                <Trash2 className="w-4 h-4" /> Revoke
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classifier Config */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Classifier Config
                  {classifierConfig && (
                    <Badge variant="secondary" className="ml-1">
                      v{classifierConfig.version}
                    </Badge>
                  )}
                  {configLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  Taxonomy, prompt template, and ranking thresholds. Saving bumps the version
                  so stale events get skipped downstream.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setConfigModalOpen(true)}
                disabled={configLoading || !classifierConfig}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {configLoading && !classifierConfig ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : classifierConfig ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Task type</p>
                    <p className="text-sm font-mono">{classifierConfig.taskType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="text-sm">{classifierConfig.temperature}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max topics</p>
                    <p className="text-sm">{classifierConfig.maxTopics}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Min confidence</p>
                    <p className="text-sm">{classifierConfig.minConfidence}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm">
                      {classifierConfig.isActive ? (
                        <StatusBadge variant="active">Active</StatusBadge>
                      ) : (
                        <StatusBadge variant="warning">Paused</StatusBadge>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="text-sm">{formatDate(classifierConfig.updatedAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Taxonomy ({classifierConfig.taxonomy.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {classifierConfig.taxonomy.map((cat) => (
                      <Badge key={cat} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prompt template</p>
                  <pre className="bg-secondary border border-border rounded-md p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {classifierConfig.promptTemplate}
                  </pre>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Classifier config not loaded.</p>
            )}
          </CardContent>
        </Card>

        {/* Backfill */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-primary" />
              Backfill Existing Posts
            </CardTitle>
            <CardDescription>
              Re-classify posts that already exist in post-feed-service. Default cap of 50 × 100 = 5,000 posts per invocation.
              Raise <code>maxBatches</code> for larger corpora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bf-batch">Batch Size</Label>
                <Input
                  id="bf-batch"
                  type="number"
                  min={1}
                  max={500}
                  value={backfillForm.batchSize}
                  onChange={(e) =>
                    setBackfillForm((p) => ({ ...p, batchSize: Number(e.target.value) }))
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bf-max">Max Batches</Label>
                <Input
                  id="bf-max"
                  type="number"
                  min={1}
                  value={backfillForm.maxBatches}
                  onChange={(e) =>
                    setBackfillForm((p) => ({ ...p, maxBatches: Number(e.target.value) }))
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bf-since">Since (optional)</Label>
                <Input
                  id="bf-since"
                  type="datetime-local"
                  value={backfillForm.since}
                  onChange={(e) =>
                    setBackfillForm((p) => ({ ...p, since: e.target.value }))
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 h-10">
                  <Label className="cursor-pointer">Only missing</Label>
                  <Switch
                    checked={backfillForm.onlyMissing}
                    onCheckedChange={(checked) =>
                      setBackfillForm((p) => ({ ...p, onlyMissing: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 h-10">
                  <Label className="cursor-pointer">Dry run</Label>
                  <Switch
                    checked={backfillForm.dryRun}
                    onCheckedChange={(checked) =>
                      setBackfillForm((p) => ({ ...p, dryRun: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleStartBackfill} disabled={startingBackfill} className="gap-2">
                {startingBackfill ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                Start Backfill
              </Button>
            </div>

            {/* Active job */}
            {activeJobId && (
              <div className="rounded-md border border-border bg-secondary/50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Job {activeJobId.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">
                      Started {formatDate(job?.startedAt)}
                      {job?.dryRun ? " • dry-run" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job?.status === "RUNNING" && (
                      <StatusBadge variant="info">Running</StatusBadge>
                    )}
                    {job?.status === "COMPLETED" && (
                      <StatusBadge variant="active">Completed</StatusBadge>
                    )}
                    {job?.status === "FAILED" && (
                      <StatusBadge variant="error">Failed</StatusBadge>
                    )}
                    {job?.status === "CANCELLED" && (
                      <StatusBadge variant="inactive">Cancelled</StatusBadge>
                    )}
                    {jobLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveJobId(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Processed</p>
                    <p className="font-semibold">{job?.processed ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Succeeded</p>
                    <p className="font-semibold text-success">{job?.succeeded ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="font-semibold text-destructive">{job?.failed ?? 0}</p>
                  </div>
                </div>

                {(() => {
                  const cap =
                    (Number(backfillForm.batchSize) || 100) *
                    (Number(backfillForm.maxBatches) || 50);
                  const processed = job?.processed ?? 0;
                  const pct = cap > 0 ? Math.min(100, (processed / cap) * 100) : 0;
                  return (
                    <div className="space-y-1">
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {processed.toLocaleString()} / ~{cap.toLocaleString()} (estimated cap)
                      </p>
                    </div>
                  );
                })()}

                {job?.lastError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-destructive break-words">
                      <p className="font-medium">Last error</p>
                      <p className="font-mono">{job.lastError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Re-classify */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Manual Re-classify</CardTitle>
            <CardDescription>
              Force a single post through the active classifier. Useful for diagnosing a specific post or for
              re-classifying after a taxonomy change.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="reclassify-id">Post ID</Label>
                <Input
                  id="reclassify-id"
                  placeholder="UUID of the post"
                  value={reclassifyPostId}
                  onChange={(e) => {
                    setReclassifyPostId(e.target.value);
                    if (resetClassify) resetClassify();
                  }}
                  className="bg-secondary border-border font-mono"
                />
              </div>
              <Button
                onClick={handleReclassify}
                disabled={classifying || !reclassifyPostId.trim()}
                className="gap-2"
              >
                {classifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Re-classify
              </Button>
            </div>

            {classifyResult && (
              <div className="rounded-md border border-border bg-secondary/50 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="font-medium">{classifyResult.providerUsed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Model</p>
                    <p className="font-mono text-xs">{classifyResult.modelUsed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="font-medium">
                      {(classifyResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Classifier version</p>
                    <p>v{classifyResult.classifierVersion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Classified at</p>
                    <p>{formatDate(classifyResult.classifiedAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {classifyResult.categories.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">none</span>
                    ) : (
                      classifyResult.categories.map((c) => (
                        <Badge key={c} className="bg-primary/15 text-primary border-primary/30">
                          {c}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Topics ({classifyResult.topics.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {classifyResult.topics.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">none</span>
                    ) : (
                      classifyResult.topics.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AiProviderCredentialModal
        isOpen={credentialModalOpen}
        onClose={() => {
          setCredentialModalOpen(false);
          setEditingCredential(null);
          refetchCredentials();
        }}
        editing={editingCredential}
      />

      <AiClassifierConfigModal
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          refetchConfig();
        }}
        current={classifierConfig}
      />

      {/* Revoke confirm */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke credential?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                <span className="font-medium">{revokeTarget?.label}</span> ({revokeTarget && PROVIDER_LABELS[revokeTarget.provider]})
                will be removed from the active provider chain immediately.
              </span>
              <span className="block mt-2 text-xs">
                Classification will fall through to the next active provider in the chain. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Primary provider switch confirm */}
      <AlertDialog
        open={primaryConfirmOpen}
        onOpenChange={(open) => !open && setPrimaryConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch primary provider?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                Set <span className="font-medium">{primaryDraft && PROVIDER_LABELS[primaryDraft as AiProviderType]}</span> as the
                first provider in the classification chain.
              </span>
              <span className="block mt-2 text-xs">
                Existing in-flight classifications continue with the previous chain; new classifications use the new order.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={settingPrimary}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyPrimary} disabled={settingPrimary}>
              {settingPrimary && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Switch Primary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
