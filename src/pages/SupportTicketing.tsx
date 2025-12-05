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
  MessageSquare,
  Clock,
  AlertCircle,
} from "lucide-react";

// Mock data
const mockTickets = [
  {
    id: "TKT-001",
    title: "Cannot access escrow funds",
    category: "Escrow",
    priority: "Critical",
    status: "Open",
    created_by: "John Doe",
    created_by_email: "john@example.com",
    assigned_to: "Admin Sarah",
    created_at: "2024-11-30 10:15",
    last_updated: "2024-11-30 14:32",
    description: "I completed a transaction 5 days ago but the escrow funds have not been released to my account. The buyer has confirmed delivery.",
  },
  {
    id: "TKT-002",
    title: "Payment processing error",
    category: "Billing",
    priority: "High",
    status: "In Progress",
    created_by: "Jane Smith",
    created_by_email: "jane@example.com",
    assigned_to: "Admin Mike",
    created_at: "2024-11-29 16:45",
    last_updated: "2024-11-30 09:20",
    description: "Getting error code E504 when trying to process payment for vendor subscription.",
  },
  {
    id: "TKT-003",
    title: "Community post flagged incorrectly",
    category: "Community",
    priority: "Medium",
    status: "Open",
    created_by: "Bob Wilson",
    created_by_email: "bob@example.com",
    assigned_to: "Unassigned",
    created_at: "2024-11-28 11:30",
    last_updated: "2024-11-28 11:30",
    description: "My post about community event was flagged as spam. It was a legitimate announcement.",
  },
  {
    id: "TKT-004",
    title: "Vendor profile not showing products",
    category: "Vendor",
    priority: "Medium",
    status: "Resolved",
    created_by: "TechGadgets Ltd",
    created_by_email: "support@techgadgets.com",
    assigned_to: "Admin Sarah",
    created_at: "2024-11-25 08:00",
    last_updated: "2024-11-27 15:45",
    description: "Products added to our vendor profile are not appearing on the marketplace.",
  },
  {
    id: "TKT-005",
    title: "Login issues on mobile app",
    category: "Technical",
    priority: "Low",
    status: "Closed",
    created_by: "Alice Brown",
    created_by_email: "alice@example.com",
    assigned_to: "Admin John",
    created_at: "2024-11-20 14:20",
    last_updated: "2024-11-22 10:00",
    description: "Intermittent login failures on iOS app version 2.3.1.",
  },
];

const mockConversation = [
  {
    id: "MSG-001",
    sender: "John Doe",
    sender_type: "user",
    message: "I completed a transaction 5 days ago but the escrow funds have not been released to my account. The buyer has confirmed delivery. Transaction ID: TXN-45892",
    attachments: [],
    timestamp: "2024-11-30 10:15",
  },
  {
    id: "MSG-002",
    sender: "Admin Sarah",
    sender_type: "admin",
    message: "Hi John, thank you for reaching out. I'm looking into your transaction now. Can you please confirm the buyer's email or username?",
    attachments: [],
    timestamp: "2024-11-30 11:30",
  },
  {
    id: "MSG-003",
    sender: "John Doe",
    sender_type: "user",
    message: "The buyer's email is mike.customer@email.com. Their username is mike_buyer.",
    attachments: ["screenshot_delivery.png"],
    timestamp: "2024-11-30 12:45",
  },
  {
    id: "MSG-004",
    sender: "Admin Sarah",
    sender_type: "admin",
    message: "I found the issue. There was a hold placed on escrow releases due to a system update. I've escalated this to the finance team and they should release your funds within 24 hours.",
    attachments: [],
    timestamp: "2024-11-30 14:32",
  },
];

const mockHistory = [
  { timestamp: "2024-11-30 14:32", action: "Comment Added", performed_by: "Admin Sarah", notes: "Escalated to finance team" },
  { timestamp: "2024-11-30 11:30", action: "Comment Added", performed_by: "Admin Sarah", notes: "Initial response sent" },
  { timestamp: "2024-11-30 10:20", action: "Ticket Assigned", performed_by: "System", notes: "Auto-assigned to Admin Sarah based on category" },
  { timestamp: "2024-11-30 10:15", action: "Ticket Created", performed_by: "John Doe", notes: "New ticket submitted" },
];

const admins = ["Admin Sarah", "Admin Mike", "Admin John", "Admin Lisa"];

export default function SupportTicketing() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
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
    return (
      <Badge variant={variants[priority]} className={colors[priority] || ""}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Open: "secondary",
      "In Progress": "default",
      Resolved: "outline",
      Closed: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(mockTickets.map((t) => t.id));
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

  const openTicketDetail = (ticket: typeof mockTickets[0]) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  const handleCreateTicket = () => {
    toast({ title: "Success", description: "Ticket created successfully." });
    setIsCreateModalOpen(false);
    setFormData({ title: "", category: "Technical", priority: "Medium", description: "", assigned_to: "" });
  };

  const handleAssignTicket = () => {
    toast({ title: "Success", description: "Ticket assigned successfully." });
    setIsAssignModalOpen(false);
    setAssignTo("");
    setAssignNotes("");
  };

  const handleUpdateStatus = () => {
    toast({ title: "Success", description: "Ticket status updated successfully." });
    setIsStatusModalOpen(false);
    setStatusNotes("");
  };

  const handleCloseTicket = () => {
    toast({ title: "Success", description: "Ticket closed successfully." });
    setIsCloseModalOpen(false);
  };

  const handleDeleteTicket = () => {
    toast({ title: "Success", description: "Ticket deleted successfully." });
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
                    checked={selectedTickets.length === mockTickets.length}
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
              {mockTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTickets.includes(ticket.id)}
                      onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticket.category}</Badge>
                  </TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{ticket.created_by}</TableCell>
                  <TableCell>{ticket.assigned_to}</TableCell>
                  <TableCell className="text-sm">{ticket.created_at}</TableCell>
                  <TableCell className="text-sm">{ticket.last_updated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openTicketDetail(ticket)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedTicket(ticket); setIsAssignModalOpen(true); }}>
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedTicket(ticket); setNewStatus(ticket.status); setIsStatusModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => { setSelectedTicket(ticket); setIsCloseModalOpen(true); }}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Close Ticket
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedTicket(ticket); setIsDeleteModalOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Ticket
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

        {/* Ticket Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedTicket && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    {selectedTicket.title}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{selectedTicket.id}</Badge>
                    <Badge variant="outline">{selectedTicket.category}</Badge>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created by {selectedTicket.created_by} | Assigned to {selectedTicket.assigned_to}
                  </p>
                </SheetHeader>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setIsAssignModalOpen(true); }}>
                    <UserCheck className="mr-2 h-4 w-4" /> Assign
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setNewStatus(selectedTicket.status); setIsStatusModalOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" /> Update Status
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
                      <h4 className="font-semibold">Ticket Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Ticket ID:</span> <span className="ml-2">{selectedTicket.id}</span></div>
                        <div><span className="text-muted-foreground">Category:</span> <span className="ml-2">{selectedTicket.category}</span></div>
                        <div><span className="text-muted-foreground">Priority:</span> <span className="ml-2">{selectedTicket.priority}</span></div>
                        <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selectedTicket.status}</span></div>
                        <div><span className="text-muted-foreground">Created By:</span> <span className="ml-2">{selectedTicket.created_by}</span></div>
                        <div><span className="text-muted-foreground">Assigned To:</span> <span className="ml-2">{selectedTicket.assigned_to}</span></div>
                        <div><span className="text-muted-foreground">Created:</span> <span className="ml-2">{selectedTicket.created_at}</span></div>
                        <div><span className="text-muted-foreground">Updated:</span> <span className="ml-2">{selectedTicket.last_updated}</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
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
                          placeholder="Write your response..."
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
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
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
              <Button onClick={handleCreateTicket} disabled={!formData.title || !formData.description}>Create Ticket</Button>
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
              <Button onClick={handleAssignTicket} disabled={!assignTo}>Assign</Button>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
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
              <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCloseTicket}>Close Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Ticket Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Ticket</DialogTitle>
              <DialogDescription>
                Deleting a ticket is irreversible and will remove all associated messages and history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteTicket}>Delete Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
