import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  SUPPORTED_CURRENCIES,
  formatMinorUnits,
  majorToMinor,
  minorToMajorInput,
} from "@/lib/money";
import {
  useAdminSetCirclePlanPrice,
  type CirclePlan,
  type CirclePriceInterval,
} from "@/hooks/admin";

/**
 * Per-currency, per-billing-period pricing for one tier.
 *
 * A price is set DELIBERATELY per currency and never derived from an FX rate,
 * and a yearly price is its own number rather than 12× the monthly one — so the
 * grid below is the real shape of the data, not a convenience view over a
 * single "price" field.
 *
 * MONEY: the admin types MAJOR units (what a person would say out loud) and
 * `majorToMinor` converts once, here, at the input boundary. Everything sent to
 * and returned from the API is INTEGER minor units. The dialog echoes the exact
 * integer it is about to send so a mistyped amount is visible before saving.
 *
 * There is no "remove a price" mutation on the backend, so a price can be
 * corrected but not deleted — the dialog does not pretend otherwise.
 */

const INTERVALS: CirclePriceInterval[] = ["MONTH", "YEAR", "ONE_TIME", "NONE"];

interface PlanPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: CirclePlan | null;
}

export function PlanPricingDialog({ open, onOpenChange, plan }: PlanPricingDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [currency, setCurrency] = useState<string>(SUPPORTED_CURRENCIES[0]);
  const [interval, setInterval] = useState<CirclePriceInterval>("MONTH");
  const [amountMajor, setAmountMajor] = useState("");

  const [setPrice, { loading: saving }] = useAdminSetCirclePlanPrice();

  /** (currency, interval) → existing price, for the grid and for prefilling. */
  const priceIndex = useMemo(() => {
    const index = new Map<string, number>();
    for (const price of plan?.prices ?? []) {
      index.set(`${price.currency}:${price.interval}`, price.amountMinor);
    }
    return index;
  }, [plan]);

  const amountMinor = majorToMinor(amountMajor);
  const existingMinor = priceIndex.get(`${currency}:${interval}`);

  const selectCell = (nextCurrency: string, nextInterval: CirclePriceInterval) => {
    setCurrency(nextCurrency);
    setInterval(nextInterval);
    const existing = priceIndex.get(`${nextCurrency}:${nextInterval}`);
    setAmountMajor(existing != null ? minorToMajorInput(existing) : "");
  };

  const handleSave = async () => {
    if (!plan || amountMinor == null) return;
    try {
      await setPrice({
        variables: {
          input: {
            planId: plan.id,
            currency,
            interval,
            // Already integer minor units — nothing downstream multiplies again.
            amountMinor,
          },
        },
      });
      toast({
        title: t("common.save"),
        description: t("circles.pricing.saveSuccess"),
      });
      setAmountMajor("");
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("circles.pricing.saveError")),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("circles.pricing.title", { plan: plan?.name ?? "" })}
          </DialogTitle>
          <DialogDescription>{t("circles.pricing.hint")}</DialogDescription>
        </DialogHeader>

        {/* Existing price grid — currency × billing period. */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("circles.pricing.currency")}</TableHead>
                {INTERVALS.map((iv) => (
                  <TableHead key={iv}>{t(`circles.interval.${iv}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUPPORTED_CURRENCIES.map((code) => (
                <TableRow key={code}>
                  <TableCell className="font-medium">{code}</TableCell>
                  {INTERVALS.map((iv) => {
                    const minor = priceIndex.get(`${code}:${iv}`);
                    const selected = currency === code && interval === iv;
                    return (
                      <TableCell key={iv}>
                        <button
                          type="button"
                          onClick={() => selectCell(code, iv)}
                          className={`w-full rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted ${
                            selected ? "bg-muted font-medium" : ""
                          }`}
                          aria-label={t("circles.pricing.editCell", {
                            currency: code,
                            interval: t(`circles.interval.${iv}`),
                          })}
                        >
                          {minor != null ? (
                            formatMinorUnits(minor, code)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Set / correct one price. */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("circles.pricing.currency")}</Label>
            <Select value={currency} onValueChange={(v) => selectCell(v, interval)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {SUPPORTED_CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("circles.pricing.interval")}</Label>
            <Select
              value={interval}
              onValueChange={(v) => selectCell(currency, v as CirclePriceInterval)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {INTERVALS.map((iv) => (
                  <SelectItem key={iv} value={iv}>
                    {t(`circles.interval.${iv}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="circle-price-amount">
              {t("circles.pricing.amountMajor", { currency })}
            </Label>
            <Input
              id="circle-price-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              placeholder="50.00"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          {amountMinor != null ? (
            <p>
              {t("circles.pricing.willSend", {
                minor: amountMinor,
                formatted: formatMinorUnits(amountMinor, currency),
              })}
            </p>
          ) : (
            <p className="text-muted-foreground">{t("circles.pricing.enterAmount")}</p>
          )}
          {existingMinor != null && (
            <p className="mt-1 text-muted-foreground">
              {t("circles.pricing.replaces", {
                formatted: formatMinorUnits(existingMinor, currency),
              })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !plan || amountMinor == null}>
            {t("circles.pricing.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
