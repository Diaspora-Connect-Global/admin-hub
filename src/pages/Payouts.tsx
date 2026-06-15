import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  CheckCircle,
  Star,
  Trash2,
  CreditCard,
  MoreHorizontal,
  Banknote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useListPayoutAccounts,
  useAdminVerifyPayoutAccount,
  useAdminSetPrimaryPayoutAccount,
  useAdminDeletePayoutAccount,
  useRequestPayout,
} from "@/hooks/admin";
import type { PayoutAccount, Payout } from "@/services/networks/graphql/admin";

export default function Payouts() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [userIdInput, setUserIdInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const { data, loading, error } = useListPayoutAccounts(userId);
  const accounts: PayoutAccount[] = data?.adminListPayoutAccounts?.payoutAccounts ?? [];
  const hasLookup = !!userId;

  const [verifyAccount] = useAdminVerifyPayoutAccount(userId);
  const [setPrimaryAccount] = useAdminSetPrimaryPayoutAccount(userId);
  const [deleteAccount] = useAdminDeletePayoutAccount(userId);
  const [requestPayout, { loading: requesting }] = useRequestPayout();

  // --- Verify dialog state ---
  const [verifyTarget, setVerifyTarget] = useState<PayoutAccount | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // --- Destructive confirm state ---
  const [deleteTarget, setDeleteTarget] = useState<PayoutAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- Request Payout dialog state ---
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutVendorId, setPayoutVendorId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(""); // major units, as typed
  const [payoutCurrency, setPayoutCurrency] = useState("USD");
  const [lastPayout, setLastPayout] = useState<Payout | null>(null);
  // Stable idempotency key for the current payout attempt. A retry of the SAME
  // submission (e.g. after a lost response) must reuse this key so escrow-service
  // dedupes it; we only rotate it after a CONFIRMED success.
  const [payoutIdemKey, setPayoutIdemKey] = useState(() => crypto.randomUUID());

  const formatMinorUnits = (minor: number, currency?: string) =>
    // AdminPayout.amount is MINOR units (Int) — divide by 100 to display.
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
    }).format(minor / 100);

  const formatDate = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const handleLookup = () => {
    setUserId(userIdInput.trim() || null);
  };

  const handleVerify = async () => {
    if (!verifyTarget) return;
    setVerifying(true);
    try {
      await verifyAccount({
        variables: {
          payoutAccountId: verifyTarget.id,
          verificationCode: verificationCode.trim(),
        },
      });
      toast({
        title: t("payouts.verifySuccessTitle"),
        description: t("payouts.verifySuccessDesc"),
      });
      setVerifyTarget(null);
      setVerificationCode("");
    } catch (err: unknown) {
      toast({
        title: t("payouts.actionFailed"),
        description: err instanceof Error ? err.message : t("common.errorLoading"),
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSetPrimary = async (account: PayoutAccount) => {
    try {
      await setPrimaryAccount({ variables: { payoutAccountId: account.id } });
      toast({
        title: t("payouts.setPrimarySuccessTitle"),
        description: t("payouts.setPrimarySuccessDesc"),
      });
    } catch (err: unknown) {
      toast({
        title: t("payouts.actionFailed"),
        description: err instanceof Error ? err.message : t("common.errorLoading"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAccount({ variables: { payoutAccountId: deleteTarget.id } });
      toast({
        title: t("payouts.deleteSuccessTitle"),
        description: t("payouts.deleteSuccessDesc"),
      });
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast({
        title: t("payouts.actionFailed"),
        description: err instanceof Error ? err.message : t("common.errorLoading"),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRequestPayout = async () => {
    const major = Number(payoutAmount);
    if (!payoutVendorId.trim() || !Number.isFinite(major) || major <= 0) return;
    // Convert user-entered MAJOR units to MINOR units (Int) for the request,
    // e.g. 12.34 -> 1234. Round to avoid float drift.
    const amountMinor = Math.round(major * 100);
    try {
      const res = await requestPayout({
        variables: {
          input: {
            vendorId: payoutVendorId.trim(),
            amount: amountMinor,
            currency: payoutCurrency.trim().toUpperCase(),
            // Stable across retries of this attempt; rotated only on success below.
            idempotencyKey: payoutIdemKey,
          },
        },
      });
      const payout = res.data?.adminRequestPayout ?? null;
      setLastPayout(payout);
      toast({
        title: t("payouts.requestSuccessTitle"),
        description: t("payouts.requestSuccessDesc"),
      });
      setPayoutVendorId("");
      setPayoutAmount("");
      // Confirmed success → rotate the key so the next payout is a distinct request.
      setPayoutIdemKey(crypto.randomUUID());
    } catch (err: unknown) {
      toast({
        title: t("payouts.actionFailed"),
        description: err instanceof Error ? err.message : t("common.errorLoading"),
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("payouts.title")}</h1>
            <p className="text-muted-foreground">{t("payouts.subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setLastPayout(null);
              setPayoutDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Banknote className="h-4 w-4 mr-2" />
            {t("payouts.requestPayout")}
          </Button>
        </div>

        {/* User lookup */}
        <div className="glass rounded-xl border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5 min-w-[240px]">
              <Label htmlFor="userId">{t("payouts.userId")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userId"
                  placeholder={t("payouts.userIdPlaceholder")}
                  className="pl-10 bg-card border-border"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLookup();
                  }}
                />
              </div>
            </div>
            <Button
              onClick={handleLookup}
              disabled={!userIdInput.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Search className="h-4 w-4 mr-2" />
              {t("payouts.lookup")}
            </Button>
          </div>
        </div>

        {/* Empty (no lookup) */}
        {!hasLookup && (
          <div className="glass rounded-xl border border-dashed border-border p-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("payouts.emptyPrompt")}</p>
          </div>
        )}

        {/* Payout account table */}
        {hasLookup && (
          <div className="glass rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>{t("payouts.identifier")}</TableHead>
                    <TableHead>{t("payouts.provider")}</TableHead>
                    <TableHead>{t("common.type")}</TableHead>
                    <TableHead>{t("payouts.verified")}</TableHead>
                    <TableHead>{t("payouts.primary")}</TableHead>
                    <TableHead>{t("walletLedger.createdAt")}</TableHead>
                    <TableHead className="w-12">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-destructive">
                        {t("payouts.loadError")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!error && loading && accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!error && !loading && accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {t("payouts.noAccounts")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!error &&
                    accounts.map((acct) => (
                      <TableRow key={acct.id} className="border-border">
                        <TableCell className="font-mono text-sm text-foreground">
                          {acct.accountIdentifierMasked ?? "—"}
                        </TableCell>
                        <TableCell className="text-foreground">{acct.provider ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {acct.accountType ?? "—"}
                        </TableCell>
                        <TableCell>
                          {acct.isVerified ? (
                            <Badge
                              variant="outline"
                              className="bg-success/20 text-success border-success/50"
                            >
                              {t("payouts.verified")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-warning/20 text-warning border-warning/50"
                            >
                              {t("payouts.unverified")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {acct.isPrimary ? (
                            <Badge
                              variant="outline"
                              className="bg-info/20 text-info border-info/50"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {t("payouts.primary")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(acct.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={t("payouts.accountActions")}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              {!acct.isVerified && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setVerifyTarget(acct);
                                    setVerificationCode("");
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" /> {t("payouts.verify")}
                                </DropdownMenuItem>
                              )}
                              {!acct.isPrimary && (
                                <DropdownMenuItem onClick={() => handleSetPrimary(acct)}>
                                  <Star className="h-4 w-4 mr-2" /> {t("payouts.setPrimary")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(acct)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Verify dialog */}
        <Dialog
          open={!!verifyTarget}
          onOpenChange={(open) => {
            if (!open) setVerifyTarget(null);
          }}
        >
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{t("payouts.verifyTitle")}</DialogTitle>
              <DialogDescription>
                {t("payouts.verifyDesc")}{" "}
                <span className="font-mono text-xs">
                  {verifyTarget?.accountIdentifierMasked}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">{t("payouts.verificationCode")} *</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t("payouts.verificationCodePlaceholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleVerify}
                disabled={!verificationCode.trim() || verifying}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {verifying ? t("common.loading") : t("payouts.verify")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("payouts.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("payouts.deleteConfirm")}{" "}
                <span className="font-mono text-xs">
                  {deleteTarget?.accountIdentifierMasked}
                </span>
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deleting ? t("common.loading") : t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Request Payout dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{t("payouts.requestTitle")}</DialogTitle>
              <DialogDescription>{t("payouts.requestDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payoutVendorId">{t("payouts.vendorId")} *</Label>
                <Input
                  id="payoutVendorId"
                  value={payoutVendorId}
                  onChange={(e) => setPayoutVendorId(e.target.value)}
                  placeholder={t("payouts.vendorIdPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="payoutAmount">{t("payouts.amountMajor")} *</Label>
                  <Input
                    id="payoutAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payoutCurrency">{t("payouts.currency")} *</Label>
                  <Input
                    id="payoutCurrency"
                    value={payoutCurrency}
                    onChange={(e) => setPayoutCurrency(e.target.value)}
                    maxLength={3}
                    className="uppercase"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("payouts.amountHint")}</p>

              {lastPayout && (
                <div className="rounded-lg border border-success/40 bg-success/10 p-3 space-y-1 text-sm">
                  <p className="font-medium text-foreground">{t("payouts.lastPayout")}</p>
                  <p className="text-muted-foreground font-mono text-xs break-all">
                    {lastPayout.id}
                  </p>
                  <p className="text-foreground">
                    {/* AdminPayout.amount is MINOR units — divide by 100 to display. */}
                    {formatMinorUnits(lastPayout.amount, lastPayout.currency)} ·{" "}
                    <span className="uppercase">{lastPayout.status}</span>
                  </p>
                  {lastPayout.failureReason && (
                    <p className="text-destructive text-xs">{lastPayout.failureReason}</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                {t("common.close")}
              </Button>
              <Button
                onClick={handleRequestPayout}
                disabled={
                  !payoutVendorId.trim() ||
                  !payoutCurrency.trim() ||
                  Number(payoutAmount) <= 0 ||
                  requesting
                }
                className="bg-primary hover:bg-primary/90"
              >
                {requesting ? t("common.loading") : t("payouts.requestPayout")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
