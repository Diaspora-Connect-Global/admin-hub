import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import { Search, ChevronLeft, ChevronRight, Wallet, Lock, Coins } from "lucide-react";
import {
  useGetWalletBalance,
  useGetTransactionHistory,
} from "@/hooks/admin";
import type { LedgerEntry } from "@/services/networks/graphql/admin";

// Confirmed valid wallet ownerType values from escrow-service
// `WalletOwnerTypeValue` (status.vo.ts): the stored owner_type values are the
// lowercase strings 'user' | 'vendor' | 'platform'. The read path matches the
// raw string against stored wallets, so these are the only values that resolve.
const OWNER_TYPES = ["user", "vendor", "platform"] as const;

export default function WalletLedger() {
  const { t } = useTranslation();

  // Pending form state (what the admin is typing).
  const [ownerIdInput, setOwnerIdInput] = useState("");
  const [ownerTypeInput, setOwnerTypeInput] = useState<string>("user");

  // Active lookup (what we actually query for) — only set on submit.
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerType, setOwnerType] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const offset = (page - 1) * LIMIT;

  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
  } = useGetWalletBalance(ownerId, ownerType);

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
  } = useGetTransactionHistory(ownerId, ownerType, LIMIT, offset);

  const balance = balanceData?.adminGetWalletBalance;
  const entries: LedgerEntry[] = historyData?.adminGetTransactionHistory?.entries ?? [];
  const total: number = historyData?.adminGetTransactionHistory?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const hasLookup = !!ownerId && !!ownerType;

  // Wallet balances and ledger amounts are decimal currency (Float) — format
  // directly, do NOT divide by 100.
  const formatCurrency = (amount: number, currency?: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
    }).format(amount);

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
    setOwnerId(ownerIdInput.trim() || null);
    setOwnerType(ownerTypeInput);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("walletLedger.title")}</h1>
          <p className="text-muted-foreground">{t("walletLedger.subtitle")}</p>
        </div>

        {/* Owner lookup form */}
        <div className="glass rounded-xl border border-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-1.5 min-w-[240px]">
              <Label htmlFor="ownerId">{t("walletLedger.ownerId")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ownerId"
                  placeholder={t("walletLedger.ownerIdPlaceholder")}
                  className="pl-10 bg-card border-border"
                  value={ownerIdInput}
                  onChange={(e) => setOwnerIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLookup();
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerType">{t("walletLedger.ownerType")}</Label>
              <Select value={ownerTypeInput} onValueChange={setOwnerTypeInput}>
                <SelectTrigger id="ownerType" className="w-[180px] bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OWNER_TYPES.map((ot) => (
                    <SelectItem key={ot} value={ot}>
                      {t(`walletLedger.ownerTypes.${ot}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleLookup}
              disabled={!ownerIdInput.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Search className="h-4 w-4 mr-2" />
              {t("walletLedger.lookup")}
            </Button>
          </div>
        </div>

        {/* Empty (no lookup yet) */}
        {!hasLookup && (
          <div className="glass rounded-xl border border-dashed border-border p-12 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("walletLedger.emptyPrompt")}</p>
          </div>
        )}

        {hasLookup && (
          <>
            {/* Balance cards */}
            {balanceError ? (
              <div className="glass rounded-xl border border-destructive/40 p-6 text-center text-destructive">
                {t("walletLedger.balanceError")}
              </div>
            ) : balanceLoading && !balance ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="glass rounded-xl border border-border p-5 h-28 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Coins className="h-4 w-4" />
                    {t("walletLedger.availableBalance")}
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {balance ? formatCurrency(balance.availableBalance, balance.currency) : "—"}
                  </p>
                </div>
                <div className="glass rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Lock className="h-4 w-4" />
                    {t("walletLedger.escrowBalance")}
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {balance ? formatCurrency(balance.escrowBalance, balance.currency) : "—"}
                  </p>
                </div>
                <div className="glass rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Wallet className="h-4 w-4" />
                    {t("walletLedger.totalBalance")}
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {balance ? formatCurrency(balance.totalBalance, balance.currency) : "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Ledger table */}
            <div className="glass rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-medium text-foreground">
                  {t("walletLedger.transactionHistory")}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>{t("walletLedger.entryId")}</TableHead>
                      <TableHead>{t("walletLedger.entryType")}</TableHead>
                      <TableHead>{t("walletLedger.batchId")}</TableHead>
                      <TableHead>{t("common.amount")}</TableHead>
                      <TableHead>{t("walletLedger.createdAt")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyError && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-destructive">
                          {t("walletLedger.historyError")}
                        </TableCell>
                      </TableRow>
                    )}
                    {!historyError && historyLoading && entries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          {t("common.loading")}
                        </TableCell>
                      </TableRow>
                    )}
                    {!historyError && !historyLoading && entries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          {t("walletLedger.noEntries")}
                        </TableCell>
                      </TableRow>
                    )}
                    {!historyError &&
                      entries.map((entry: LedgerEntry) => (
                        <TableRow key={entry.id} className="border-border">
                          <TableCell className="font-mono text-xs text-foreground">
                            {entry.id}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {entry.entryType ?? "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {entry.batchId ?? "—"}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {/* Ledger amount is decimal currency (Float) — no /100. */}
                            {formatCurrency(entry.amount, balance?.currency)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(entry.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {t("walletLedger.showingCount", { shown: entries.length, total })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    aria-label={t("common.previous")}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    aria-label={t("common.next")}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
