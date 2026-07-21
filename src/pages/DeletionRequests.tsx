import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminListDeletionRequests, type DeletionRequestItem } from "@/hooks/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_LIMIT = 20;

/** Maps the deletion lifecycle status to a StatusBadge variant. */
function statusVariant(status: string): "pending" | "warning" | "inactive" {
  switch (status) {
    case "PENDING_DELETION":
      return "pending";
    case "PURGING":
      return "warning";
    default:
      return "inactive";
  }
}

export default function DeletionRequests() {
  const { t } = useTranslation();
  const [pageOffset, setPageOffset] = useState(0);

  const { data, loading, error } = useAdminListDeletionRequests({
    limit: PAGE_LIMIT,
    offset: pageOffset,
  });

  const items: DeletionRequestItem[] = data?.adminListDeletionRequests?.items ?? [];
  const total = data?.adminListDeletionRequests?.total ?? 0;
  const hasMore = data?.adminListDeletionRequests?.hasMore ?? false;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t("deletionRequests.title")}</h1>
            <p className="text-muted-foreground">{t("deletionRequests.subtitle")}</p>
          </div>
        </div>

        {/* Main Table */}
        <Card className="glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>{t("deletionRequests.columns.userId")}</TableHead>
                    <TableHead>{t("deletionRequests.columns.email")}</TableHead>
                    <TableHead>{t("deletionRequests.columns.requestedDate")}</TableHead>
                    <TableHead>{t("deletionRequests.columns.status")}</TableHead>
                    <TableHead>{t("deletionRequests.columns.legalHold")}</TableHead>
                    <TableHead>{t("deletionRequests.columns.reason")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("deletionRequests.loading")}
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-destructive py-8">
                        {t("deletionRequests.error")}
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("deletionRequests.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.userId} className="border-border/50">
                        <TableCell className="max-w-[160px] truncate font-mono text-xs text-muted-foreground" title={item.userId}>
                          {item.userId}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.deletionScheduledAt ? new Date(item.deletionScheduledAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge variant={statusVariant(item.deletionStatus)}>
                            {t(`deletionRequests.status.${item.deletionStatus}`)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          {item.legalHold ? (
                            <StatusBadge variant="error" title={item.legalHoldReason ?? undefined}>
                              {t("deletionRequests.legalHoldBadge")}
                            </StatusBadge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate text-muted-foreground" title={item.deletionReason ?? undefined}>
                          {item.deletionReason || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {t("deletionRequests.showing", {
                  from: items.length ? pageOffset + 1 : 0,
                  to: pageOffset + items.length,
                  total,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageOffset === 0 || loading}
                  onClick={() => setPageOffset((o) => Math.max(0, o - PAGE_LIMIT))}
                >
                  {t("deletionRequests.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore || loading}
                  onClick={() => setPageOffset((o) => o + PAGE_LIMIT)}
                >
                  {t("deletionRequests.next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
