import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Loader2 } from "lucide-react";
import {
  useAdminSuspendCircle,
  useAdminUnsuspendCircle,
  useAdminDissolveCircle,
  type AdminCircle,
} from "@/hooks/admin";
import { displayErrorMessage, throwIfGraphQLErrors } from "@/lib/graphqlErrors";

export type CircleAction = "suspend" | "unsuspend" | "dissolve";

interface CircleActionDialogsProps {
  action: CircleAction | null;
  circle: AdminCircle | null;
  onClose: () => void;
  /** Called with an already-translated confirmation message, only after the server confirmed the act. */
  onSuccess: (message: string) => void | Promise<void>;
  /**
   * Called when the act was refused or failed. The error's message is already
   * admin-readable and id-free (see `displayErrorMessage`); it is also shown
   * inside the dialog, which stays open.
   */
  onError: (error: unknown) => void;
}

/**
 * The three platform acts a circle can be subjected to, each behind its own
 * confirmation.
 *
 * ── WHY THE REASON IS A REQUIRED FIELD, NOT AN OPTIONAL NOTE ────────────────
 * Everything else that happens to a circle happens because the circle voted for
 * it: a removed member has a `removedByMotionId`, a closed project has a
 * motion, and the audit trail carries the tally. A platform suspension or
 * dissolution has none of that — no proposer, no votes, no quorum. The written
 * reason is therefore the ENTIRE record of why the platform acted, and the one
 * thing that answers a later complaint that we ejected a circle rather than its
 * members voting to. `adminSuspendCircle` and `adminDissolveCircle` both take
 * `reason: String!`, and the confirm button here stays disabled until it is
 * non-blank so an admin cannot paper over it with a space.
 *
 * Unsuspend takes an optional reason: nothing is being taken away, and
 * requiring justification to STOP penalising someone gets the incentive
 * backwards.
 *
 * ── A RESOLVED MUTATION IS NOT A SUCCESSFUL ONE ─────────────────────────────
 * The admin Apollo client uses `errorPolicy: "all"`, so a refused act (no
 * permission, circle already dissolved, circle-service down) RESOLVES with
 * `data: null` and an error instead of rejecting. Every act therefore goes
 * through `throwIfGraphQLErrors` and must return the circle; anything else is a
 * failure, and the success toast is reached only after both checks pass.
 *
 * ── SCOPE ──────────────────────────────────────────────────────────────────
 * These acts apply to the whole circle and are reserved for illegality. There
 * is deliberately no per-member or per-motion equivalent — see the note at the
 * bottom of hooks/admin/useCircles.ts.
 */
export function CircleActionDialogs({
  action,
  circle,
  onClose,
  onSuccess,
  onError,
}: CircleActionDialogsProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [suspendCircle, { loading: suspending }] = useAdminSuspendCircle();
  const [unsuspendCircle, { loading: unsuspending }] = useAdminUnsuspendCircle();
  const [dissolveCircle, { loading: dissolving }] = useAdminDissolveCircle();

  // Clear between openings — a reason typed for one circle must never be
  // submitted against the next one.
  useEffect(() => {
    setReason("");
    setError(null);
  }, [action, circle?.id]);

  const busy = suspending || unsuspending || dissolving;
  const trimmedReason = reason.trim();
  const reasonRequired = action === "suspend" || action === "dissolve";
  const canConfirm = !busy && (!reasonRequired || trimmedReason.length > 0);

  if (!action || !circle) return null;

  /** Runs the act and returns the success message, or throws when the server did not confirm it. */
  const perform = async (): Promise<string> => {
    if (action === "suspend") {
      const result = await suspendCircle({ variables: { circleId: circle.id, reason: trimmedReason } });
      throwIfGraphQLErrors(result, "AdminSuspendCircle");
      if (!result.data?.adminSuspendCircle) throw new Error(t("circles.suspendFailed"));
      return t("circles.suspended", { name: circle.name });
    }
    if (action === "unsuspend") {
      const result = await unsuspendCircle({
        variables: { circleId: circle.id, reason: trimmedReason || undefined },
      });
      throwIfGraphQLErrors(result, "AdminUnsuspendCircle");
      if (!result.data?.adminUnsuspendCircle) throw new Error(t("circles.unsuspendFailed"));
      return t("circles.unsuspended", { name: circle.name });
    }
    const result = await dissolveCircle({ variables: { circleId: circle.id, reason: trimmedReason } });
    throwIfGraphQLErrors(result, "AdminDissolveCircle");
    if (!result.data?.adminDissolveCircle) throw new Error(t("circles.dissolveFailed"));
    return t("circles.dissolved", { name: circle.name });
  };

  const handleConfirm = async () => {
    setError(null);
    let successMessage: string;
    try {
      successMessage = await perform();
    } catch (e) {
      const message = displayErrorMessage(e, copy.failed);
      setError(message);
      onError(new Error(message));
      return;
    }
    onClose();
    try {
      await onSuccess(successMessage);
    } catch (e) {
      // The act itself succeeded; only the follow-up re-read failed.
      onError(new Error(displayErrorMessage(e, t("common.errorLoading"))));
    }
  };

  const copy = {
    suspend: {
      title: t("circles.suspendTitle", { name: circle.name }),
      description: t("circles.suspendDescription"),
      confirm: t("circles.suspend"),
      failed: t("circles.suspendFailed"),
      destructive: false,
    },
    unsuspend: {
      title: t("circles.unsuspendTitle", { name: circle.name }),
      description: t("circles.unsuspendDescription"),
      confirm: t("circles.unsuspend"),
      failed: t("circles.unsuspendFailed"),
      destructive: false,
    },
    dissolve: {
      title: t("circles.dissolveTitle", { name: circle.name }),
      description: t("circles.dissolveDescription"),
      confirm: t("circles.dissolve"),
      failed: t("circles.dissolveFailed"),
      destructive: true,
    },
  }[action];

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="circle-action-reason">
            {reasonRequired ? t("circles.reasonRequired") : t("circles.reasonOptional")}
          </Label>
          <Textarea
            id="circle-action-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("circles.reasonPlaceholder")}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {reasonRequired ? t("circles.reasonHelp") : t("circles.reasonOptionalHelp")}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={copy.destructive ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
