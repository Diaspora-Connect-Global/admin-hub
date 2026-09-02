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
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminForceExpireCircleSubscription,
  type CircleSubscription,
} from "@/hooks/admin";

/**
 * Force-expire a granted subscription.
 *
 * This drops the circle back to the default free plan's caps. Nothing is
 * evicted: existing members and projects are KEPT and only new ones are
 * refused — the platform has no eviction path for a downgrade, on purpose.
 * The dialog says so, because "expire" reads like "delete" if it does not.
 */

interface ForceExpireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: CircleSubscription | null;
}

export function ForceExpireDialog({
  open,
  onOpenChange,
  subscription,
}: ForceExpireDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reason, setReason] = useState("");

  const [forceExpire, { loading }] = useAdminForceExpireCircleSubscription();

  useEffect(() => {
    if (open) setReason("");
  }, [open, subscription?.id]);

  const handleSubmit = async () => {
    if (!subscription || !reason.trim()) return;
    try {
      await forceExpire({
        variables: { subscriptionId: subscription.id, reason: reason.trim() },
      });
      toast({
        title: t("common.save"),
        description: t("circles.subscriptions.expireSuccess"),
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("circles.subscriptions.expireError")),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("circles.subscriptions.expire")}</DialogTitle>
          <DialogDescription>
            {t("circles.subscriptions.expireHint", {
              plan: subscription?.planCode ?? "—",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="expire-reason">{t("circles.subscriptions.reason")} *</Label>
          <Textarea
            id="expire-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("circles.subscriptions.reasonPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("circles.subscriptions.expireNoEviction")}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || !subscription || !reason.trim()}
          >
            {t("circles.subscriptions.expireAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
