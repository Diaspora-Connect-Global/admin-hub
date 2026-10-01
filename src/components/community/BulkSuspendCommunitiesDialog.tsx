import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useSuspendCommunity } from "@/hooks/admin";
import { displayErrorMessage, throwIfGraphQLErrors } from "@/lib/graphqlErrors";
import { runBulk } from "@/lib/bulkRun";
import { BulkActionStatus, type BulkFailure } from "./BulkActionStatus";

export interface BulkSuspendTarget {
  id: string;
  name: string;
  isSuspended: boolean;
}

interface BulkSuspendCommunitiesDialogProps {
  communities: BulkSuspendTarget[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Re-read the list after at least one community was suspended. */
  onChanged: () => unknown;
  /** After a run: the ids that could NOT be suspended (empty when all succeeded). */
  onCompleted?: (failedIds: string[]) => void;
}

const REASON_MAX_LENGTH = 1000;
const SUSPEND_CONCURRENCY = 4;

/**
 * Platform suspension of several communities at once.
 *
 * One `suspendCommunity` per community, bounded — NOT the gateway's
 * `bulkSuspendCommunities`, which still sets visibility `HIDDEN` (a value the
 * domain rejects), so every item it attempts fails.
 *
 * Communities that are already suspended are listed but skipped: re-suspending
 * one overwrites the reason recorded when it was first suspended.
 *
 * Every result is checked (`errorPolicy: "all"` resolves refusals; the payload
 * carries `success`). A partial run keeps the dialog open, names each community
 * that was not suspended with the reason, and narrows the dialog to those so a
 * retry never repeats the ones that succeeded.
 */
export function BulkSuspendCommunitiesDialog({
  communities,
  open,
  onOpenChange,
  onChanged,
  onCompleted,
}: BulkSuspendCommunitiesDialogProps) {
  const { t } = useTranslation();
  const reasonId = useId();
  const [suspendCommunity] = useSuspendCommunity();

  const [reason, setReason] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<BulkFailure[]>([]);
  const [lastRun, setLastRun] = useState({ succeeded: 0, total: 0 });

  // Latch the selection when the dialog opens (the list refetches during a run).
  const [toSuspend, setToSuspend] = useState<BulkSuspendTarget[]>([]);
  const [alreadySuspended, setAlreadySuspended] = useState<BulkSuspendTarget[]>([]);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setToSuspend(communities.filter((c) => !c.isSuspended));
      setAlreadySuspended(communities.filter((c) => c.isSuspended));
      setReason("");
      setProgress(null);
      setFailures([]);
      setLastRun({ succeeded: 0, total: 0 });
    }
  }

  const busy = progress !== null;

  const handleConfirm = async () => {
    if (toSuspend.length === 0) return;
    const trimmed = reason.trim();
    setFailures([]);
    setProgress({ done: 0, total: toSuspend.length });

    const outcomes = await runBulk(
      toSuspend,
      async (community) => {
        const result = await suspendCommunity({
          variables: { input: { communityId: community.id, ...(trimmed ? { reason: trimmed } : {}) } },
        });
        throwIfGraphQLErrors(result, "SuspendCommunity");
        const payload = result.data?.suspendCommunity;
        if (!payload?.success) throw new Error(payload?.message || t("communities.suspendFailed"));
      },
      { concurrency: SUSPEND_CONCURRENCY, onProgress: (done, total) => setProgress({ done, total }) },
    );
    setProgress(null);

    const failed = outcomes.filter((o) => !o.ok);
    const okCount = outcomes.length - failed.length;
    if (okCount > 0) await onChanged();
    onCompleted?.(failed.map((o) => o.item.id));

    if (failed.length === 0) {
      toast({
        title: t("communities.bulkSuspendDialog.done"),
        description: t("communities.bulkSuspendDialog.doneDesc", { count: okCount }),
      });
      onOpenChange(false);
      return;
    }

    setToSuspend(failed.map((o) => o.item));
    setAlreadySuspended([]);
    setLastRun({ succeeded: okCount, total: outcomes.length });
    setFailures(
      failed.map((o) => ({
        name: o.item.name,
        message: displayErrorMessage(o.error, t("communities.suspendFailed")),
      })),
    );
    toast({
      title: t("communities.bulkSuspendDialog.partialToast"),
      description: t("communities.bulkSuspendDialog.partial", { succeeded: okCount, total: outcomes.length }),
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("communities.bulkSuspendDialog.title")}</DialogTitle>
          <DialogDescription>{t("communities.suspendEffect")}</DialogDescription>
        </DialogHeader>

        {toSuspend.length > 0 ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("communities.bulkSuspendDialog.willSuspend", { count: toSuspend.length })}
            </p>
            <ul className="max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-sm">
              {toSuspend.map((community) => (
                <li key={community.id}>{community.name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("communities.bulkSuspendDialog.nothingToSuspend")}</p>
        )}

        {alreadySuspended.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("communities.bulkSuspendDialog.alreadySuspended", { count: alreadySuspended.length })}
            </p>
            <ul className="max-h-24 list-disc space-y-0.5 overflow-y-auto pl-5 text-sm text-muted-foreground">
              {alreadySuspended.map((community) => (
                <li key={community.id}>{community.name}</li>
              ))}
            </ul>
          </div>
        )}

        {toSuspend.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor={reasonId}>{t("communities.suspendReasonOptional")}</Label>
            <Textarea
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("communities.bulkSuspendDialog.reasonPlaceholder")}
              maxLength={REASON_MAX_LENGTH}
              rows={3}
              disabled={busy}
            />
          </div>
        )}

        <BulkActionStatus
          progress={progress}
          progressLabel={t("communities.bulkSuspendDialog.progress", {
            done: progress?.done ?? 0,
            total: progress?.total ?? 0,
          })}
          failures={failures}
          failureSummary={t("communities.bulkSuspendDialog.partial", lastRun)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {failures.length > 0 ? t("common.close") : t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={busy || toSuspend.length === 0}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {failures.length > 0
              ? t("communities.retryFailed")
              : t("communities.bulkSuspendDialog.confirm", { count: toSuspend.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
