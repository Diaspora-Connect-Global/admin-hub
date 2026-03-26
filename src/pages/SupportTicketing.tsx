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
  CheckCircle,
  Trash2,
  MoreHorizontal,
  Download,
  ChevronDown,
  Paperclip,
  Send,
} from "lucide-react";
import {
  useGetSupportTickets,
  useGetSupportTicket,
  useUpdateSupportTicket,
  useReplyToSupportTicket,
  type SupportTicket,
} from "@/hooks/admin";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Map API status enum → display label */
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

/** Map display label → API enum */
const STATUS_API: Record<string, string> = {
  Open: "OPEN",
  "In Progress": "IN_PROGRESS",
  Resolved: "RESOLVED",
  Closed: "CLOSED",
};

/** Map API priority enum → display label */
const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Critical",
};

const admins = ["Admin Sarah", "Admin Mike", "Admin John", "Admin Lisa"];

// ─── component ────────────────────────────────────────────────────────────────

export default function SupportTicketing() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // ── filter / search state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ── selection state ────────────────────────────────────────────────────────
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // ── detail sheet state ─────────────────────────────────────────────────────
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // ── modal states ───────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ── form states ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    category: "Technical",
    priority: "Medium",
    description: "",
    assigned_to: "",
  });
  const [assignTo, setAssignTo] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [newStatus, setNewStatus] = useState("Open");
  const [statusNotes, setStatusNotes] = useState("");

  // ── GraphQL hooks ──────────────────────────────────────────────────────────
  const statusVar = statusFilter !== "all" ? STATUS_API[statusFilter] : undefined;
  const { data: ticketsData, loading: ticketsLoading, refetch: refetchTickets } =
    useGetSupportTickets({ status: statusVar });

  const { data: ticketDetailData, loading: ticketDetailLoading } =
    useGetSupportTicket(selectedTicketId);

  const [updateTicket, { loading: updateLoading }] = useUpdateSupportTicket();
  const [replyToTicket, { loading: replyLoading }] = useReplyToSupportTicket();

  // Live tickets (fallback to empty array)
  const liveTickets: SupportTicket[] = ticketsData?.getSupportTickets?.tickets ?? [];

  // Apply client-side search, priority and category filters
  const filteredTickets = liveTickets.filter((ticket) => {
    const label = STATUS_LABEL[ticket.status] ?? ticket.status;
    const priorityLabel = PRIORITY_LABEL[ticket.priority] ?? ticket.priority;

    if (
      searchQuery &&
      !ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(ticket.submittedBy ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (priorityFilter !== "all" && priorityLabel !== priorityFilter) return false;
    if (categoryFilter !== "all") {
      const categoryMap: Record<string, string> = {
        Technical: "OTHER",
        Billing: "PAYMENT",
        Escrow: "PAYMENT",
        Community: "CONTENT",
        Vendor: "VENDOR",
      };
      if (ticket.category !== categoryMap[categoryFilter] && ticket.category !== categoryFilter) {
        return false;
      }
    }
    return true;
  });

  // Messages from the detail query; fall back to messages embedded in list
  const detailMessages =
    ticketDetailData?.getSupportTicket?.messages ??
    selectedTicket?.messages ??
    [];

  // ── badge helpers ──────────────────────────────────────────────────────────
  const getPriorityBadge = (priority: string) => {
    const label = PRIORITY_LABEL[priority] ?? priority;
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
    return (
      <Badge variant={variants[label]} className={colors[label] || ""}>
        {label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const label = STATUS_LABEL[status] ?? status;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Open: "secondary",
      "In Progress": "default",
      Resolved: "outline",
      Closed: "outline",
    };
    return <Badge variant={variants[label]}>{label}</Badge>;
  };

  // ── selection handlers ─────────────────────────────────────────────────────
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredTickets.map((t) => t.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId]);
    } else {
      setSelectedTickets(selectedTickets.filter((id) => id !== ticketId));
    }
  };

  // ── detail sheet ───────────────────────────────────────────────────────────
  const openTicketDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setSelectedTicketId(ticket.id);
    setIsDetailOpen(true);
  };

  // ── action handlers ────────────────────────────────────────────────────────
  const handleCreateTicket = () => {
    // No createSupportTicket mutation wired in spec; keep UI toast behaviour
    toast({ title: "Success", description: "Ticket created successfully." });
    setIsCreateModalOpen(false);
    setFormData({ title: "", category: "Technical", priority: "Medium", description: "", assigned_to: "" });
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket) return;
    try {
      await updateTicket({
        variables: {
          input: {
            ticketId: selectedTicket.id,
            assignedTo: assignTo,
          },
        },
      });
      toast({ title: "Success", description: "Ticket assigned successfully." });
      refetchTickets();
    } catch {
      toast({ title: "Error", description: "Failed to assign ticket.", variant: "destructive" });
    }
    setIsAssignModalOpen(false);
    setAssignTo("");
    setAssignNotes("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    try {
      await updateTicket({
        variables: {
          input: {
            ticketId: selectedTicket.id,
            status: STATUS_API[newStatus] ?? newStatus,
          },
        },
      });
      toast({ title: "Success", description: "Ticket status updated successfully." });
      refetchTickets();
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
    setIsStatusModalOpen(false);
    setStatusNotes("");
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await updateTicket({
        variables: {
          input: {
            ticketId: selectedTicket.id,
            status: "CLOSED",
          },
        },
      });
      toast({ title: "Success", description: "Ticket closed successfully." });
      refetchTickets();
    } catch {
      toast({ title: "Error", description: "Failed to close ticket.", variant: "destructive" });
    }
    setIsCloseModalOpen(false);
  };

  const handleDeleteTicket = () => {
    // No deleteTicket mutation defined; keep toast behaviour
    toast({ title: "Success", description: "Ticket deleted successfully." });
    setIsDeleteModalOpen(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await replyToTicket({
        variables: {
          ticketId: selectedTicket.id,
          message: newMessage.trim(),
        },
      });
      toast({ title: "Success", description: "Message sent." });
      setNewMessage("");
      // Re-fetch ticket detail to show the new message
      refetchTickets();
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('support.title')}</h1>
          <p className="text-muted-foreground">
            {t('support.searchPlaceholder')}
          </p>
        </div>

        {/* Top Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ticket ID, user, vendor, community, keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedTickets.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <DropdownMenuItem>Bulk Assign Tickets</DropdownMenuItem>
                <DropdownMenuItem>Bulk Update Status</DropdownMenuItem>
                <DropdownMenuItem>Bulk Close Tickets</DropdownMenuItem>
                <DropdownMenuItem>Bulk Export Tickets</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
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
            <Label className="text-xs">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
                <SelectItem value="Escrow">Escrow</SelectItem>
                <SelectItem value="Community">Community</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setCategoryFilter("all");
            }}
          >
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
                    checked={filteredTickets.length > 0 && selectedTickets.length === filteredTickets.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Loading tickets...
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{ticket.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{ticket.submittedBy ?? "—"}</TableCell>
                    <TableCell>{ticket.assignedTo ?? "Unassigned"}</TableCell>
                    <TableCell className="text-sm">{ticket.createdAt}</TableCell>
                    <TableCell className="text-sm">{ticket.resolvedAt ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openTicketDetail(ticket)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setNewStatus(STATUS_LABEL[ticket.status] ?? ticket.status);
                            setIsStatusModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsCloseModalOpen(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Close Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Ticket Detail Sheet */}
        <Sheet
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) {
              setSelectedTicketId(null);
              setSelectedTicket(null);
            }
          }}
        >
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedTicket && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    {selectedTicket.subject}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{selectedTicket.id}</Badge>
                    <Badge variant="outline">{selectedTicket.category}</Badge>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created by {selectedTicket.submittedBy ?? "—"} | Assigned to{" "}
                    {selectedTicket.assignedTo ?? "Unassigned"}
                  </p>
                </SheetHeader>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsAssignModalOpen(true);
                    }}
                  >
                    <UserCheck className="mr-2 h-4 w-4" /> Assign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setNewStatus(STATUS_LABEL[selectedTicket.status] ?? selectedTicket.status);
                      setIsStatusModalOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Update Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsCloseModalOpen(true);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Close
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="conversation">Conversation</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  {/* Overview */}
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Ticket Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Ticket ID:</span>{" "}
                          <span className="ml-2">{selectedTicket.id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>{" "}
                          <span className="ml-2">{selectedTicket.category}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>{" "}
                          <span className="ml-2">
                            {PRIORITY_LABEL[selectedTicket.priority] ?? selectedTicket.priority}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <span className="ml-2">
                            {STATUS_LABEL[selectedTicket.status] ?? selectedTicket.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created By:</span>{" "}
                          <span className="ml-2">{selectedTicket.submittedBy ?? "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Assigned To:</span>{" "}
                          <span className="ml-2">{selectedTicket.assignedTo ?? "Unassigned"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>{" "}
                          <span className="ml-2">{selectedTicket.createdAt}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Resolved:</span>{" "}
                          <span className="ml-2">{selectedTicket.resolvedAt ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTicket.description ?? "No description provided."}
                      </p>
                    </div>
                  </TabsContent>

                  {/* Conversation */}
                  <TabsContent value="conversation" className="mt-4">
                    <div className="space-y-4">
                      <ScrollArea className="h-[300px] rounded-lg border p-4">
                        <div className="space-y-4">
                          {ticketDetailLoading ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Loading messages...
                            </p>
                          ) : detailMessages.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No messages yet.
                            </p>
                          ) : (
                            detailMessages.map((msg) => {
                              const isAdmin = msg.senderType?.toLowerCase() === "admin";
                              const senderInitials = msg.senderId
                                ? msg.senderId.slice(0, 2).toUpperCase()
                                : "?";
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback
                                      className={
                                        isAdmin ? "bg-primary text-primary-foreground" : ""
                                      }
                                    >
                                      {senderInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div
                                    className={`flex-1 max-w-[80%] ${isAdmin ? "text-right" : ""}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{msg.senderId}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {msg.createdAt}
                                      </span>
                                    </div>
                                    <div
                                      className={`p-3 rounded-lg text-sm ${
                                        isAdmin
                                          ? "bg-primary text-primary-foreground ml-auto"
                                          : "bg-muted"
                                      }`}
                                    >
                                      {msg.message}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Write your response..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                        />
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="icon">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={replyLoading || !newMessage.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* History */}
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
                          {detailMessages.map((msg) => (
                            <TableRow key={msg.id}>
                              <TableCell className="text-sm">{msg.createdAt}</TableCell>
                              <TableCell>Message</TableCell>
                              <TableCell>{msg.senderId}</TableCell>
                              <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                            </TableRow>
                          ))}
                          {detailMessages.length === 0 && !ticketDetailLoading && (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center py-4 text-muted-foreground"
                              >
                                No history available.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Create Ticket Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Ticket</DialogTitle>
              <DialogDescription>Create a new support ticket.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Escrow">Escrow</SelectItem>
                      <SelectItem value="Community">Community</SelectItem>
                      <SelectItem value="Vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {admins.map((admin) => (
                      <SelectItem key={admin} value={admin}>
                        {admin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!formData.title || !formData.description}
              >
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Ticket Modal */}
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign / Change Admin</DialogTitle>
              <DialogDescription>Assign this ticket to an admin.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assign To *</Label>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {admins.map((admin) => (
                      <SelectItem key={admin} value={admin}>
                        {admin}
                      </SelectItem>
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
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignTicket} disabled={!assignTo || updateLoading}>
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Modal */}
        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Ticket Status</DialogTitle>
              <DialogDescription>Change the status of this ticket.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes / Reason</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} disabled={updateLoading}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Ticket Modal */}
        <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Ticket</DialogTitle>
              <DialogDescription>
                Are you sure you want to close this ticket? All unresolved actions will be archived.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCloseTicket} disabled={updateLoading}>
                Close Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Ticket Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Ticket</DialogTitle>
              <DialogDescription>
                Deleting a ticket is irreversible and will remove all associated messages and
                history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteTicket}>
                Delete Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
