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
  XCircle,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EscrowTransaction {
  id: string;
  transactionId: string;
  createdBy: string;
  recipient: string;
  type: "Project Payment" | "Product Purchase" | "Service Payment";
  amount: number;
  status: "Pending Funding" | "Funded" | "In Progress" | "Released" | "Disputed" | "Cancelled";
  createdAt: string;
  lastUpdated: string;
  description?: string;
}

const mockTransactions: EscrowTransaction[] = [
  {
    id: "1",
    transactionId: "ESC-2024-001",
    createdBy: "John Doe",
    recipient: "ABC Contractors",
    type: "Project Payment",
    amount: 15000,
    status: "Funded",
    createdAt: "2024-01-15T10:30:00Z",
    lastUpdated: "2024-01-15T10:30:00Z",
    description: "Community center renovation project - Phase 1",
  },
  {
    id: "2",
    transactionId: "ESC-2024-002",
    createdBy: "Jane Smith",
    recipient: "XYZ Supplies",
    type: "Product Purchase",
    amount: 3500,
    status: "In Progress",
    createdAt: "2024-01-14T14:20:00Z",
    lastUpdated: "2024-01-16T09:15:00Z",
    description: "Office equipment purchase for community hall",
  },
  {
    id: "3",
    transactionId: "ESC-2024-003",
    createdBy: "Mike Johnson",
    recipient: "Green Gardens LLC",
    type: "Service Payment",
    amount: 8000,
    status: "Disputed",
    createdAt: "2024-01-10T08:00:00Z",
    lastUpdated: "2024-01-17T11:45:00Z",
    description: "Landscaping services for common areas",
  },
  {
    id: "4",
    transactionId: "ESC-2024-004",
    createdBy: "Sarah Williams",
    recipient: "Tech Solutions Inc",
    type: "Service Payment",
    amount: 12000,
    status: "Released",
    createdAt: "2024-01-08T16:00:00Z",
    lastUpdated: "2024-01-18T10:00:00Z",
    description: "IT infrastructure setup",
  },
  {
    id: "5",
    transactionId: "ESC-2024-005",
    createdBy: "Tom Brown",
    recipient: "Security First Co",
    type: "Project Payment",
    amount: 25000,
    status: "Pending Funding",
    createdAt: "2024-01-18T09:30:00Z",
    lastUpdated: "2024-01-18T09:30:00Z",
    description: "Security system installation project",
  },
];

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

export default function EscrowManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [releaseAmount, setReleaseAmount] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const getStatusBadge = (status: EscrowTransaction["status"]) => {
    const variants: Record<EscrowTransaction["status"], { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      "Pending Funding": { variant: "outline", className: "border-yellow-500/50 text-yellow-400" },
      "Funded": { variant: "default", className: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
      "In Progress": { variant: "default", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" },
      "Released": { variant: "default", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" },
      "Disputed": { variant: "destructive", className: "bg-red-500/20 text-red-400 border-red-500/50" },
      "Cancelled": { variant: "secondary", className: "bg-muted text-muted-foreground" },
    };
    const { className } = variants[status];
    return <Badge variant="outline" className={className}>{status}</Badge>;
  };

  const getTypeBadge = (type: EscrowTransaction["type"]) => {
    const colors: Record<EscrowTransaction["type"], string> = {
      "Project Payment": "bg-purple-500/20 text-purple-400 border-purple-500/50",
      "Product Purchase": "bg-orange-500/20 text-orange-400 border-orange-500/50",
      "Service Payment": "bg-teal-500/20 text-teal-400 border-teal-500/50",
    };
    return <Badge variant="outline" className={colors[type]}>{type}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
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
    setSelectedTransactions(checked ? mockTransactions.map((t) => t.id) : []);
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    setSelectedTransactions((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const openDetail = (transaction: EscrowTransaction) => {
    setSelectedTransaction(transaction);
    setDetailOpen(true);
  };

  const openReleaseModal = (transaction: EscrowTransaction) => {
    setSelectedTransaction(transaction);
    setReleaseAmount(transaction.amount.toString());
    setReleaseModalOpen(true);
  };

  const openDisputeModal = (transaction: EscrowTransaction) => {
    setSelectedTransaction(transaction);
    setDisputeModalOpen(true);
  };

  const openCancelModal = (transaction: EscrowTransaction) => {
    setSelectedTransaction(transaction);
    setCancelModalOpen(true);
  };

  const handleReleaseFunds = () => {
    toast({
      title: "Funds Released",
      description: `${formatCurrency(parseFloat(releaseAmount))} has been released for ${selectedTransaction?.transactionId}`,
    });
    setReleaseModalOpen(false);
    setReleaseAmount("");
    setReleaseNotes("");
  };

  const handleRaiseDispute = () => {
    toast({
      title: "Dispute Raised",
      description: `A dispute has been raised for ${selectedTransaction?.transactionId}`,
      variant: "destructive",
    });
    setDisputeModalOpen(false);
    setDisputeReason("");
  };

  const handleCancelTransaction = () => {
    toast({
      title: "Transaction Cancelled",
      description: `${selectedTransaction?.transactionId} has been cancelled`,
    });
    setCancelModalOpen(false);
    setCancelReason("");
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your escrow transactions export is being prepared",
    });
  };

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.createdBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

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
                placeholder="Transaction ID, user, vendor, association..."
                className="pl-10 bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-card border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending Funding">Pending Funding</SelectItem>
                <SelectItem value="Funded">Funded</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Released">Released</SelectItem>
                <SelectItem value="Disputed">Disputed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[170px] bg-card border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Project Payment">Project Payment</SelectItem>
                <SelectItem value="Product Purchase">Product Purchase</SelectItem>
                <SelectItem value="Service Payment">Service Payment</SelectItem>
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
                    checked={selectedTransactions.length === mockTransactions.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-border">
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{transaction.transactionId}</TableCell>
                  <TableCell className="text-muted-foreground">{transaction.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{transaction.recipient}</TableCell>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell className="font-semibold text-foreground">{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(transaction.lastUpdated)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => openDetail(transaction)}>
                          <Eye className="h-4 w-4 mr-2" /> View Transaction
                        </DropdownMenuItem>
                        {transaction.status !== "Released" && transaction.status !== "Cancelled" && (
                          <DropdownMenuItem onClick={() => openReleaseModal(transaction)}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Release Funds
                          </DropdownMenuItem>
                        )}
                        {transaction.status !== "Disputed" && transaction.status !== "Cancelled" && (
                          <DropdownMenuItem onClick={() => openDisputeModal(transaction)}>
                            <AlertCircle className="h-4 w-4 mr-2" /> Raise Dispute
                          </DropdownMenuItem>
                        )}
                        {transaction.status !== "Released" && transaction.status !== "Cancelled" && (
                          <DropdownMenuItem onClick={() => openCancelModal(transaction)} className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" /> Cancel Transaction
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
              Showing {filteredTransactions.length} of {mockTransactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-primary/10 border-primary/50">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Transaction Detail Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl bg-card border-border overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground">{selectedTransaction?.transactionId}</SheetTitle>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedTransaction && getTypeBadge(selectedTransaction.type)}
                {selectedTransaction && getStatusBadge(selectedTransaction.status)}
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
                    <Label className="text-muted-foreground text-xs">Transaction ID</Label>
                    <p className="text-foreground font-medium">{selectedTransaction?.transactionId}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Amount</Label>
                    <p className="text-foreground font-semibold">{selectedTransaction && formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Created By</Label>
                    <p className="text-foreground">{selectedTransaction?.createdBy}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Recipient</Label>
                    <p className="text-foreground">{selectedTransaction?.recipient}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Created At</Label>
                    <p className="text-muted-foreground text-sm">{selectedTransaction && formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Last Updated</Label>
                    <p className="text-muted-foreground text-sm">{selectedTransaction && formatDate(selectedTransaction.lastUpdated)}</p>
                  </div>
                </div>
                <div className="space-y-1 pt-4 border-t border-border">
                  <Label className="text-muted-foreground text-xs">Description / Notes</Label>
                  <p className="text-foreground">{selectedTransaction?.description || "No description provided"}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedTransaction?.status !== "Released" && selectedTransaction?.status !== "Cancelled" && (
                    <>
                      <Button onClick={() => { setDetailOpen(false); openReleaseModal(selectedTransaction!); }} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> Release Funds
                      </Button>
                      <Button variant="outline" onClick={() => { setDetailOpen(false); openDisputeModal(selectedTransaction!); }} className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
                        <AlertCircle className="h-4 w-4 mr-2" /> Raise Dispute
                      </Button>
                      <Button variant="outline" onClick={() => { setDetailOpen(false); openCancelModal(selectedTransaction!); }} className="border-destructive/50 text-destructive hover:bg-destructive/10">
                        <XCircle className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </>
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
                            <TableCell className="text-muted-foreground text-sm">{entry.timestamp}</TableCell>
                            <TableCell className="text-foreground">{entry.action}</TableCell>
                            <TableCell className="text-muted-foreground">{entry.performedBy}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{entry.notes}</TableCell>
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
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-foreground text-sm font-medium">{file.name}</p>
                            <p className="text-muted-foreground text-xs">Uploaded by {file.uploadedBy} on {file.uploadedAt} • {file.size}</p>
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

        {/* Release Funds Modal */}
        <Dialog open={releaseModalOpen} onOpenChange={setReleaseModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Release Escrow Funds</DialogTitle>
              <DialogDescription>
                Release funds for {selectedTransaction?.transactionId} to {selectedTransaction?.recipient}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="releaseAmount">Release Amount *</Label>
                <Input
                  id="releaseAmount"
                  type="number"
                  value={releaseAmount}
                  onChange={(e) => setReleaseAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={selectedTransaction?.amount}
                />
                <p className="text-xs text-muted-foreground">Max: {selectedTransaction && formatCurrency(selectedTransaction.amount)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseNotes">Notes / Confirmation</Label>
                <Textarea
                  id="releaseNotes"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Add notes for this release..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReleaseModalOpen(false)}>Cancel</Button>
              <Button onClick={handleReleaseFunds} className="bg-emerald-600 hover:bg-emerald-700">Release Funds</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Raise Dispute Modal */}
        <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Raise Dispute</DialogTitle>
              <DialogDescription>
                Raise a dispute for {selectedTransaction?.transactionId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="disputeReason">Reason for Dispute *</Label>
                <Textarea
                  id="disputeReason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the reason for this dispute..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag and drop files or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 5 files</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>Cancel</Button>
              <Button onClick={handleRaiseDispute} variant="destructive" className="bg-yellow-600 hover:bg-yellow-700">Submit Dispute</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Transaction Modal */}
        <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Cancel Escrow Transaction</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel {selectedTransaction?.transactionId}? Funds already released cannot be reversed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Reason *</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Provide reason for cancellation..."
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCancelTransaction} variant="destructive">Cancel Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
