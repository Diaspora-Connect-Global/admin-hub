import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, FileText, Clock, Archive, Search, CalendarIcon, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useT } from "@/hooks/useT";

interface OpportunitiesFiltersProps {
  onCreateOpportunity: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  visibilityFilter: string;
  onVisibilityChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onNavigate: (view: string) => void;
}

export function OpportunitiesFilters({
  onCreateOpportunity,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  visibilityFilter,
  onVisibilityChange,
  dateRange,
  onDateRangeChange,
  onNavigate,
}: OpportunitiesFiltersProps) {
  const t = useT("opportunities");

  return (
    <div className="w-72 flex-shrink-0 space-y-6">
      {/* Opportunity Actions */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t.opportunityActions}</h3>
        <div className="space-y-2">
          <Button onClick={onCreateOpportunity} className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            {t.createOpportunity}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => onNavigate("drafts")}
          >
            <FileText className="h-4 w-4" />
            {t.drafts}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => onNavigate("scheduled")}
          >
            <Clock className="h-4 w-4" />
            {t.scheduled}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => onNavigate("closed")}
          >
            <Archive className="h-4 w-4" />
            {t.closed}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t.filters}</h3>
        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t.search}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t.status}</Label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder={t.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="draft">{t.draft}</SelectItem>
                <SelectItem value="published">{t.published}</SelectItem>
                <SelectItem value="scheduled">{t.scheduled}</SelectItem>
                <SelectItem value="closed">{t.closed}</SelectItem>
                <SelectItem value="archived">{t.archived}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t.type}</Label>
            <Select value={typeFilter} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder={t.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="job">{t.job}</SelectItem>
                <SelectItem value="volunteer">{t.volunteer}</SelectItem>
                <SelectItem value="training">{t.training}</SelectItem>
                <SelectItem value="funding">{t.funding}</SelectItem>
                <SelectItem value="scholarship">{t.scholarship}</SelectItem>
                <SelectItem value="other">{t.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t.visibility}</Label>
            <Select value={visibilityFilter} onValueChange={onVisibilityChange}>
              <SelectTrigger>
                <SelectValue placeholder={t.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="members">{t.membersOnly}</SelectItem>
                <SelectItem value="public">{t.public}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t.dateRange}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, yyyy")
                    )
                  ) : (
                    t.pickDateRange
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => {
              onSearchChange("");
              onStatusChange("all");
              onTypeChange("all");
              onVisibilityChange("all");
              onDateRangeChange(undefined);
            }}
          >
            {t.clearAllFilters}
          </Button>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          {t.quickTips}
        </h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {t.tipScreeningQuestions}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {t.tipDeadline}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            {t.tipCVUploads}
          </li>
        </ul>
      </div>
    </div>
  );
}
