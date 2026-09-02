import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { EntitlementSummary } from "@/components/circle/entitlements";
import { PlanEditorDialog } from "@/components/circle/PlanEditorDialog";
import { PlanPricingDialog } from "@/components/circle/PlanPricingDialog";
import { PlanEntitlementsDialog } from "@/components/circle/PlanEntitlementsDialog";
import { formatMinorUnits } from "@/lib/money";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { Coins, Layers, Pencil, Plus, Power } from "lucide-react";
import {
  useAdminCirclePlans,
  useAdminDeactivateCirclePlan,
  type CirclePlan,
} from "@/hooks/admin";

/**
 * The circle plan catalogue — the admin-created tier ladder.
 *
 * There is no fixed set of tiers and no hardcoded tier name anywhere in this
 * console. An admin creates as many as they want, names them freely, prices
 * each one PER CURRENCY AND PER BILLING PERIOD, and picks its entitlement
 * bundle. "Free" is a plan like any other (priced at zero, not absent), which
 * is why exactly one plan per owner kind carries the `isDefault` flag.
 *
 * Deactivating a tier does NOT touch the circles already on it: a subscription
 * snapshots its entitlements at purchase and has no FK back to the plan, so
 * editing or retiring a tier can never silently reduce what a circle already
 * has. That is also why the catalogue defaults to showing inactive plans.
 *
 * MONEY: every amount below is INTEGER minor units on the wire; `÷100` happens
 * only inside `formatMinorUnits`, at the moment of display.
 */
export default function CirclePlans() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [includeInactive, setIncludeInactive] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [entitlementsOpen, setEntitlementsOpen] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useAdminCirclePlans({ includeInactive });
  const [deactivatePlan] = useAdminDeactivateCirclePlan();

  const plans = useMemo(() => {
    const list = data?.adminCirclePlans ?? [];
    // Sort by the admin-chosen ladder order, then name — the API does not
    // promise an order and the ladder is the point of this screen.
    return [...list].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }, [data]);

  // Re-read the live plan out of the query result rather than holding a copy in
  // state: the dialogs mutate it and `refetchQueries` brings a fresh one back.
  const activePlan = plans.find((p) => p.id === activePlanId) ?? null;

  const openEditor = (plan: CirclePlan | null) => {
    setActivePlanId(plan?.id ?? null);
    setEditorOpen(true);
  };

  const openPricing = (plan: CirclePlan) => {
    setActivePlanId(plan.id);
    setPricingOpen(true);
  };

  const openEntitlements = (plan: CirclePlan) => {
    setActivePlanId(plan.id);
    setEntitlementsOpen(true);
  };

  const handleDeactivate = async (plan: CirclePlan) => {
    if (!window.confirm(t("circles.plans.deactivateConfirm", { name: plan.name }))) return;
    try {
      await deactivatePlan({ variables: { planId: plan.id } });
      toast({
        title: t("common.save"),
        description: t("circles.plans.deactivateSuccess"),
      });
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("circles.plans.deactivateError")),
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {t("circles.plans.title")}
            </h1>
            <p className="text-muted-foreground">{t("circles.plans.subtitle")}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
              <Label htmlFor="include-inactive" className="text-sm">
                {t("circles.plans.showInactive")}
              </Label>
            </div>
            <Button onClick={() => openEditor(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("circles.plans.create")}
            </Button>
          </div>
        </div>

        {/* Catalogue */}
        {loading && plans.length === 0 ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState
            message={friendlyErrorMessage(error, t("circles.plans.loadError"))}
            onRetry={() => refetch()}
          />
        ) : plans.length === 0 ? (
          <EmptyState
            title={t("circles.plans.emptyTitle")}
            message={t("circles.plans.emptyHint")}
            action={
              <Button onClick={() => openEditor(null)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("circles.plans.create")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.isActive ? "" : "opacity-70"}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{plan.name}</CardTitle>
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        {plan.code}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {plan.isDefault && (
                        <Badge variant="secondary">{t("circles.plans.default")}</Badge>
                      )}
                      <Badge variant={plan.isActive ? "default" : "outline"}>
                        {plan.isActive
                          ? t("circles.plans.active")
                          : t("circles.plans.inactive")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  {/* Prices — per currency AND per billing period. */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("circles.plans.prices")}
                    </p>
                    {plan.prices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("circles.plans.noPrices")}
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {[...plan.prices]
                          .sort(
                            (a, b) =>
                              a.currency.localeCompare(b.currency) ||
                              a.interval.localeCompare(b.interval),
                          )
                          .map((price) => (
                            <li
                              key={price.id || `${price.currency}:${price.interval}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {t(`circles.interval.${price.interval}`, {
                                  defaultValue: price.interval,
                                })}
                              </span>
                              <span className="font-medium">
                                {formatMinorUnits(price.amountMinor, price.currency)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>

                  {/* Entitlements — what a circle on this tier MAY DO. */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("circles.plans.entitlements")}
                    </p>
                    <EntitlementSummary
                      entitlements={plan.entitlements}
                      emptyLabel={t("circles.plans.noEntitlements")}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => openEditor(plan)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {t("common.edit")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openPricing(plan)}>
                      <Coins className="mr-1.5 h-3.5 w-3.5" />
                      {t("circles.plans.pricing")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEntitlements(plan)}
                    >
                      <Layers className="mr-1.5 h-3.5 w-3.5" />
                      {t("circles.plans.entitlements")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!plan.isActive}
                      onClick={() => handleDeactivate(plan)}
                    >
                      <Power className="mr-1.5 h-3.5 w-3.5" />
                      {t("circles.plans.deactivate")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("circles.plans.version", { version: plan.version })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PlanEditorDialog open={editorOpen} onOpenChange={setEditorOpen} plan={activePlan} />
        <PlanPricingDialog
          open={pricingOpen}
          onOpenChange={setPricingOpen}
          plan={activePlan}
        />
        <PlanEntitlementsDialog
          open={entitlementsOpen}
          onOpenChange={setEntitlementsOpen}
          plan={activePlan}
        />
      </div>
    </AdminLayout>
  );
}
