import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { UserTabShell, type UserTabPaging } from "./UserTabShell";

/**
 * One row of `getModerationActions` — enforcement taken AGAINST this account.
 *
 * Deliberately NOT the audit log: `getAuditLogs(actorId)` lists what the user
 * DID, which on a user-detail page answers the wrong question. Ban / unban /
 * suspend history is what an admin needs before acting again.
 */
export interface ModerationActionRow {
  id: string;
  adminId?: string | null;
  adminRole?: string | null;
  actionType?: string | null;
  reason?: string | null;
  createdAt?: string | null;
}

interface UserEnforcementTabProps {
  actions: ModerationActionRow[];
  total: number;
  loading: boolean;
  error?: unknown;
  paging: Omit<UserTabPaging, "count" | "total">;
  /**
   * Admin id → email. The acting admin is shown by email (or, failing that, by
   * role) — never by id: user/admin ids must not be displayed to anyone.
   */
  adminEmailById?: ReadonlyMap<string, string>;
  t: (key: string) => string;
}

export function UserEnforcementTab({
  actions,
  total,
  loading,
  error,
  paging,
  adminEmailById,
  t,
}: UserEnforcementTabProps) {
  const adminOf = (action: ModerationActionRow) =>
    (action.adminId && adminEmailById?.get(action.adminId)) || "";

  // Exports exactly the rows on screen — the same page the admin is looking at,
  // rather than silently re-querying the whole history.
  const handleExport = () =>
    downloadCsv(
      `user-enforcement-${new Date().toISOString().slice(0, 10)}.csv`,
      actions.map((action) => ({
        date: action.createdAt ?? "",
        action: action.actionType ?? "",
        admin: adminOf(action),
        adminRole: action.adminRole ?? "",
        reason: action.reason ?? "",
      })),
    );

  return (
    <UserTabShell
      value="enforcement"
      title={t("users.detail.enforcement.title")}
      description={t("users.detail.enforcement.description")}
      loading={loading}
      error={error}
      emptyTitle={t("users.detail.enforcement.empty")}
      emptyMessage={t("users.detail.enforcement.emptyHint")}
      paging={{ ...paging, count: actions.length, total }}
      headerAction={
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={actions.length === 0}
          title={actions.length === 0 ? t("users.detail.enforcement.exportEmpty") : undefined}
        >
          <Download className="mr-2 h-4 w-4" />
          {t("users.detail.enforcement.exportCsv")}
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("users.detail.enforcement.action")}</TableHead>
            <TableHead>{t("users.detail.enforcement.admin")}</TableHead>
            <TableHead>{t("users.detail.enforcement.reason")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((action) => (
            <TableRow key={action.id} className="border-border/50">
              <TableCell className="font-mono text-xs">
                {action.createdAt ? new Date(action.createdAt).toLocaleString() : "—"}
              </TableCell>
              <TableCell>
                {action.actionType ? <Badge variant="secondary">{action.actionType}</Badge> : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {[adminOf(action), action.adminRole].filter(Boolean).join(" · ") || "—"}
              </TableCell>
              <TableCell className="max-w-[260px] text-sm">{action.reason ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </UserTabShell>
  );
}
