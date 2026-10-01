import { useState } from "react";
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
import { useSuspendCommunity, useUnsuspendCommunity } from "@/hooks/admin";
import { friendlyErrorMessage, throwIfGraphQLErrors } from "@/lib/graphqlErrors";

export interface SuspendableCommunity {
  id: string;
  name: string;
  isSuspended?: boolean | null;
}

interface SuspendCommunityDialogProps {
  community: SuspendableCommunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the server confirmed the change, to re-read the community state. */
  onChanged: () => unknown;
}

const REASON_MAX_LENGTH = 1000;

/**
 * Platform suspension of a whole community, or lifting it — whichever applies to
 * the community's current state. The reason is optional. A suspension leaves
 * visibility, join policy and memberships untouched, so unsuspending restores the
 * community exactly as it was.
 */
export function SuspendCommunityDialog({
  community,
  open,
  onOpenChange,
  onChanged,
}: SuspendCommunityDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suspendCommunity, { loading: suspending }] = useSuspendCommunity();
  const [unsuspendCommunity, { loading: unsuspending }] = useUnsuspendCommunity();
  const busy = suspending || unsuspending;

  // Decide suspend vs unsuspend when the dialog opens and keep it until it closes,
  // so the copy doesn't flip mid-close when the refetched state arrives. A reason
  // typed for one community must never be submitted against the next one.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const [lifting, setLifting] = useState(false);
  const openKey = open && community ? community.id : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    if (openKey) {
      setLifting(community?.isSuspended === true);
      setReason("");
      setError(null);
    }
  }

  if (!community) return null;

  const name = community.name;

  const handleConfirm = async () => {
    setError(null);
    try {
      if (lifting) {
        const result = await unsuspendCommunity({
          variables: { input: { communityId: community.id } },
        });
        // errorPolicy "all" resolves a refusal instead of rejecting — check it.
        throwIfGraphQLErrors(result, "UnsuspendCommunity");
        if (!result.data?.unsuspendCommunity?.success) {
          throw new Error(result.data?.unsuspendCommunity?.message || t("communities.unsuspendFailed"));
        }
        toast({
          title: t("communities.communityUnsuspended"),
          description: t("communities.communityUnsuspendedDesc", { name }),
        });
      } else {
        const trimmed = reason.trim();
        const result = await suspendCommunity({
          variables: { input: { communityId: community.id, ...(trimmed ? { reason: trimmed } : {}) } },
        });
        throwIfGraphQLErrors(result, "SuspendCommunity");
        if (!result.data?.suspendCommunity?.success) {
          throw new Error(result.data?.suspendCommunity?.message || t("communities.suspendFailed"));
        }
        toast({
          title: t("communities.communitySuspended"),
          description: t("communities.communitySuspendedDesc", { name }),
        });
      }
      onOpenChange(false);
      await onChanged();
    } catch (err) {
      const fallback = lifting ? t("communities.unsuspendFailed") : t("communities.suspendFailed");
      const message = friendlyErrorMessage(err, fallback);
      setError(message);
      toast({ title: fallback, description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lifting ? t("communities.unsuspendCommunity") : t("communities.suspendCommunity")}
          </DialogTitle>
          <DialogDescription>
            {lifting
              ? t("communities.unsuspendConfirm", { name })
              : t("communities.suspendConfirm", { name })}
          </DialogDescription>
        </DialogHeader>

        {!lifting && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("communities.suspendEffect")}</p>
            <Label htmlFor="suspend-community-reason">{t("communities.suspendReasonOptional")}</Label>
            <Textarea
              id="suspend-community-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("communities.suspendReasonPlaceholder")}
              maxLength={REASON_MAX_LENGTH}
              rows={3}
              disabled={busy}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={lifting ? "default" : "destructive"}
            onClick={() => void handleConfirm()}
            disabled={busy}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {lifting ? t("communities.unsuspend") : t("communities.suspend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
