import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  MessageCircle,
  XCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import { Opportunity, Applicant, ApplicantStatus } from "@/types/opportunities";
import { useT } from "@/hooks/useT";

interface ApplicantsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
  applicants: Applicant[];
  onViewApplication: (applicant: Applicant) => void;
  onReview: (applicant: Applicant) => void;
  onMessage: (applicant: Applicant) => void;
  onReject: (applicant: Applicant) => void;
  onAccept: (applicant: Applicant) => void;
  onExport: () => void;
}

const statusColors: Record<ApplicantStatus, string> = {
  PENDING: "secondary",
  REVIEWING: "default",
  ACCEPTED: "default",
  REJECTED: "destructive",
  WITHDRAWN: "secondary",
};

export function ApplicantsDrawer({
  open,
  onOpenChange,
  opportunity,
  applicants,
  onViewApplication,
  onReview,
  onMessage,
  onReject,
  onAccept,
  onExport,
}: ApplicantsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const t = useT("opportunities");

  const filteredApplicants = applicants.filter((a) => {
    if (
      searchQuery &&
      !(a.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(a.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter !== "all" && a.status !== statusFilter.toUpperCase()) return false;
    return true;
  });

  if (!opportunity) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0" onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.applicants}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t.forOpportunity}: {opportunity.title}
          </p>

          {/* Controls */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.searchByNameEmailPhone}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t.filter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="PENDING">{t.pending}</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="REJECTED">{t.rejected}</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={onExport}>
              <Download className="h-4 w-4" />
              {t.export}
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-220px)]">
          {filteredApplicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">{t.noApplicantsYet}</h3>
              <p className="text-sm text-muted-foreground">
                {t.applicantsWillAppear}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.appliedAt}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="w-16">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{applicant.name || applicant.applicantId}</p>
                        <p className="text-xs text-muted-foreground">{applicant.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {applicant.appliedAt}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[applicant.status] as any} className="capitalize">
                        {applicant.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewApplication(applicant)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t.viewApplication}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReview(applicant)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Reviewing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onMessage(applicant)}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {t.message}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReject(applicant)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            {t.reject}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAccept(applicant)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
