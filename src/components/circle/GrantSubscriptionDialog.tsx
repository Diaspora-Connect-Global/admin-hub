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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { useAdminGrantCircleSubscription, type CirclePlan } from "@/hooks/admin";

/**
 * Grant a circle a plan.
 *
 * In v1 this is the only route onto a paid tier — circles cannot be charged
 * yet, so an admin grant is how one is conferred (the other route is a
 * CHANGE_PLAN motion resolving to a zero-priced plan, which happens inside the
 * circle and not from here).
 *
 * `expiresAt` is optional: omit it for an open-ended grant. The reason is
 * recorded on the subscription event ledger, so it is worth writing properly.
 */

interface GrantSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: CirclePlan[];
  /** Pre-filled and locked when opened from a circle's own page. */
  circleId?: string;
  /** Shown instead of the raw id when we know the circle's name. */
  circleName?: string;
}

export function GrantSubscriptionDialog({
  open,
  onOpenChange,
  plans,
  circleId,
  circleName,
}: GrantSubscriptionDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [targetCircleId, setTargetCircleId] = useState(circleId ?? "");
  const [planId, setPlanId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [grant, { loading }] = useAdminGrantCircleSubscription();

  useEffect(() => {
    if (!open) return;
    setTargetCircleId(circleId ?? "");
    setPlanId("");
    setReason("");
    setExpiresAt("");
  }, [open, circleId]);

  const handleSubmit = async () => {
    const id = targetCircleId.trim();
    if (!id || !planId) return;
    try {
      await grant({
        variables: {
          input: {
            circleId: id,
            planId,
            reason: reason.trim() || undefined,
            // <input type="datetime-local"> gives a local wall-clock string;
            // the API wants ISO-8601, so convert rather than passing it raw.
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          },
        },
      });
      toast({
        title: t("common.save"),
        description: t("circles.subscriptions.grantSuccess"),
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("circles.subscriptions.grantError")),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("circles.subscriptions.grant")}</DialogTitle>
          <DialogDescription>{t("circles.subscriptions.grantHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grant-circle-id">{t("circles.subscriptions.circleId")} *</Label>
            <Input
              id="grant-circle-id"
              value={targetCircleId}
              disabled={!!circleId}
              onChange={(e) => setTargetCircleId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="font-mono text-sm"
            />
            {circleName && (
              <p className="text-xs text-muted-foreground">{circleName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("circles.subscriptions.plan")} *</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder={t("circles.subscriptions.selectPlan")} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.code})
                    {!plan.isActive ? ` — ${t("circles.plans.inactive")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-expires">{t("circles.subscriptions.expiresAt")}</Label>
            <Input
              id="grant-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("circles.subscriptions.expiresHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-reason">{t("circles.subscriptions.reason")}</Label>
            <Textarea
              id="grant-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("circles.subscriptions.reasonPlaceholder")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !targetCircleId.trim() || !planId}
          >
            {t("circles.subscriptions.grantAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
