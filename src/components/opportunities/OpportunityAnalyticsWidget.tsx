import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, Clock, TrendingUp, ExternalLink, Lightbulb } from "lucide-react";
import { Applicant } from "@/types/opportunities";

interface OpportunityAnalyticsWidgetProps {
  openOppsCount: number;
  applicants30d: number;
  avgTimeToFill: number;
  recentApplicants: Applicant[];
  onOpenApplicantsDrawer: () => void;
}

export function OpportunityAnalyticsWidget({
  openOppsCount,
  applicants30d,
  avgTimeToFill,
  recentApplicants,
  onOpenApplicantsDrawer,
}: OpportunityAnalyticsWidgetProps) {
  return (
    <div className="w-80 flex-shrink-0 space-y-4">
      {/* Quick Analytics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{openOppsCount}</p>
              <p className="text-xs text-muted-foreground">Open Opportunities</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{applicants30d}</p>
              <p className="text-xs text-muted-foreground">Total Applicants (30d)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{avgTimeToFill} days</p>
              <p className="text-xs text-muted-foreground">Avg. Time to Fill</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applicants */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Applicants</CardTitle>
            <Button variant="ghost" size="sm" onClick={onOpenApplicantsDrawer}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-52">
            {recentApplicants.length > 0 ? (
              <div className="space-y-3">
                {recentApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="flex items-center justify-between rounded-lg border border-border p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{applicant.name}</p>
                      <p className="text-xs text-muted-foreground">{applicant.appliedAt}</p>
                    </div>
                    <Badge
                      variant={
                        applicant.status === "shortlisted"
                          ? "default"
                          : applicant.status === "hired"
                          ? "default"
                          : "secondary"
                      }
                      className="ml-2 text-xs capitalize"
                    >
                      {applicant.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent applicants</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Add 3–5 screening questions to filter candidates.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Use structured application forms for consistent data.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Export applicants regularly for audits.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
