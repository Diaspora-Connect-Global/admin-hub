import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminListEscrows,
  useAdminForceReleaseEscrow,
  useAdminFreezeEscrow,
  useAdminUnfreezeEscrow,
  type AdminEscrow,
} from "@/hooks/admin";

const mockHistory = [
  { timestamp: "2024-01-18 10:00", action: "Funds Released", performedBy: "Admin User", notes: "Full release approved" },
  { timestamp: "2024-01-16 14:30", action: "Milestone Verified", performedBy: "System", notes: "Phase 1 completion confirmed" },
  { timestamp: "2024-01-15 10:30", action: "Transaction Funded", performedBy: "John Doe", notes: "Initial funding completed" },
  { timestamp: "2024-01-15 09:00", action: "Transaction Created", performedBy: "John Doe", notes: "Escrow transaction initiated" },
];

const mockAttachments = [
  { name: "invoice_001.pdf", uploadedBy: "John Doe", uploadedAt: "2024-01-15", size: "245 KB" },
  { name: "contract_signed.pdf", uploadedBy: "ABC Contractors", uploadedAt: "2024-01-14", size: "1.2 MB" },
  { name: "delivery_proof.jpg", uploadedBy: "ABC Contractors", uploadedAt: "2024-01-17", size: "856 KB" },
];

// Map API uppercase statuses to display labels
const STATUS_DISPLAY: Record<AdminEscrow["status"], string> = {
  HELD: "Held",
  RELEASED: "Released",
  FROZEN: "Frozen",
  REFUNDED: "Refunded",
};

export default function EscrowManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedEscrow, setSelectedEscrow] = useState<AdminEscrow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [unfreezeModalOpen, setUnfreezeModalOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [freezeDisputeId, setFreezeDisputeId] = useState("");

  // Live data
  const { data, loading, refetch } = useAdminListEscrows({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: LIMIT,
  });

  const [forceRelease, { loading: releasing }] = useAdminForceReleaseEscrow();
  const [freezeEscrow, { loading: freezing }] = useAdminFreezeEscrow();
  const [unfreezeEscrow, { loading: unfreezing }] = useAdminUnfreezeEscrow();

  const escrows: AdminEscrow[] = data?.adminListEscrows?.escrows ?? [];
  const total: number = data?.adminListEscrows?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Client-side search filter (id / paymentIntentId)
  const filteredEscrows = escrows.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.id.toLowerCase().includes(q) ||
      (e.paymentIntentId ?? "").toLowerCase().includes(q) ||
      (e.disputeId ?? "").toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: AdminEscrow["status"]) => {
    const variants: Record<AdminEscrow["status"], string> = {
      HELD: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      RELEASED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      FROZEN: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      REFUNDED: "bg-muted text-muted-foreground",
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {STATUS_DISPLAY[status]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedTransactions(checked ? filteredEscrows.map((e) => e.id) : []);
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    setSelectedTransactions((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const openDetail = (escrow: AdminEscrow) => {
    setSelectedEscrow(escrow);
    setDetailOpen(true);
  };

  const openReleaseModal = (escrow: AdminEscrow) => {
    setSelectedEscrow(escrow);
    setReleaseModalOpen(true);
  };

  const openFreezeModal = (escrow: AdminEscrow) => {
    setSelectedEscrow(escrow);
    setFreezeDisputeId(escrow.disputeId ?? "");
    setFreezeModalOpen(true);
  };

  const openUnfreezeModal = (escrow: AdminEscrow) => {
    setSelectedEscrow(escrow);
    setUnfreezeModalOpen(true);
  };

  const handleForceRelease = async () => {
    if (!selectedEscrow) return;
    try {
      await forceRelease({
        variables: { escrowId: selectedEscrow.id, reason: releaseNotes },
      });
      toast({
        title: "Funds Force-Released",
        description: `Escrow ${selectedEscrow.id} has been force-released.`,
      });
      setReleaseModalOpen(false);
      setReleaseNotes("");
      refetch();
    } catch (err: unknown) {
      toast({
        title: "Release Failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleFreeze = async () => {
    if (!selectedEscrow) return;
    try {
      await freezeEscrow({
        variables: {
          escrowId: selectedEscrow.id,
          disputeId: freezeDisputeId,
          reason: freezeReason,
        },
      });
      toast({
        title: "Escrow Frozen",
        description: `Escrow ${selectedEscrow.id} has been frozen.`,
      });
      setFreezeModalOpen(false);
      setFreezeReason("");
      setFreezeDisputeId("");
      refetch();
    } catch (err: unknown) {
      toast({
        title: "Freeze Failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUnfreeze = async () => {
    if (!selectedEscrow) return;
    try {
      await unfreezeEscrow({
        variables: {
          escrowId: selectedEscrow.id,
          disputeId: selectedEscrow.disputeId ?? "",
        },
      });
      toast({
        title: "Escrow Unfrozen",
        description: `Escrow ${selectedEscrow.id} has been unfrozen.`,
      });
      setUnfreezeModalOpen(false);
      refetch();
    } catch (err: unknown) {
      toast({
        title: "Unfreeze Failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your escrow transactions export is being prepared",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('escrow.title')}</h1>
          <p className="text-muted-foreground">{t('escrow.searchPlaceholder')}</p>
        </div>

        {/* Top Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Escrow ID, payment intent, dispute ID..."
                className="pl-10 bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-card border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="HELD">Held</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
                <SelectItem value="FROZEN">Frozen</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export Transactions
          </Button>
        </div>

        {/* Table */}
        <div className="glass rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredEscrows.length > 0 && selectedTransactions.length === filteredEscrows.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Escrow ID</TableHead>
                <TableHead>Payment Intent</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Released</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    Loading escrows...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredEscrows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    No escrow transactions found.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredEscrows.map((escrow) => (
                <TableRow key={escrow.id} className="border-border">
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.includes(escrow.id)}
                      onCheckedChange={(checked) =>
                        handleSelectTransaction(escrow.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground font-mono text-xs">
                    {escrow.id}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {escrow.paymentIntentId ?? "—"}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {formatCurrency(escrow.totalAmount, escrow.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {escrow.releasedAmount != null
                      ? formatCurrency(escrow.releasedAmount, escrow.currency)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {escrow.remainingAmount != null
                      ? formatCurrency(escrow.remainingAmount, escrow.currency)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground uppercase text-xs">
                    {escrow.currency ?? "USD"}
                  </TableCell>
                  <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(escrow.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => openDetail(escrow)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {escrow.status !== "RELEASED" && escrow.status !== "REFUNDED" && (
                          <DropdownMenuItem onClick={() => openReleaseModal(escrow)}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Force Release
                          </DropdownMenuItem>
                        )}
                        {escrow.status === "HELD" && (
                          <DropdownMenuItem onClick={() => openFreezeModal(escrow)}>
                            <Lock className="h-4 w-4 mr-2" /> Freeze Escrow
                          </DropdownMenuItem>
                        )}
                        {escrow.status === "FROZEN" && (
                          <DropdownMenuItem onClick={() => openUnfreezeModal(escrow)}>
                            <Unlock className="h-4 w-4 mr-2" /> Unfreeze Escrow
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEscrows.length} of {total} escrows
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  className={p === page ? "bg-primary/10 border-primary/50" : ""}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Escrow Detail Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl bg-card border-border overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground font-mono text-sm">
                {selectedEscrow?.id}
              </SheetTitle>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedEscrow && getStatusBadge(selectedEscrow.status)}
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Escrow ID</Label>
                    <p className="text-foreground font-medium font-mono text-xs break-all">
                      {selectedEscrow?.id}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Payment Intent ID</Label>
                    <p className="text-foreground font-mono text-xs break-all">
                      {selectedEscrow?.paymentIntentId ?? "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Total Amount</Label>
                    <p className="text-foreground font-semibold">
                      {selectedEscrow &&
                        formatCurrency(selectedEscrow.totalAmount, selectedEscrow.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Released Amount</Label>
                    <p className="text-foreground">
                      {selectedEscrow?.releasedAmount != null
                        ? formatCurrency(selectedEscrow.releasedAmount, selectedEscrow.currency)
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Remaining Amount</Label>
                    <p className="text-foreground">
                      {selectedEscrow?.remainingAmount != null
                        ? formatCurrency(selectedEscrow.remainingAmount, selectedEscrow.currency)
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Currency</Label>
                    <p className="text-foreground uppercase">
                      {selectedEscrow?.currency ?? "USD"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Release Mode</Label>
                    <p className="text-foreground">{selectedEscrow?.releaseMode ?? "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Dispute ID</Label>
                    <p className="text-foreground font-mono text-xs">
                      {selectedEscrow?.disputeId ?? "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Created At</Label>
                    <p className="text-muted-foreground text-sm">
                      {selectedEscrow && formatDate(selectedEscrow.createdAt)}
                    </p>
                  </div>
                  {selectedEscrow?.frozenAt && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Frozen At</Label>
                      <p className="text-muted-foreground text-sm">
                        {formatDate(selectedEscrow.frozenAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedEscrow?.status !== "RELEASED" &&
                    selectedEscrow?.status !== "REFUNDED" && (
                      <Button
                        onClick={() => {
                          setDetailOpen(false);
                          openReleaseModal(selectedEscrow!);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Force Release
                      </Button>
                    )}
                  {selectedEscrow?.status === "HELD" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailOpen(false);
                        openFreezeModal(selectedEscrow!);
                      }}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Lock className="h-4 w-4 mr-2" /> Freeze
                    </Button>
                  )}
                  {selectedEscrow?.status === "FROZEN" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailOpen(false);
                        openUnfreezeModal(selectedEscrow!);
                      }}
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Unlock className="h-4 w-4 mr-2" /> Unfreeze
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-foreground">Transaction History</h4>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Performed By</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockHistory.map((entry, index) => (
                          <TableRow key={index} className="border-border">
                            <TableCell className="text-muted-foreground text-sm">
                              {entry.timestamp}
                            </TableCell>
                            <TableCell className="text-foreground">{entry.action}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.performedBy}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {entry.notes}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-foreground">Attachments / Proof</h4>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" /> Upload File
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {mockAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-foreground text-sm font-medium">{file.name}</p>
                            <p className="text-muted-foreground text-xs">
                              Uploaded by {file.uploadedBy} on {file.uploadedAt} • {file.size}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>

        {/* Force Release Modal */}
        <Dialog open={releaseModalOpen} onOpenChange={setReleaseModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Force Release Escrow</DialogTitle>
              <DialogDescription>
                Force-release funds for escrow{" "}
                <span className="font-mono text-xs">{selectedEscrow?.id}</span>.
                Total:{" "}
                {selectedEscrow &&
                  formatCurrency(selectedEscrow.totalAmount, selectedEscrow.currency)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="releaseNotes">Reason for Release *</Label>
                <Textarea
                  id="releaseNotes"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Provide the reason for force-releasing these funds..."
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReleaseModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleForceRelease}
                disabled={!releaseNotes.trim() || releasing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {releasing ? "Releasing..." : "Force Release"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Freeze Escrow Modal */}
        <Dialog open={freezeModalOpen} onOpenChange={setFreezeModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Freeze Escrow</DialogTitle>
              <DialogDescription>
                Freeze escrow{" "}
                <span className="font-mono text-xs">{selectedEscrow?.id}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="freezeDisputeId">Dispute ID *</Label>
                <Input
                  id="freezeDisputeId"
                  value={freezeDisputeId}
                  onChange={(e) => setFreezeDisputeId(e.target.value)}
                  placeholder="Enter the associated dispute ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freezeReason">Reason *</Label>
                <Textarea
                  id="freezeReason"
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="Describe the reason for freezing this escrow..."
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFreezeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFreeze}
                disabled={!freezeReason.trim() || !freezeDisputeId.trim() || freezing}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {freezing ? "Freezing..." : "Freeze Escrow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unfreeze Escrow Modal */}
        <Dialog open={unfreezeModalOpen} onOpenChange={setUnfreezeModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Unfreeze Escrow</DialogTitle>
              <DialogDescription>
                Are you sure you want to unfreeze escrow{" "}
                <span className="font-mono text-xs">{selectedEscrow?.id}</span>?{" "}
                {selectedEscrow?.disputeId && (
                  <>
                    Linked dispute:{" "}
                    <span className="font-mono text-xs">{selectedEscrow.disputeId}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUnfreezeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUnfreeze}
                disabled={unfreezing}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {unfreezing ? "Unfreezing..." : "Unfreeze Escrow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
