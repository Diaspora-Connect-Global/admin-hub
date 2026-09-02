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
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminCreateCirclePlan,
  useAdminUpdateCirclePlan,
  type CirclePlan,
} from "@/hooks/admin";

/**
 * Create / edit one tier in the circle plan ladder.
 *
 * Tiers are entirely admin-defined: there is no fixed number of them and no
 * hardcoded name anywhere in this console. `code` is the stable machine
 * identifier and is immutable — `UpdateCirclePlanInput` has no `code` field —
 * so it is only editable while creating.
 *
 * Prices and entitlements are NOT set here. Both are per-row operations on the
 * backend (`adminSetCirclePlanPrice` sets one currency+interval,
 * `adminSetCirclePlanEntitlement` sets one key), so each gets its own dialog
 * rather than being faked as one big save that could half-succeed.
 */

interface PlanEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null ⇒ create mode. */
  plan: CirclePlan | null;
}

interface PlanForm {
  code: string;
  name: string;
  description: string;
  sortOrder: string;
}

const emptyForm: PlanForm = { code: "", name: "", description: "", sortOrder: "" };

function parseIntOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

export function PlanEditorDialog({ open, onOpenChange, plan }: PlanEditorDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState<PlanForm>(emptyForm);

  const [createPlan, { loading: creating }] = useAdminCreateCirclePlan();
  const [updatePlan, { loading: updating }] = useAdminUpdateCirclePlan();

  // Re-seed whenever the dialog opens so a cancelled edit never leaks into the
  // next one.
  useEffect(() => {
    if (!open) return;
    setForm(
      plan
        ? {
            code: plan.code,
            name: plan.name,
            description: plan.description ?? "",
            sortOrder: plan.sortOrder != null ? String(plan.sortOrder) : "",
          }
        : emptyForm,
    );
  }, [open, plan]);

  const handleSubmit = async () => {
    try {
      if (plan) {
        await updatePlan({
          variables: {
            input: {
              planId: plan.id,
              name: form.name.trim() || undefined,
              description: form.description.trim() || undefined,
              sortOrder: parseIntOrUndefined(form.sortOrder),
            },
          },
        });
        toast({
          title: t("common.save"),
          description: t("circles.plans.updateSuccess"),
        });
      } else {
        await createPlan({
          variables: {
            input: {
              code: form.code.trim(),
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              // Only CIRCLE exists in v1; the subscription tables are keyed on
              // (owner_type, owner_id) so other owners can arrive later.
              ownerKind: "CIRCLE",
              sortOrder: parseIntOrUndefined(form.sortOrder),
            },
          },
        });
        toast({
          title: t("common.save"),
          description: t("circles.plans.createSuccess"),
        });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const fallback = plan
        ? t("circles.plans.updateError")
        : t("circles.plans.createError");
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, fallback),
        variant: "destructive",
      });
    }
  };

  const submitDisabled =
    creating ||
    updating ||
    !form.name.trim() ||
    (!plan && !form.code.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {plan ? t("circles.plans.edit") : t("circles.plans.create")}
          </DialogTitle>
          <DialogDescription>{t("circles.plans.editorHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="circle-plan-code">{t("circles.plans.code")} *</Label>
            <Input
              id="circle-plan-code"
              value={form.code}
              disabled={!!plan}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="circle_pro"
            />
            <p className="text-xs text-muted-foreground">
              {t("circles.plans.codeHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="circle-plan-name">{t("circles.plans.name")} *</Label>
            <Input
              id="circle-plan-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="circle-plan-description">{t("common.description")}</Label>
            <Textarea
              id="circle-plan-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="circle-plan-sort">{t("circles.plans.sortOrder")}</Label>
            <Input
              id="circle-plan-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {t("circles.plans.sortOrderHint")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitDisabled}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
