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
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
} from "lucide-react";
import { Opportunity, OpportunityType, PriorityLevel } from "@/types/opportunities";
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
  onSetPriority?: (opp: Opportunity, priority: PriorityLevel) => void;
}

const statusMap = {
  PUBLISHED: "active" as const,
  DRAFT: "inactive" as const,
  CLOSED: "inactive" as const,
  ARCHIVED: "inactive" as const,
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
  onSetPriority,
}: OpportunitiesTableProps) {
  const t = useT("opportunities");
  const allSelected = opportunities.length > 0 && selectedOpportunities.length === opportunities.length;
  const someSelected = selectedOpportunities.length > 0 && selectedOpportunities.length < opportunities.length;

  const typeLabels: Record<OpportunityType, string> = {
    EMPLOYMENT: t.employment || "Employment",
    VOLUNTEER: t.volunteer,
    SCHOLARSHIP: t.scholarship,
    FELLOWSHIP: t.fellowship || "Fellowship",
    GRANT: t.grant || "Grant",
    PROGRAM: t.program || "Program",
    CONTRACT: t.contract || "Contract",
    INVESTMENT: t.investment || "Investment",
    INITIATIVE: t.initiative || "Initiative",
  };

  const statusLabels: Record<string, string> = {
    PUBLISHED: t.published,
    DRAFT: t.draft,
    CLOSED: t.closed,
    ARCHIVED: t.archived,
  };

  const visibilityLabels: Record<string, string> = {
    PUBLIC: t.public,
    COMMUNITY_ONLY: t.membersOnly,
    ASSOCIATION_ONLY: t.membersOnly,
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
                    <p className="text-sm text-muted-foreground line-clamp-1">{(opp as Opportunity & { shortDescription?: string }).shortDescription || opp.description}</p>
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
                    {opp.visibility === "PUBLIC" ? (
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
                        {opp.status === "PUBLISHED" ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            {t.closeApplications}
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
                      {onSetPriority && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onSetPriority(opp, PriorityLevel.HIGH)}>
                            <ArrowUpCircle className="mr-2 h-4 w-4" />
                            Set priority: High
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSetPriority(opp, PriorityLevel.NORMAL)}>
                            <MinusCircle className="mr-2 h-4 w-4" />
                            Set priority: Normal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSetPriority(opp, PriorityLevel.LOW)}>
                            <ArrowDownCircle className="mr-2 h-4 w-4" />
                            Set priority: Low
                          </DropdownMenuItem>
                        </>
                      )}
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
