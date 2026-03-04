import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Edit,
  ToggleLeft,
  ToggleRight,
  XCircle,
  Copy,
  Link2,
  Users,
  Globe,
  Lock,
  MapPin,
  Calendar,
  Clock,
} from "lucide-react";
import { Opportunity, OpportunityType } from "@/types/opportunities";
import { toast } from "@/hooks/use-toast";

interface OpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
  onEdit: () => void;
  onTogglePublish: () => void;
  onClose: () => void;
  onViewApplicants: () => void;
  onDuplicate: () => void;
}

const statusMap = {
  published: "active" as const,
  draft: "inactive" as const,
  scheduled: "pending" as const,
  closed: "inactive" as const,
  archived: "inactive" as const,
  removed: "inactive" as const,
};

const typeLabels: Record<OpportunityType, string> = {
  job: "Job",
  volunteer: "Volunteer",
  training: "Training",
  funding: "Funding",
  scholarship: "Scholarship",
  other: "Other",
};

export function OpportunityModal({
  open,
  onOpenChange,
  opportunity,
  onEdit,
  onTogglePublish,
  onClose,
  onViewApplicants,
  onDuplicate,
}: OpportunityModalProps) {
  if (!opportunity) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://app.example.com/opportunities/${opportunity.id}`);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl line-clamp-2">{opportunity.title}</DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {typeLabels[opportunity.type]}
                </Badge>
                <StatusBadge variant={statusMap[opportunity.status]}>
                  {opportunity.status}
                </StatusBadge>
                <Badge variant="outline" className="gap-1">
                  {opportunity.visibility === "public" ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {opportunity.visibility}
                </Badge>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {opportunity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {opportunity.location}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {opportunity.applicantsCount} applicants
            </div>
            {opportunity.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Deadline: {opportunity.deadline}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onTogglePublish}>
              {opportunity.status === "published" ? (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <ToggleRight className="h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onClose}>
              <XCircle className="h-4 w-4" />
              Close
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewApplicants}>
              <Users className="h-4 w-4" />
              Applicants
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="mt-4 space-y-6">
            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{opportunity.shortDescription}</p>
              {opportunity.description && (
                <div className="mt-3 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{opportunity.description}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags / Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Application Form */}
            <div>
              <h4 className="font-medium mb-2">Application Form</h4>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Form Type</span>
                  <Badge variant="outline" className="capitalize">{opportunity.formType}</Badge>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">CV Required</span>
                  <span className="text-sm text-muted-foreground">
                    {opportunity.requireCv ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Max Applicants</span>
                  <span className="text-sm text-muted-foreground">
                    {opportunity.maxApplicants || "No limit"}
                  </span>
                </div>
              </div>
            </div>

            {/* Screening & Workflow */}
            <div>
              <h4 className="font-medium mb-2">Screening & Workflow</h4>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Review Workflow</span>
                  <Badge variant="outline" className="capitalize">
                    {opportunity.reviewWorkflow.replace("_", " ")}
                  </Badge>
                </div>
                {opportunity.reviewers && opportunity.reviewers.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assigned Reviewers</span>
                    <span className="text-sm text-muted-foreground">
                      {opportunity.reviewers.length} assigned
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={onDuplicate}>
                  <Copy className="h-4 w-4" />
                  Duplicate Opportunity
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleCopyLink}>
                  <Link2 className="h-4 w-4" />
                  Share Link
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-medium mb-2">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">{opportunity.createdAt}</p>
                  </div>
                </div>
                {opportunity.publishedAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <ToggleRight className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Published</p>
                      <p className="text-xs text-muted-foreground">{opportunity.publishedAt}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}