import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Edit, Trash2, ToggleLeft, ToggleRight, Users, Globe, Lock, Briefcase, Calendar } from "lucide-react";
import { Opportunity, OpportunityType } from "@/types/opportunities";
import { useT } from "@/hooks/useT";

interface OpportunitiesCardViewProps {
  opportunities: Opportunity[];
  onOpenDrawer: (opp: Opportunity) => void;
  onEdit: (opp: Opportunity) => void;
  onTogglePublish: (opp: Opportunity) => void;
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

export function OpportunitiesCardView({
  opportunities,
  onOpenDrawer,
  onEdit,
  onTogglePublish,
  onViewApplicants,
  onDelete,
}: OpportunitiesCardViewProps) {
  const t = useT("opportunities");

  const typeLabels: Record<OpportunityType, string> = {
    job: t.job,
    volunteer: t.volunteer,
    training: t.training,
    funding: t.funding,
    scholarship: t.scholarship,
    other: t.other,
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
                {opp.status === "published" ? t.published : opp.status === "draft" ? t.draft : opp.status}
              </StatusBadge>
            </div>
            <h3 className="mt-2 font-semibold text-foreground line-clamp-2">{opp.title}</h3>
            <p className="text-sm text-foreground/80 line-clamp-2">{opp.shortDescription}</p>
          </CardHeader>

          <CardContent className="pb-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/80">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{opp.applicantsCount} {t.applicantsLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                {opp.visibility === "public" ? (
                  <Globe className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">{opp.visibility === "public" ? t.public : t.privateGroup}</span>
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
                {opp.status === "published" ? (
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
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}