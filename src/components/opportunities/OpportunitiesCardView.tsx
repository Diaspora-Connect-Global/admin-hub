import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Globe,
  Lock,
  Briefcase,
  Calendar,
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
} from "lucide-react";
import { Opportunity, OpportunityType, PriorityLevel } from "@/types/opportunities";
import { useT } from "@/hooks/useT";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OpportunitiesCardViewProps {
  opportunities: Opportunity[];
  onOpenDrawer: (opp: Opportunity) => void;
  onEdit: (opp: Opportunity) => void;
  onTogglePublish: (opp: Opportunity) => void;
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

export function OpportunitiesCardView({
  opportunities,
  onOpenDrawer,
  onEdit,
  onTogglePublish,
  onViewApplicants,
  onDelete,
  onSetPriority,
}: OpportunitiesCardViewProps) {
  const t = useT("opportunities");

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

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">{t.noOpportunitiesYet}</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.noOpportunitiesYetDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {opportunities.map((opp) => (
        <Card
          key={opp.id}
          className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
          onClick={() => onOpenDrawer(opp)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="secondary" className="capitalize">
                {typeLabels[opp.type]}
              </Badge>
              <StatusBadge variant={statusMap[opp.status]} className="text-xs">
                {opp.status === "PUBLISHED" ? t.published : opp.status === "DRAFT" ? t.draft : opp.status}
              </StatusBadge>
            </div>
            <h3 className="mt-2 font-semibold text-foreground line-clamp-2">{opp.title}</h3>
            <p className="text-sm text-foreground/80 line-clamp-2">{(opp as Opportunity & { shortDescription?: string }).shortDescription || opp.description}</p>
          </CardHeader>

          <CardContent className="pb-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/80">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{opp.applicantsCount} {t.applicantsLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                {opp.visibility === "PUBLIC" ? (
                  <Globe className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">{opp.visibility === "PUBLIC" ? t.public : t.privateGroup}</span>
              </div>
              {opp.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{opp.deadline}</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter
            className="border-t border-border pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full justify-between gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(opp)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => onTogglePublish(opp)}
              >
                {opp.status === "PUBLISHED" ? (
                  <ToggleLeft className="h-4 w-4" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => onViewApplicants(opp)}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(opp)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {onSetPriority && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <ArrowUpCircle className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSetPriority(opp, PriorityLevel.HIGH)}>
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      High priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSetPriority(opp, PriorityLevel.NORMAL)}>
                      <MinusCircle className="mr-2 h-4 w-4" />
                      Normal priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSetPriority(opp, PriorityLevel.LOW)}>
                      <ArrowDownCircle className="mr-2 h-4 w-4" />
                      Low priority
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}