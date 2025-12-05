import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Eye,
  UserCheck,
  Edit,
  ArrowUp,
  CheckCircle,
  Trash2,
  MoreHorizontal,
  Download,
  ChevronDown,
  Paperclip,
  Send,
  AlertTriangle,
  Receipt,
  FileText,
  Users,
  Store,
  Shield,
} from "lucide-react";

// Mock data
const mockDisputes = [
  {
    id: "DSP-001",
    type: "Escrow",
    title_summary: "Escrow funds not released after delivery confirmation",
    status: "Open",
    priority: "Critical",
    raised_by: "John Doe",
    raised_by_email: "john@example.com",
    assigned_admin: "Admin Sarah",
    related_entity: "TXN-45892",
    created_at: "2024-11-30 10:15",
    last_updated: "2024-11-30 14:32",
    description: "I completed a transaction and the buyer confirmed delivery 5 days ago, but the escrow funds have not been released to my account. I have contacted support multiple times with no resolution.",
  },
  {
    id: "DSP-002",
    type: "Transaction",
    title_summary: "Incorrect amount charged for service",
    status: "In Review",
    priority: "High",
    raised_by: "Jane Smith",
    raised_by_email: "jane@example.com",
    assigned_admin: "Admin Mike",
    related_entity: "TXN-45123",
    created_at: "2024-11-29 16:45",
    last_updated: "2024-11-30 09:20",
    description: "I was charged $150 for a service that was listed at $100. The vendor claims it was a premium service but this was not disclosed.",
  },
  {
    id: "DSP-003",
    type: "Content",
    title_summary: "Post removed without proper notification",
    status: "Resolved",
    priority: "Medium",
    raised_by: "Bob Wilson",
    raised_by_email: "bob@example.com",
    assigned_admin: "Admin Lisa",
    related_entity: "CNT-78234",
    created_at: "2024-11-28 11:30",
    last_updated: "2024-11-29 15:00",
    description: "My community event post was removed without any notification or explanation. I believe it followed all community guidelines.",
  },
  {
    id: "DSP-004",
    type: "Vendor Issue",
    title_summary: "Vendor delivered damaged goods",
    status: "Escalated",
    priority: "High",
    raised_by: "Alice Brown",
    raised_by_email: "alice@example.com",
    assigned_admin: "System Admin",
    related_entity: "V002 - ProServices Hub",
    created_at: "2024-11-27 09:00",
    last_updated: "2024-11-30 11:00",
    description: "Received damaged products from vendor. Vendor refuses to provide refund or replacement. Escalated for mediation.",
  },
  {
    id: "DSP-005",
    type: "Community Issue",
    title_summary: "Harassment from community member",
    status: "Closed",
    priority: "Critical",
    raised_by: "Charlie Davis",
    raised_by_email: "charlie@example.com",
    assigned_admin: "Admin Sarah",
    related_entity: "Belgian Ghanaians Community",
    created_at: "2024-11-20 14:20",
    last_updated: "2024-11-25 16:00",
    description: "Reported harassment from another community member. Resolved with member being warned and content removed.",
  },
];

const mockConversation = [
  {
    id: "MSG-001",
    sender: "John Doe",
    sender_type: "user",
    message: "I completed a transaction 5 days ago but the escrow funds have not been released. Transaction ID: TXN-45892. The buyer has confirmed delivery.",
    attachments: ["delivery_confirmation.pdf"],
    timestamp: "2024-11-30 10:15",
  },
  {
    id: "MSG-002",
    sender: "Admin Sarah",
    sender_type: "admin",
    message: "Hi John, thank you for reaching out. I'm investigating your case now. Can you please confirm the exact date the buyer confirmed delivery?",
    attachments: [],
    timestamp: "2024-11-30 11:30",
  },
  {
    id: "MSG-003",
    sender: "John Doe",
    sender_type: "user",
    message: "The buyer confirmed on November 25th. I have attached a screenshot of the confirmation notification.",
    attachments: ["confirmation_screenshot.png"],
    timestamp: "2024-11-30 12:45",
  },
  {
    id: "MSG-004",
    sender: "Admin Sarah",
    sender_type: "admin",
    message: "I've identified the issue. There was a hold placed on escrow releases due to a system update. I've escalated this to the finance team. Your funds should be released within 24-48 hours.",
    attachments: [],
    timestamp: "2024-11-30 14:32",
  },
];

const mockHistory = [
  { timestamp: "2024-11-30 14:32", action: "Comment Added", performed_by: "Admin Sarah", notes: "Escalated to finance team for fund release" },
  { timestamp: "2024-11-30 11:30", action: "Comment Added", performed_by: "Admin Sarah", notes: "Initial response sent to user" },
  { timestamp: "2024-11-30 10:20", action: "Dispute Assigned", performed_by: "System", notes: "Auto-assigned to Admin Sarah based on dispute type" },
  { timestamp: "2024-11-30 10:15", action: "Dispute Created", performed_by: "John Doe", notes: "New dispute submitted" },
];

const admins = ["Admin Sarah", "Admin Mike", "Admin John", "Admin Lisa", "System Admin"];

export default function DisputesResolution() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDisputes, setSelectedDisputes] = useState<string[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<typeof mockDisputes[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    type: "Transaction",
    related_entity: "",
    priority: "Medium",
    description: "",
    assigned_admin: "",
  });
  const [assignTo, setAssignTo] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [newStatus, setNewStatus] = useState("Open");
  const [statusNotes, setStatusNotes] = useState("");
  const [escalateTo, setEscalateTo] = useState("System Admin");
  const [escalateReason, setEscalateReason] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Open: "secondary",
      "In Review": "default",
      Resolved: "outline",
      Escalated: "destructive",
      Closed: "outline",
    };
    const colors: Record<string, string> = {
      "In Review": "bg-blue-600 hover:bg-blue-600",
      Resolved: "bg-green-600 hover:bg-green-600 text-white",
      Escalated: "bg-orange-500 hover:bg-orange-500",
    };
    return <Badge variant={variants[status]} className={colors[status] || ""}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Critical: "destructive",
      High: "destructive",
      Medium: "secondary",
      Low: "outline",
    };
    const colors: Record<string, string> = {
      Critical: "bg-red-600 hover:bg-red-600",
      High: "bg-orange-500 hover:bg-orange-500",
    };
    return <Badge variant={variants[priority]} className={colors[priority] || ""}>{priority}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Transaction": return <Receipt className="h-4 w-4" />;
      case "Escrow": return <Shield className="h-4 w-4" />;
      case "Content": return <FileText className="h-4 w-4" />;
      case "Community Issue": return <Users className="h-4 w-4" />;
      case "Vendor Issue": return <Store className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDisputes(mockDisputes.map((d) => d.id));
    } else {
      setSelectedDisputes([]);
    }
  };

  const handleSelectDispute = (disputeId: string, checked: boolean) => {
    if (checked) {
      setSelectedDisputes([...selectedDisputes, disputeId]);
    } else {
      setSelectedDisputes(selectedDisputes.filter((id) => id !== disputeId));
    }
  };

  const openDisputeDetail = (dispute: typeof mockDisputes[0]) => {
    setSelectedDispute(dispute);
    setIsDetailOpen(true);
  };

  const handleCreateDispute = () => {
    toast({ title: "Success", description: "Dispute created successfully." });
    setIsCreateModalOpen(false);
    setFormData({ type: "Transaction", related_entity: "", priority: "Medium", description: "", assigned_admin: "" });
  };

  const handleAssignDispute = () => {
    toast({ title: "Success", description: "Dispute assigned successfully." });
    setIsAssignModalOpen(false);
    setAssignTo("");
    setAssignNotes("");
  };

  const handleUpdateStatus = () => {
    toast({ title: "Success", description: "Dispute status updated successfully." });
    setIsStatusModalOpen(false);
    setStatusNotes("");
  };

  const handleEscalate = () => {
    toast({ title: "Success", description: "Dispute escalated successfully." });
    setIsEscalateModalOpen(false);
    setEscalateReason("");
  };

  const handleCloseDispute = () => {
    toast({ title: "Success", description: "Dispute closed successfully." });
    setIsCloseModalOpen(false);
  };

  const handleDeleteDispute = () => {
    toast({ title: "Success", description: "Dispute deleted successfully." });
    setIsDeleteModalOpen(false);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      toast({ title: "Success", description: "Message sent." });
      setNewMessage("");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('disputes.title')}</h1>
          <p className="text-muted-foreground">
            {t('disputes.searchPlaceholder')}
          </p>
        </div>

        {/* Top Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Dispute ID, user, vendor, association, keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedDisputes.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <DropdownMenuItem>Bulk Assign Disputes</DropdownMenuItem>
                <DropdownMenuItem>Bulk Update Status</DropdownMenuItem>
                <DropdownMenuItem>Bulk Close Disputes</DropdownMenuItem>
                <DropdownMenuItem>Bulk Export Disputes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dispute
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Dispute Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Transaction">Transaction</SelectItem>
                <SelectItem value="Escrow">Escrow</SelectItem>
                <SelectItem value="Content">Content</SelectItem>
                <SelectItem value="Community Issue">Community Issue</SelectItem>
                <SelectItem value="Vendor Issue">Vendor Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="mt-5" onClick={() => {
            setStatusFilter("all");
            setPriorityFilter("all");
            setTypeFilter("all");
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
                    checked={selectedDisputes.length === mockDisputes.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Dispute ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title / Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDisputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDisputes.includes(dispute.id)}
                      onCheckedChange={(checked) => handleSelectDispute(dispute.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{dispute.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(dispute.type)}
                      <span className="text-sm">{dispute.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{dispute.title_summary}</TableCell>
                  <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                  <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                  <TableCell>{dispute.raised_by}</TableCell>
                  <TableCell>{dispute.assigned_admin}</TableCell>
                  <TableCell className="text-sm">{dispute.created_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDisputeDetail(dispute)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedDispute(dispute); setIsAssignModalOpen(true); }}>
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedDispute(dispute); setNewStatus(dispute.status); setIsStatusModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => { setSelectedDispute(dispute); setIsEscalateModalOpen(true); }}>
                            <ArrowUp className="mr-2 h-4 w-4" /> Escalate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedDispute(dispute); setIsCloseModalOpen(true); }}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Close Dispute
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedDispute(dispute); setIsDeleteModalOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Dispute
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Dispute Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedDispute && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    {selectedDispute.title_summary}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{selectedDispute.id}</Badge>
                    <Badge variant="outline">{selectedDispute.type}</Badge>
                    {getPriorityBadge(selectedDispute.priority)}
                    {getStatusBadge(selectedDispute.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Raised by {selectedDispute.raised_by} | Assigned to {selectedDispute.assigned_admin}
                  </p>
                </SheetHeader>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setIsAssignModalOpen(true); }}>
                    <UserCheck className="mr-2 h-4 w-4" /> Assign
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setNewStatus(selectedDispute.status); setIsStatusModalOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" /> Update Status
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setIsEscalateModalOpen(true); }}>
                    <ArrowUp className="mr-2 h-4 w-4" /> Escalate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setIsCloseModalOpen(true); }}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Close
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="conversation">Conversation</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Dispute Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Dispute ID:</span> <span className="ml-2">{selectedDispute.id}</span></div>
                        <div><span className="text-muted-foreground">Type:</span> <span className="ml-2">{selectedDispute.type}</span></div>
                        <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selectedDispute.status}</span></div>
                        <div><span className="text-muted-foreground">Priority:</span> <span className="ml-2">{selectedDispute.priority}</span></div>
                        <div><span className="text-muted-foreground">Raised By:</span> <span className="ml-2">{selectedDispute.raised_by}</span></div>
                        <div><span className="text-muted-foreground">Assigned:</span> <span className="ml-2">{selectedDispute.assigned_admin}</span></div>
                        <div><span className="text-muted-foreground">Related Entity:</span> <span className="ml-2">{selectedDispute.related_entity}</span></div>
                        <div><span className="text-muted-foreground">Created:</span> <span className="ml-2">{selectedDispute.created_at}</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Description</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedDispute.description}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="conversation" className="mt-4">
                    <div className="space-y-4">
                      <ScrollArea className="h-[300px] rounded-lg border p-4">
                        <div className="space-y-4">
                          {mockConversation.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.sender_type === "admin" ? "flex-row-reverse" : ""}`}>
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={msg.sender_type === "admin" ? "bg-primary text-primary-foreground" : ""}>
                                  {msg.sender.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`flex-1 max-w-[80%] ${msg.sender_type === "admin" ? "text-right" : ""}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{msg.sender}</span>
                                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                                </div>
                                <div className={`p-3 rounded-lg text-sm ${msg.sender_type === "admin" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}>
                                  {msg.message}
                                </div>
                                {msg.attachments.length > 0 && (
                                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Paperclip className="h-3 w-3" />
                                    {msg.attachments.join(", ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Write your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                        />
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="icon">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button size="icon" onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    <div className="flex justify-end mb-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Export History (CSV)
                      </Button>
                    </div>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Performed By</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockHistory.map((log, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{log.timestamp}</TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell>{log.performed_by}</TableCell>
                              <TableCell className="max-w-xs truncate">{log.notes}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Create Dispute Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Dispute</DialogTitle>
              <DialogDescription>Create a new dispute case.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dispute Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Transaction">Transaction</SelectItem>
                    <SelectItem value="Escrow">Escrow</SelectItem>
                    <SelectItem value="Content">Content</SelectItem>
                    <SelectItem value="Community Issue">Community Issue</SelectItem>
                    <SelectItem value="Vendor Issue">Vendor Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Related Entity *</Label>
                <Input
                  value={formData.related_entity}
                  onChange={(e) => setFormData({ ...formData, related_entity: e.target.value })}
                  placeholder="Transaction ID, Post ID, Vendor, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description / Details *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the dispute..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign Admin</Label>
                <Select value={formData.assigned_admin} onValueChange={(v) => setFormData({ ...formData, assigned_admin: v })}>
                  <SelectTrigger><SelectValue placeholder="Select admin..." /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {admins.map((admin) => (
                      <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateDispute} disabled={!formData.related_entity || !formData.description}>Create Dispute</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Dispute Modal */}
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign / Change Admin</DialogTitle>
              <DialogDescription>Assign this dispute to an admin.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assign To *</Label>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger><SelectValue placeholder="Select admin..." /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {admins.map((admin) => (
                      <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignDispute} disabled={!assignTo}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Modal */}
        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Dispute Status</DialogTitle>
              <DialogDescription>Change the status of this dispute.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes / Resolution Steps</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Escalate Dispute Modal */}
        <Dialog open={isEscalateModalOpen} onOpenChange={setIsEscalateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escalate Dispute</DialogTitle>
              <DialogDescription>Escalate this dispute to a higher authority.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Escalate To *</Label>
                <Select value={escalateTo} onValueChange={setEscalateTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="System Admin">System Admin</SelectItem>
                    <SelectItem value="External Mediator">External Mediator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason for Escalation *</Label>
                <Textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Explain why this dispute needs escalation..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEscalateModalOpen(false)}>Cancel</Button>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleEscalate} disabled={!escalateReason.trim()}>Escalate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Dispute Modal */}
        <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Dispute</DialogTitle>
              <DialogDescription>
                Are you sure you want to close this dispute? Ensure resolution is confirmed before closing.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCloseDispute}>Close Dispute</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dispute Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Dispute</DialogTitle>
              <DialogDescription>
                Deleting a dispute is irreversible and will remove all associated messages, attachments, and history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteDispute}>Delete Dispute</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
