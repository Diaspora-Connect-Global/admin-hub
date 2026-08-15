import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import type { UserGroup } from "@/hooks/admin/useUserSubResources";
import { UserTabShell, type UserTabPaging } from "./UserTabShell";

interface UserGroupsTabProps {
  groups: UserGroup[];
  total: number;
  loading: boolean;
  error?: unknown;
  paging: Omit<UserTabPaging, "count" | "total">;
  t: (key: string) => string;
}

/** Groups the user belongs to, with their role in each. */
export function UserGroupsTab({ groups, total, loading, error, paging, t }: UserGroupsTabProps) {
  return (
    <UserTabShell
      value="groups"
      title={t("users.detail.groups.title")}
      description={t("users.detail.groups.description")}
      loading={loading}
      error={error}
      emptyTitle={t("users.detail.groups.empty")}
      paging={{ ...paging, count: groups.length, total }}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead>{t("users.detail.groups.name")}</TableHead>
            <TableHead>{t("users.detail.community")}</TableHead>
            <TableHead>{t("users.detail.groups.members")}</TableHead>
            <TableHead>{t("users.detail.groups.role")}</TableHead>
            <TableHead>{t("users.detail.groups.joinedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id} className="border-border/50">
              <TableCell className="text-sm font-medium">{group.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{group.communityName ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {group.memberCount}
                </span>
              </TableCell>
              <TableCell>
                {group.role ? <Badge variant="secondary">{group.role}</Badge> : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {group.joinedAt ? new Date(group.joinedAt).toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </UserTabShell>
  );
}
