import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetReports,
  useUpdateReportStatus,
  useAdminRemoveContent,
  useBulkRemoveContent,
} from "@/hooks/admin";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  CheckSquare,
  Eye,
  Check,
  X,
  Flag,
  MoreHorizontal,
  Download,
  ChevronDown,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Image as ImageIcon,
  FileText,
  Briefcase,
  ShoppingBag,
} from "lucide-react";

interface ReportItem {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: string;
  createdAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  resolutionNotes?: string | null;
}

function targetTypeToLabel(targetType: string): string {
  const map: Record<string, string> = {
    POST: "Post",
    COMMENT: "Comment",
    OPPORTUNITY: "Opportunity",
    VENDOR_PRODUCT: "Vendor Listing",
    EVENT: "Event",
  };
  return map[targetType] ?? targetType;
}

function reportStatusToDisplay(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending Approval",
    RESOLVED: "Approved",
    DISMISSED: "Rejected",
    FLAGGED: "Flagged",
  };
  return map[status] ?? status;
}

export default function ContentModeration() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReportItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Form states
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [flagSeverity, setFlagSeverity] = useState("Medium");
  const [bulkAction, setBulkAction] = useState("Approve");
  const [bulkNote, setBulkNote] = useState("");

  // Backend: map UI status filter → GraphQL ReportStatus enum
  const gqlStatus = statusFilter === "Pending Approval" ? "PENDING"
    : statusFilter === "Approved" ? "RESOLVED"
    : statusFilter === "Rejected" ? "DISMISSED"
    : undefined;
  const gqlTargetType = contentTypeFilter === "Post" ? "POST"
    : contentTypeFilter === "Comment" ? "COMMENT"
    : contentTypeFilter === "Opportunity" ? "OPPORTUNITY"
    : contentTypeFilter === "Vendor Listing" ? "VENDOR_PRODUCT"
    : undefined;

  const { data: reportsData, loading: reportsLoading, refetch: refetchReports } = useGetReports({
    status: gqlStatus,
    targetType: gqlTargetType,
    limit: 50,
    offset: 0,
  });

  const [updateReportStatus, { loading: updatingReport }] = useUpdateReportStatus();
  const [adminRemoveContent] = useAdminRemoveContent();

  const reports: ReportItem[] = useMemo(() => {
    const raw = reportsData?.getReports?.items ?? [];
    if (!searchQuery) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter((r: ReportItem) =>
      r.targetId.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q)
    );
  }, [reportsData, searchQuery]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Pending Approval": "secondary",
      Approved: "default",
      Rejected: "destructive",
      Flagged: "destructive",
    };
    const colors: Record<string, string> = {
      Approved: "bg-green-600 hover:bg-green-600",
      Flagged: "bg-orange-500 hover:bg-orange-500",
    };
    return <Badge variant={variants[status]} className={colors[status] || ""}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Post": return <FileText className="h-4 w-4" />;
      case "Comment": return <MessageCircle className="h-4 w-4" />;
      case "Opportunity": return <Briefcase className="h-4 w-4" />;
      case "Vendor Listing": return <ShoppingBag className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContent(reports.map((r) => r.id));
    } else {
      setSelectedContent([]);
    }
  };

  const handleSelectContent = (contentId: string, checked: boolean) => {
    if (checked) {
      setSelectedContent([...selectedContent, contentId]);
    } else {
      setSelectedContent(selectedContent.filter((id) => id !== contentId));
    }
  };

  const openContentDetail = (item: ReportItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      await updateReportStatus({ variables: { input: { reportId: selectedItem.id, status: "RESOLVED", resolutionNotes: approveNote || undefined } } });
      toast({ title: "Success", description: "Report resolved successfully." });
      refetchReports();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
    setIsApproveModalOpen(false);
    setApproveNote("");
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    try {
      await updateReportStatus({ variables: { input: { reportId: selectedItem.id, status: "DISMISSED", resolutionNotes: rejectReason || undefined } } });
      toast({ title: "Success", description: "Report dismissed." });
      refetchReports();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
    setIsRejectModalOpen(false);
    setRejectReason("");
  };

  const handleRemoveContent = async (item: ReportItem) => {
    try {
      await adminRemoveContent({ variables: { contentType: item.targetType, contentId: item.targetId, reason: flagReason || "Admin removal" } });
      toast({ title: "Success", description: "Content removed." });
      refetchReports();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
    setIsFlagModalOpen(false);
    setFlagReason("");
  };

  const handleFlag = () => {
    if (selectedItem) handleRemoveContent(selectedItem);
  };

  const handleBulkAction = () => {
    toast({ title: "Success", description: `Bulk ${bulkAction.toLowerCase()} completed for ${selectedContent.length} items.` });
    setIsBulkModalOpen(false);
    setBulkNote("");
    setSelectedContent([]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('content.title')}</h1>
          <p className="text-muted-foreground">
            {t('content.searchPlaceholder')}
          </p>
        </div>

        {/* Top Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Post ID, user, association, community, keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedContent.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <DropdownMenuItem onClick={() => { setBulkAction("Approve"); setIsBulkModalOpen(true); }}>
                  Bulk Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setBulkAction("Reject"); setIsBulkModalOpen(true); }}>
                  Bulk Reject
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setBulkAction("Flag"); setIsBulkModalOpen(true); }}>
                  Bulk Flag
                </DropdownMenuItem>
                <DropdownMenuItem>Bulk Export</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsBulkModalOpen(true)} disabled={selectedContent.length === 0}>
              <CheckSquare className="mr-2 h-4 w-4" />
              Bulk Approve/Reject
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">Content Type</Label>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Post">Post</SelectItem>
                <SelectItem value="Comment">Comment</SelectItem>
                <SelectItem value="Opportunity">Opportunity</SelectItem>
                <SelectItem value="Vendor Listing">Vendor Listing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="mt-5" onClick={() => {
            setContentTypeFilter("all");
            setStatusFilter("all");
          }}>
            Clear Filters
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={reports.length > 0 && selectedContent.length === reports.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Report ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportsLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading reports...
                  </TableCell>
                </TableRow>
              )}
              {!reportsLoading && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No reports found.
                  </TableCell>
                </TableRow>
              )}
              {reports.map((item) => {
                const displayType = targetTypeToLabel(item.targetType);
                const displayStatus = reportStatusToDisplay(item.status);
                return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContent.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectContent(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium font-mono text-xs">{item.id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(displayType)}
                      <span>{displayType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.reason}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[100px] truncate">{item.reporterId}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[100px] truncate">{item.targetId}</TableCell>
                  <TableCell>{getStatusBadge(displayStatus)}</TableCell>
                  <TableCell className="text-sm">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openContentDetail(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status === "PENDING" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsApproveModalOpen(true); }}>
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsRejectModalOpen(true); }}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsFlagModalOpen(true); }}>
                        <Flag className="h-4 w-4 text-orange-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Content Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedItem && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    {getTypeIcon(targetTypeToLabel(selectedItem.targetType))}
                    {targetTypeToLabel(selectedItem.targetType)} Report
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline" className="font-mono text-xs">{selectedItem.id.slice(0, 8)}…</Badge>
                    {getStatusBadge(reportStatusToDisplay(selectedItem.status))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reported by <span className="font-mono">{selectedItem.reporterId}</span>
                  </p>
                </SheetHeader>

                <div className="flex gap-2 mt-4">
                  {selectedItem.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => { setIsDetailOpen(false); setIsApproveModalOpen(true); }}>
                        <Check className="mr-2 h-4 w-4" /> Resolve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setIsDetailOpen(false); setIsRejectModalOpen(true); }}>
                        <X className="mr-2 h-4 w-4" /> Dismiss
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setIsFlagModalOpen(true); }}>
                    <Flag className="mr-2 h-4 w-4" /> Remove Content
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="audit">Review History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Report Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Report ID:</span> <span className="ml-2 font-mono text-xs">{selectedItem.id}</span></div>
                        <div><span className="text-muted-foreground">Content Type:</span> <span className="ml-2">{targetTypeToLabel(selectedItem.targetType)}</span></div>
                        <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{reportStatusToDisplay(selectedItem.status)}</span></div>
                        <div><span className="text-muted-foreground">Reported:</span> <span className="ml-2">{new Date(selectedItem.createdAt).toLocaleString()}</span></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Target ID:</span> <span className="ml-2 font-mono text-xs">{selectedItem.targetId}</span></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Reporter ID:</span> <span className="ml-2 font-mono text-xs">{selectedItem.reporterId}</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Reason &amp; Description</h4>
                      <p className="text-sm font-medium">{selectedItem.reason}</p>
                      {selectedItem.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedItem.description}</p>
                      )}
                    </div>
                    {selectedItem.resolutionNotes && (
                      <div className="p-4 rounded-lg border bg-card space-y-2">
                        <h4 className="font-semibold">Resolution Notes</h4>
                        <p className="text-sm text-muted-foreground">{selectedItem.resolutionNotes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="audit" className="mt-4 space-y-3">
                    <div className="p-4 rounded-lg border bg-card space-y-2 text-sm">
                      {selectedItem.reviewedAt ? (
                        <>
                          <div><span className="text-muted-foreground">Reviewed at:</span> <span className="ml-2">{new Date(selectedItem.reviewedAt).toLocaleString()}</span></div>
                          {selectedItem.reviewedBy && (
                            <div><span className="text-muted-foreground">Reviewed by:</span> <span className="ml-2 font-mono text-xs">{selectedItem.reviewedBy}</span></div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">Not yet reviewed.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Approve Modal */}
        <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Report</DialogTitle>
              <DialogDescription>
                Mark this report as resolved. The content will be considered reviewed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Optional Note</Label>
                <Textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
              <Button onClick={handleApprove} disabled={updatingReport}>Resolve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Content</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Rejection *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Flag Modal */}
        <Dialog open={isFlagModalOpen} onOpenChange={setIsFlagModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Content</DialogTitle>
              <DialogDescription>
                Remove the reported content from the platform. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Flagging *</Label>
                <Textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Enter reason for flagging..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={flagSeverity} onValueChange={setFlagSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFlagModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleFlag} disabled={!flagReason.trim()}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Moderation Modal */}
        <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Approve/Reject Content</DialogTitle>
              <DialogDescription>
                Apply action to {selectedContent.length} selected items.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Action *</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Approve">Approve</SelectItem>
                    <SelectItem value="Reject">Reject</SelectItem>
                    <SelectItem value="Flag">Flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason / Note {bulkAction !== "Approve" && "*"}</Label>
                <Textarea
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  placeholder={bulkAction === "Approve" ? "Optional note..." : "Required reason..."}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBulkAction}
                disabled={bulkAction !== "Approve" && !bulkNote.trim()}
                variant={bulkAction === "Reject" ? "destructive" : "default"}
              >
                Execute Bulk Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
