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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  DEFAULT_ENTITLEMENT_KIND,
  ENTITLEMENT_KEYS,
  findEntitlement,
  useEntitlementLabel,
} from "@/components/circle/entitlements";
import {
  useAdminSetCirclePlanEntitlement,
  type CircleEntitlementKey,
  type CircleEntitlementValueKind,
  type CirclePlan,
} from "@/hooks/admin";

/**
 * The entitlement bundle for one tier — what a circle on this plan MAY DO.
 *
 * Two kinds of entitlement, rendered accordingly: an INT limit gets a number
 * input, a BOOL capability gets a toggle.
 *
 * ── THE UNLIMITED RULE ──────────────────────────────────────────────────────
 * On an INT entitlement `hasIntValue: false` means UNLIMITED, not zero. The
 * editor therefore leads with an explicit "Unlimited" switch and only reveals
 * the number input when it is off, so an admin can never accidentally send
 * `hasIntValue: false` while thinking they typed a cap of 0 — or leave the flag
 * unset and silently grant unlimited.
 *
 * Each row saves on its own because the API sets ONE key per call
 * (`adminSetCirclePlanEntitlement`). Batching them into a single "Save all"
 * button would be a lie about atomicity: a half-failed batch would leave the
 * tier partly edited with no way to tell which half.
 */

interface PlanEntitlementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: CirclePlan | null;
}

interface EntitlementDraft {
  valueKind: CircleEntitlementValueKind;
  /** false ⇒ UNLIMITED (INT only). */
  hasIntValue: boolean;
  intValue: string;
  boolValue: boolean;
  /** Whether the plan already carries this key — drives the row's badge. */
  configured: boolean;
}

type DraftMap = Record<string, EntitlementDraft>;

function buildDrafts(plan: CirclePlan | null): DraftMap {
  const drafts: DraftMap = {};
  for (const key of ENTITLEMENT_KEYS) {
    const existing = findEntitlement(plan?.entitlements, key);
    drafts[key] = {
      valueKind:
        (existing?.valueKind as CircleEntitlementValueKind) ??
        DEFAULT_ENTITLEMENT_KIND[key],
      // An unconfigured INT key defaults to a LIMIT rather than unlimited: the
      // admin has to opt into unlimited, which is the safer default to type.
      hasIntValue: existing ? existing.hasIntValue : true,
      intValue: existing?.hasIntValue ? String(existing.intValue) : "",
      boolValue: existing?.boolValue ?? false,
      configured: !!existing,
    };
  }
  return drafts;
}

export function PlanEntitlementsDialog({
  open,
  onOpenChange,
  plan,
}: PlanEntitlementsDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const label = useEntitlementLabel();

  const [drafts, setDrafts] = useState<DraftMap>(() => buildDrafts(null));
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [setEntitlement] = useAdminSetCirclePlanEntitlement();

  // Re-seed on open (and whenever the plan refetches after a save) so the rows
  // always reflect what the server actually stored.
  useEffect(() => {
    if (open) setDrafts(buildDrafts(plan));
  }, [open, plan]);

  const patch = (key: string, changes: Partial<EntitlementDraft>) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...changes } }));

  const handleSave = async (key: CircleEntitlementKey) => {
    if (!plan) return;
    const draft = drafts[key];
    const isInt = draft.valueKind === "INT";
    const intValue = isInt && draft.hasIntValue ? Number(draft.intValue) : undefined;
    if (isInt && draft.hasIntValue && (!Number.isFinite(intValue) || (intValue as number) < 0)) {
      toast({
        title: t("common.errorTitle"),
        description: t("circles.entitlements.invalidLimit"),
        variant: "destructive",
      });
      return;
    }
    setSavingKey(key);
    try {
      await setEntitlement({
        variables: {
          input: {
            planId: plan.id,
            key,
            valueKind: draft.valueKind,
            intValue: intValue != null ? Math.trunc(intValue) : undefined,
            // Sent explicitly, always: false is UNLIMITED, not zero, and
            // omitting it on an INT key silently grants unlimited.
            hasIntValue: isInt ? draft.hasIntValue : false,
            boolValue: isInt ? false : draft.boolValue,
          },
        },
      });
      toast({
        title: t("common.save"),
        description: t("circles.entitlements.saveSuccess", { key: label(key) }),
      });
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("circles.entitlements.saveError")),
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("circles.entitlements.title", { plan: plan?.name ?? "" })}
          </DialogTitle>
          <DialogDescription>{t("circles.entitlements.hint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {ENTITLEMENT_KEYS.map((key) => {
            const draft = drafts[key];
            if (!draft) return null;
            const isInt = draft.valueKind === "INT";
            return (
              <div key={key} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{label(key)}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key}</p>
                  </div>
                  {!draft.configured && (
                    <span className="text-xs text-muted-foreground">
                      {t("circles.entitlements.notConfigured")}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("circles.entitlements.valueKind")}</Label>
                    <Select
                      value={draft.valueKind}
                      onValueChange={(v) =>
                        patch(key, { valueKind: v as CircleEntitlementValueKind })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="INT">
                          {t("circles.entitlements.kindInt")}
                        </SelectItem>
                        <SelectItem value="BOOL">
                          {t("circles.entitlements.kindBool")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isInt ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border p-2">
                        <Label htmlFor={`unlimited-${key}`} className="text-sm">
                          {t("circles.entitlements.unlimited")}
                        </Label>
                        <Switch
                          id={`unlimited-${key}`}
                          checked={!draft.hasIntValue}
                          onCheckedChange={(checked) =>
                            patch(key, { hasIntValue: !checked })
                          }
                        />
                      </div>
                      {draft.hasIntValue && (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={draft.intValue}
                          onChange={(e) => patch(key, { intValue: e.target.value })}
                          placeholder={t("circles.entitlements.limitPlaceholder")}
                          aria-label={t("circles.entitlements.limitFor", {
                            key: label(key),
                          })}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border p-2">
                      <Label htmlFor={`bool-${key}`} className="text-sm">
                        {t("circles.entitlements.enabled")}
                      </Label>
                      <Switch
                        id={`bool-${key}`}
                        checked={draft.boolValue}
                        onCheckedChange={(checked) => patch(key, { boolValue: checked })}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {isInt && !draft.hasIntValue
                      ? t("circles.entitlements.unlimitedHint")
                      : t("circles.entitlements.rowHint")}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!plan || savingKey === key}
                    onClick={() => handleSave(key)}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
