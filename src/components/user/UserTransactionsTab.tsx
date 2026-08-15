import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserTransaction } from "@/hooks/admin/useUserSubResources";
import { ContentStatusBadge } from "./accountStatus";
import { UserTabShell, type UserTabPaging } from "./UserTabShell";

interface UserTransactionsTabProps {
  transactions: UserTransaction[];
  total: number;
  loading: boolean;
  error?: unknown;
  paging: Omit<UserTabPaging, "count" | "total">;
  t: (key: string) => string;
}

/**
 * Money arrives in integer MINOR units (pesewas/cents) — the platform-wide
 * convention — and is divided by 100 exactly once, here at the display
 * boundary. Printing the raw integer would overstate every amount 100×.
 */
function formatAmount(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}

/** Escrow / platform transactions this user took part in. */
export function UserTransactionsTab({
  transactions,
  total,
  loading,
  error,
  paging,
  t,
}: UserTransactionsTabProps) {
  return (
    <UserTabShell
      value="transactions"
      title={t("users.detail.transactions.title")}
      description={t("users.detail.transactions.description")}
      loading={loading}
      error={error}
      emptyTitle={t("users.detail.transactions.empty")}
      paging={{ ...paging, count: transactions.length, total }}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead>{t("users.detail.transactions.id")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("common.amount")}</TableHead>
            <TableHead>{t("users.detail.transactions.currency")}</TableHead>
            <TableHead>{t("common.description")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="border-border/50">
              <TableCell className="font-mono text-xs text-muted-foreground">
                {tx.id.slice(0, 8)}…
              </TableCell>
              <TableCell>{tx.type ? <Badge variant="secondary">{tx.type}</Badge> : "—"}</TableCell>
              <TableCell className="font-medium">{formatAmount(tx.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{tx.currency ?? "—"}</TableCell>
              <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                {tx.description ?? "—"}
              </TableCell>
              <TableCell>{tx.status ? <ContentStatusBadge status={tx.status} /> : "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </UserTabShell>
  );
}
