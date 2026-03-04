import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Globe,
  Lock,
  ToggleLeft,
  ToggleRight,
  XCircle,
  Briefcase,
} from "lucide-react";
import { Opportunity, OpportunityType } from "@/types/opportunities";
import { useT } from "@/hooks/useT";

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  selectedOpportunities: string[];
  onSelectOpportunity: (id: string) => void;
  onSelectAll: () => void;
  onOpenDrawer: (opp: Opportunity) => void;
  onEdit: (opp: Opportunity) => void;
  onTogglePublish: (opp: Opportunity) => void;
  onClose: (opp: Opportunity) => void;
  onViewApplicants: (opp: Opportunity) => void;
  onDelete: (opp: Opportunity) => void;
}

const statusMap = {
  published: "active" as const,
  draft: "inactive" as const,
  scheduled: "pending" as const,
  closed: "inactive" as const,
  archived: "inactive" as const,
  removed: "inactive" as const,
};

export function OpportunitiesTable({
  opportunities,
  selectedOpportunities,
  onSelectOpportunity,
  onSelectAll,
  onOpenDrawer,
  onEdit,
  onTogglePublish,
  onClose,
  onViewApplicants,
  onDelete,
}: OpportunitiesTableProps) {
  const t = useT("opportunities");
  const allSelected = opportunities.length > 0 && selectedOpportunities.length === opportunities.length;
  const someSelected = selectedOpportunities.length > 0 && selectedOpportunities.length < opportunities.length;

  const typeLabels: Record<OpportunityType, string> = {
    job: t.job,
    volunteer: t.volunteer,
    training: t.training,
    funding: t.funding,
    scholarship: t.scholarship,
    other: t.other,
  };

  const statusLabels: Record<string, string> = {
    published: t.published,
    draft: t.draft,
    scheduled: t.scheduled,
    closed: t.closed,
    archived: t.archived,
    removed: t.removed,
  };

  const visibilityLabels: Record<string, string> = {
    public: t.public,
    members: t.membersOnly,
  };

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">{t.noOpportunitiesYet}</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.createFirstOpportunity}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label={t.selectAll}
                className={someSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead className="w-24">{t.status}</TableHead>
            <TableHead className="min-w-[250px]">{t.title}</TableHead>
            <TableHead className="w-28">{t.type}</TableHead>
            <TableHead className="w-28">{t.applicants}</TableHead>
            <TableHead className="w-24">{t.visibility}</TableHead>
            <TableHead className="w-28">{t.deadline}</TableHead>
            <TableHead className="w-28">{t.publishedAt}</TableHead>
            <TableHead className="w-16">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => {
            const isSelected = selectedOpportunities.includes(opp.id);

            return (
              <TableRow
                key={opp.id}
                className="cursor-pointer"
                onClick={() => onOpenDrawer(opp)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectOpportunity(opp.id)}
                    aria-label={`${t.select} ${opp.title}`}
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge variant={statusMap[opp.status]}>
                    {statusLabels[opp.status] || opp.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground line-clamp-1">{opp.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{opp.shortDescription}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {typeLabels[opp.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{opp.applicantsCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {opp.visibility === "public" ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs capitalize text-muted-foreground">
                      {visibilityLabels[opp.visibility] || opp.visibility}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {opp.deadline || t.open}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {opp.publishedAt || "—"}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onOpenDrawer(opp)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t.openDetails}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(opp)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePublish(opp)}>
                        {opp.status === "published" ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            {t.unpublish}
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {t.publish}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onClose(opp)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        {t.closeApplications}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewApplicants(opp)}>
                        <Users className="mr-2 h-4 w-4" />
                        {t.viewApplicants}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(opp)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
