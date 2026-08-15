import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserOpportunity } from "@/hooks/admin/useUserSubResources";
import { ContentStatusBadge } from "./accountStatus";
import { UserTabShell, type UserTabPaging } from "./UserTabShell";

interface UserOpportunitiesTabProps {
  opportunities: UserOpportunity[];
  total: number;
  loading: boolean;
  error?: unknown;
  paging: Omit<UserTabPaging, "count" | "total">;
  t: (key: string) => string;
}

/** Opportunities this user posted or applied to. */
export function UserOpportunitiesTab({
  opportunities,
  total,
  loading,
  error,
  paging,
  t,
}: UserOpportunitiesTabProps) {
  return (
    <UserTabShell
      value="opportunities"
      title={t("users.detail.opportunities.title")}
      description={t("users.detail.opportunities.description")}
      loading={loading}
      error={error}
      emptyTitle={t("users.detail.opportunities.empty")}
      paging={{ ...paging, count: opportunities.length, total }}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead>{t("users.detail.opportunities.titleColumn")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("users.detail.community")}</TableHead>
            <TableHead>{t("users.detail.opportunities.applicants")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("users.detail.opportunities.postedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opportunity) => (
            <TableRow key={opportunity.id} className="border-border/50">
              <TableCell className="max-w-[200px] truncate text-sm font-medium">
                {opportunity.title}
              </TableCell>
              <TableCell>
                {opportunity.type ? <Badge variant="secondary">{opportunity.type}</Badge> : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {opportunity.communityName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{opportunity.applicants}</TableCell>
              <TableCell>
                {opportunity.status ? <ContentStatusBadge status={opportunity.status} /> : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {opportunity.postedAt ? new Date(opportunity.postedAt).toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </UserTabShell>
  );
}
