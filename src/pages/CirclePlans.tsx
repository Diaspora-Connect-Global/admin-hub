import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  formatMinorUnits,
  majorToMinorUnits,
  minorToMajorInput,
  SUPPORTED_CURRENCIES,
} from "@/lib/money";
import {
  useAdminCirclePlans,
  useAdminCreateCirclePlan,
  useAdminUpdateCirclePlan,
  useAdminDeactivateCirclePlan,
  useAdminSetCirclePlanPrice,
  useAdminSetCirclePlanEntitlement,
  buildEntitlementInput,
  canDeactivatePlan,
  describeEntitlement,
  findEntitlement,
  CIRCLE_ENTITLEMENT_KEYS,
  CIRCLE_PRICE_INTERVALS,
  type AdminCirclePlan,
} from "@/hooks/admin";
import { Plus, MoreHorizontal, Pencil, Tag, SlidersHorizontal, Ban, Loader2 } from "lucide-react";

/** `MAX_MEMBERS` -> its declared value kind. The vocabulary is closed in v1. */
function valueKindFor(key: string): string {
  return CIRCLE_ENTITLEMENT_KEYS.find((e) => e.key === key)?.valueKind ?? "INT";
}

/**
 * The circle plan catalogue.
 *
 * ── MONEY ───────────────────────────────────────────────────────────────────
 * Prices are INTEGER minor units on the wire. The only /100 is `formatMinorUnits`
 * and the only *100 is `majorToMinorUnits`, both in lib/money.ts. Prices are set
 * deliberately PER CURRENCY and are never converted at an FX rate — there is no
 * "set USD and derive GHS" here on purpose, and a yearly price is its own number
 * rather than 12x the monthly one.
 *
 * ── UNLIMITED IS A STATE, NOT AN EMPTY FIELD ────────────────────────────────
 * On an INT entitlement, an absent value means UNLIMITED. If the editor let
 * "unlimited" be expressed by clearing a number box, someone would eventually
 * read that box as 0 and ship a plan capped at nothing. So the editor makes it
 * an explicit radio choice and the payload is built by `buildEntitlementInput`,
 * which sets `hasIntValue` rather than inferring it.
 *
 * ── THE DEFAULT PLAN IS LOAD-BEARING ────────────────────────────────────────
 * Every circle is created with its free subscription in the same transaction as
 * the circle, so the default plan must always exist. Deactivating it would leave
 * new circles with no entitlements at all, which is unrecoverable. The backend
 * refuses it and so does this page — an admin is never shown a live button whose
 * only outcome is an error.
 */
export default function CirclePlans() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [includeInactive, setIncludeInactive] = useState(true);
  const { data, loading, error, refetch } = useAdminCirclePlans(includeInactive);
  const plans = data?.adminCirclePlans ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<AdminCirclePlan | null>(null);
  const [pricePlan, setPricePlan] = useState<AdminCirclePlan | null>(null);
  const [entitlementPlan, setEntitlementPlan] = useState<AdminCirclePlan | null>(null);
  const [deactivatePlan, setDeactivatePlan] = useState<AdminCirclePlan | null>(null);

  const [createForm, setCreateForm] = useState({ code: "", name: "", description: "", sortOrder: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "", sortOrder: "" });
  const [priceForm, setPriceForm] = useState({ currency: "GHS", interval: "MONTH", amount: "" });
  const [entForm, setEntForm] = useState({
    key: CIRCLE_ENTITLEMENT_KEYS[0].key as string,
    unlimited: false,
    intValue: "",
    boolValue: false,
  });

  const [createPlan, { loading: creating }] = useAdminCreateCirclePlan();
  const [updatePlan, { loading: updating }] = useAdminUpdateCirclePlan();
  const [deactivate, { loading: deactivating }] = useAdminDeactivateCirclePlan();
  const [setPrice, { loading: settingPrice }] = useAdminSetCirclePlanPrice();
  const [setEntitlement, { loading: settingEntitlement }] = useAdminSetCirclePlanEntitlement();

  const entitlementLabels = {
    unlimited: t("circles.unlimited"),
    notSet: t("circles.notSet"),
    on: t("common.yes"),
    off: t("common.no"),
  };

  // Seed the edit form from the plan being edited.
  useEffect(() => {
    if (!editPlan) return;
    setEditForm({
      name: editPlan.name ?? "",
      description: editPlan.description ?? "",
      sortOrder: String(editPlan.sortOrder ?? 0),
    });
  }, [editPlan]);

  /**
   * Seed the price form from whatever is already stored for the selected
   * (currency, interval), so opening the dialog on an existing price shows that
   * price rather than an empty box that would read as "free".
   */
  useEffect(() => {
    if (!pricePlan) return;
    const existing = pricePlan.prices.find(
      (p) => p.currency === priceForm.currency && p.interval === priceForm.interval,
    );
    setPriceForm((f) => ({
      ...f,
      amount: existing ? minorToMajorInput(existing.amountMinor) : "",
    }));
    // Intentionally keyed on the selection, not on `priceForm.amount` — the
    // functional update means the amount the admin is typing is not a dep.
  }, [pricePlan, priceForm.currency, priceForm.interval]);

  /** Seed the entitlement form from the plan's current value for that key. */
  useEffect(() => {
    if (!entitlementPlan) return;
    const current = findEntitlement(entitlementPlan, entForm.key);
    const kind = valueKindFor(entForm.key);
    setEntForm((f) => ({
      ...f,
      // No stored row yet: default an INT key to a limit rather than to
      // unlimited, because unlimited is the more consequential accident.
      unlimited: kind === "INT" ? current?.hasIntValue === false : false,
      intValue:
        kind === "INT" && current?.hasIntValue ? String(current.intValue) : "",
      boolValue: kind === "BOOL" ? !!current?.boolValue : false,
    }));
    // Keyed on the plan and the selected key only; the values being edited are
    // set functionally and so are deliberately not dependencies.
  }, [entitlementPlan, entForm.key]);

  const onError = (e: unknown) =>
    toast({
      title: t("common.errorTitle"),
      description: friendlyErrorMessage(e),
      variant: "destructive",
    });

  const handleCreate = async () => {
    if (!createForm.code.trim() || !createForm.name.trim()) return;
    try {
      await createPlan({
        variables: {
          input: {
            code: createForm.code.trim(),
            name: createForm.name.trim(),
            description: createForm.description.trim() || undefined,
            sortOrder: createForm.sortOrder ? Number(createForm.sortOrder) : undefined,
          },
        },
      });
      toast({ title: t("common.success"), description: t("circlePlans.created") });
      setCreateOpen(false);
      setCreateForm({ code: "", name: "", description: "", sortOrder: "" });
      await refetch();
    } catch (e) {
      onError(e);
    }
  };

  const handleUpdate = async () => {
    if (!editPlan) return;
    try {
      await updatePlan({
        variables: {
          input: {
            planId: editPlan.id,
            name: editForm.name.trim() || undefined,
            description: editForm.description.trim() || undefined,
            sortOrder: editForm.sortOrder ? Number(editForm.sortOrder) : undefined,
          },
        },
      });
      toast({ title: t("common.success"), description: t("circlePlans.updated") });
      setEditPlan(null);
      await refetch();
    } catch (e) {
      onError(e);
    }
  };

  const handleSetPrice = async () => {
    if (!pricePlan) return;
    // Reject anything that is not a plain non-negative 2dp amount rather than
    // silently sending 0 — a price accidentally set to zero gives the plan away.
    const amountMinor = majorToMinorUnits(priceForm.amount);
    if (amountMinor === null) {
      toast({
        title: t("common.errorTitle"),
        description: t("circlePlans.invalidAmount"),
        variant: "destructive",
      });
      return;
    }
    try {
      await setPrice({
        variables: {
          input: {
            planId: pricePlan.id,
            currency: priceForm.currency,
            interval: priceForm.interval,
            amountMinor,
          },
        },
      });
      toast({ title: t("common.success"), description: t("circlePlans.priceSaved") });
      setPricePlan(null);
      await refetch();
    } catch (e) {
      onError(e);
    }
  };

  const handleSetEntitlement = async () => {
    if (!entitlementPlan) return;
    const kind = valueKindFor(entForm.key);
    const input = buildEntitlementInput({
      planId: entitlementPlan.id,
      key: entForm.key,
      valueKind: kind,
      unlimited: entForm.unlimited,
      intValue: entForm.intValue === "" ? null : Number(entForm.intValue),
      boolValue: entForm.boolValue,
    });
    if (!input) {
      toast({
        title: t("common.errorTitle"),
        description: t("circlePlans.invalidLimit"),
        variant: "destructive",
      });
      return;
    }
    try {
      await setEntitlement({ variables: { input } });
      toast({ title: t("common.success"), description: t("circlePlans.entitlementSaved") });
      setEntitlementPlan(null);
      await refetch();
    } catch (e) {
      onError(e);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatePlan || !canDeactivatePlan(deactivatePlan)) return;
    try {
      await deactivate({ variables: { planId: deactivatePlan.id } });
      toast({ title: t("common.success"), description: t("circlePlans.deactivated") });
      setDeactivatePlan(null);
      await refetch();
    } catch (e) {
      onError(e);
    }
  };

  const entKind = valueKindFor(entForm.key);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("circlePlans.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("circlePlans.subtitle")}</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("circlePlans.newPlan")}
          </Button>
        </div>

        <label className="flex w-fit items-center gap-2 text-sm">
          <Checkbox
            checked={includeInactive}
            onCheckedChange={(c) => setIncludeInactive(c === true)}
          />
          {t("circlePlans.includeInactive")}
        </label>

        {error ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-destructive">
              {friendlyErrorMessage(error)}
            </CardContent>
          </Card>
        ) : loading && plans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </CardContent>
          </Card>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("circlePlans.empty")}
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {plan.name}
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {plan.code}
                    </Badge>
                    {plan.isDefault && (
                      <StatusBadge variant="info">{t("circlePlans.default")}</StatusBadge>
                    )}
                    <StatusBadge variant={plan.isActive ? "active" : "inactive"}>
                      {plan.isActive ? t("circlePlans.active") : t("circlePlans.inactive")}
                    </StatusBadge>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description || t("circlePlans.noDescription")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("circlePlans.sortOrder")}: {plan.sortOrder} · v{plan.version}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditPlan(plan)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("circlePlans.editPlan")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPriceForm({ currency: "GHS", interval: "MONTH", amount: "" });
                        setPricePlan(plan);
                      }}
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      {t("circlePlans.setPrice")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEntForm((f) => ({ ...f, key: CIRCLE_ENTITLEMENT_KEYS[0].key }));
                        setEntitlementPlan(plan);
                      }}
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      {t("circlePlans.setEntitlement")}
                    </DropdownMenuItem>
                    {/* The default plan can never be deactivated — the item is
                        disabled with the reason rather than hidden, so the rule
                        is discoverable instead of looking like a missing feature. */}
                    {canDeactivatePlan(plan) ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeactivatePlan(plan)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        {t("circlePlans.deactivate")}
                      </DropdownMenuItem>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <DropdownMenuItem disabled>
                              <Ban className="mr-2 h-4 w-4" />
                              {t("circlePlans.deactivate")}
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {plan.isDefault
                            ? t("circlePlans.cannotDeactivateDefault")
                            : t("circlePlans.alreadyInactive")}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-medium">{t("circlePlans.prices")}</h3>
                  {plan.prices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("circlePlans.noPrices")}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("circlePlans.currency")}</TableHead>
                          <TableHead>{t("circlePlans.interval")}</TableHead>
                          <TableHead className="text-right">{t("circlePlans.amount")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.prices.map((price) => (
                          <TableRow key={price.id}>
                            <TableCell className="text-sm">{price.currency}</TableCell>
                            <TableCell className="text-sm">
                              {t(`circlePlans.intervalValue.${price.interval}`, price.interval)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatMinorUnits(price.amountMinor, price.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("circlePlans.pricesPerCurrencyNote")}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">{t("circlePlans.entitlements")}</h3>
                  <div className="grid gap-2">
                    {CIRCLE_ENTITLEMENT_KEYS.map(({ key }) => {
                      const ent = findEntitlement(plan, key);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                        >
                          <span className="text-xs text-muted-foreground">
                            {t(`circlePlans.entitlementKey.${key}`, key)}
                          </span>
                          <span className="text-sm font-medium">
                            {describeEntitlement(ent, entitlementLabels)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("circlePlans.entitlementsSnapshotNote")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && !creating && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("circlePlans.newPlan")}</DialogTitle>
            <DialogDescription>{t("circlePlans.newPlanDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-code">{t("circlePlans.code")}</Label>
              <Input
                id="plan-code"
                value={createForm.code}
                onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="circle_pro"
              />
              <p className="text-xs text-muted-foreground">{t("circlePlans.codeHelp")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-name">{t("circlePlans.name")}</Label>
              <Input
                id="plan-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">{t("circlePlans.description")}</Label>
              <Textarea
                id="plan-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-sort">{t("circlePlans.sortOrder")}</Label>
              <Input
                id="plan-sort"
                type="number"
                value={createForm.sortOrder}
                onChange={(e) => setCreateForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("circlePlans.newPlanNextSteps")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createForm.code.trim() || !createForm.name.trim()}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editPlan} onOpenChange={(o) => !o && !updating && setEditPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("circlePlans.editPlan")}</DialogTitle>
            <DialogDescription>{t("circlePlans.editPlanDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("circlePlans.name")}</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("circlePlans.description")}</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sort">{t("circlePlans.sortOrder")}</Label>
              <Input
                id="edit-sort"
                type="number"
                value={editForm.sortOrder}
                onChange={(e) => setEditForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlan(null)} disabled={updating}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set price */}
      <Dialog open={!!pricePlan} onOpenChange={(o) => !o && !settingPrice && setPricePlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("circlePlans.setPriceTitle", { name: pricePlan?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("circlePlans.setPriceDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("circlePlans.currency")}</Label>
                <Select
                  value={priceForm.currency}
                  onValueChange={(v) => setPriceForm((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("circlePlans.interval")}</Label>
                <Select
                  value={priceForm.interval}
                  onValueChange={(v) => setPriceForm((f) => ({ ...f, interval: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CIRCLE_PRICE_INTERVALS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {t(`circlePlans.intervalValue.${i}`, i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-amount">
                {t("circlePlans.amountIn", { currency: priceForm.currency })}
              </Label>
              <Input
                id="price-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={priceForm.amount}
                onChange={(e) => setPriceForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">{t("circlePlans.amountHelp")}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t("circlePlans.noFxNote")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPricePlan(null)} disabled={settingPrice}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSetPrice} disabled={settingPrice}>
              {settingPrice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set entitlement */}
      <Dialog
        open={!!entitlementPlan}
        onOpenChange={(o) => !o && !settingEntitlement && setEntitlementPlan(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("circlePlans.setEntitlementTitle", { name: entitlementPlan?.name ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("circlePlans.setEntitlementDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("circlePlans.entitlement")}</Label>
              <Select
                value={entForm.key}
                onValueChange={(v) => setEntForm((f) => ({ ...f, key: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIRCLE_ENTITLEMENT_KEYS.map(({ key }) => (
                    <SelectItem key={key} value={key}>
                      {t(`circlePlans.entitlementKey.${key}`, key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {entKind === "BOOL" ? (
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-3">
                <Label htmlFor="ent-bool" className="cursor-pointer">
                  {t(`circlePlans.entitlementKey.${entForm.key}`, entForm.key)}
                </Label>
                <Switch
                  id="ent-bool"
                  checked={entForm.boolValue}
                  onCheckedChange={(v) => setEntForm((f) => ({ ...f, boolValue: v }))}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Unlimited is an explicit choice, never "the box is empty". */}
                <RadioGroup
                  value={entForm.unlimited ? "unlimited" : "limited"}
                  onValueChange={(v) =>
                    setEntForm((f) => ({ ...f, unlimited: v === "unlimited" }))
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="limited" id="ent-limited" />
                    <Label htmlFor="ent-limited" className="cursor-pointer font-normal">
                      {t("circlePlans.limitedTo")}
                    </Label>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="ml-6 w-40"
                    disabled={entForm.unlimited}
                    value={entForm.intValue}
                    onChange={(e) => setEntForm((f) => ({ ...f, intValue: e.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="unlimited" id="ent-unlimited" />
                    <Label htmlFor="ent-unlimited" className="cursor-pointer font-normal">
                      {t("circles.unlimited")}
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">{t("circlePlans.unlimitedHelp")}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEntitlementPlan(null)}
              disabled={settingEntitlement}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSetEntitlement} disabled={settingEntitlement}>
              {settingEntitlement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate */}
      <Dialog
        open={!!deactivatePlan}
        onOpenChange={(o) => !o && !deactivating && setDeactivatePlan(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("circlePlans.deactivateTitle", { name: deactivatePlan?.name ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("circlePlans.deactivateDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivatePlan(null)}
              disabled={deactivating}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("circlePlans.deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
