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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminSuspendCircle,
  useAdminUnsuspendCircle,
  useAdminDissolveCircle,
  type Circle,
} from "@/hooks/admin";

/**
 * The narrow platform override.
 *
 * Suspending or dissolving a circle is an EXCEPTIONAL moderation action
 * reserved for illegality — not a management tool, and never a way to settle a
 * circle's internal disputes. Keeping it narrow is what preserves the
 * neutrality the whole self-governance model buys: a platform that supplies
 * voting machinery is in a far better position than one that decides who
 * belongs, but only for as long as it actually cannot decide.
 *
 * So the UI is deliberately unfriendly. Every action demands a written reason
 * (the API requires one for suspend and dissolve), the copy says what the
 * action is for, and dissolving — which is terminal — additionally requires
 * typing the circle's name.
 *
 * Note what is NOT here, and cannot be: there is no rpc to add or remove a
 * member, or to open, vote on or override a motion. `CircleAdminService` has
 * none, deliberately.
 */

export type CircleModerationAction = "SUSPEND" | "UNSUSPEND" | "DISSOLVE";

interface CircleModerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circle: Circle | null;
  action: CircleModerationAction;
}

export function CircleModerationDialog({
  open,
  onOpenChange,
  circle,
  action,
}: CircleModerationDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");

  const [suspend, { loading: suspending }] = useAdminSuspendCircle();
  const [unsuspend, { loading: unsuspending }] = useAdminUnsuspendCircle();
  const [dissolve, { loading: dissolving }] = useAdminDissolveCircle();

  useEffect(() => {
    if (!open) return;
    setReason("");
    setConfirmName("");
  }, [open, action, circle?.id]);

  const loading = suspending || unsuspending || dissolving;
  // Reason is required by the schema for suspend and dissolve (`String!`), and
  // optional for unsuspend — but an unexplained reinstatement is still worth
  // discouraging, so it is merely not blocking.
  const reasonRequired = action !== "UNSUSPEND";
  const nameConfirmed =
    action !== "DISSOLVE" || confirmName.trim() === (circle?.name ?? "").trim();
  const submitDisabled =
    loading ||
    !circle ||
    (reasonRequired && !reason.trim()) ||
    !nameConfirmed;

  const handleSubmit = async () => {
    if (!circle) return;
    try {
      if (action === "SUSPEND") {
        await suspend({ variables: { circleId: circle.id, reason: reason.trim() } });
      } else if (action === "UNSUSPEND") {
        await unsuspend({
          variables: { circleId: circle.id, reason: reason.trim() || undefined },
        });
      } else {
        await dissolve({ variables: { circleId: circle.id, reason: reason.trim() } });
      }
      toast({
        title: t("common.save"),
        description: t(`circles.moderation.${action}.success`),
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t(`circles.moderation.${action}.error`)),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(`circles.moderation.${action}.title`)}</DialogTitle>
          <DialogDescription>
            {t(`circles.moderation.${action}.description`, { name: circle?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        {action !== "UNSUSPEND" && (
          <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
            <p className="text-sm text-foreground">{t("circles.moderation.warning")}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="circle-moderation-reason">
              {t("circles.moderation.reason")}
              {reasonRequired ? " *" : ""}
            </Label>
            <Textarea
              id="circle-moderation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("circles.moderation.reasonPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("circles.moderation.reasonHint")}
            </p>
          </div>

          {action === "DISSOLVE" && (
            <div className="space-y-2">
              <Label htmlFor="circle-moderation-confirm">
                {t("circles.moderation.confirmName", { name: circle?.name ?? "" })}
              </Label>
              <Input
                id="circle-moderation-confirm"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={action === "UNSUSPEND" ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={submitDisabled}
          >
            {t(`circles.moderation.${action}.action`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
