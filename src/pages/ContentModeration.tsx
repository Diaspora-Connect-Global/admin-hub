import { useState } from "react";
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

// Mock data
const mockContent = [
  {
    id: "CNT-001",
    type: "Post",
    title_excerpt: "Looking for business partners in Belgium for import/export...",
    author: "John Doe",
    author_avatar: "",
    community_association: "Belgian Ghanaians",
    status: "Pending Approval",
    submitted_at: "2024-11-30 10:15",
    last_updated: "2024-11-30 10:15",
    full_content: "Looking for business partners in Belgium for import/export of agricultural products. I have established connections with farmers in Ghana and am seeking reliable partners in the EU. Please reach out if interested in collaboration.",
    media: ["https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400"],
    likes: 24,
    comments: 8,
    shares: 3,
    saves: 12,
  },
  {
    id: "CNT-002",
    type: "Comment",
    title_excerpt: "This is a great initiative! I've been working on something similar...",
    author: "Jane Smith",
    author_avatar: "",
    community_association: "Belgian Ghanaians",
    status: "Approved",
    submitted_at: "2024-11-29 16:45",
    last_updated: "2024-11-29 17:00",
    full_content: "This is a great initiative! I've been working on something similar in the tech space. Would love to connect and discuss potential synergies.",
    media: [],
    likes: 5,
    comments: 2,
    shares: 0,
    saves: 1,
  },
  {
    id: "CNT-003",
    type: "Opportunity",
    title_excerpt: "Senior Software Engineer - Remote Position Available",
    author: "TechCorp Ghana",
    author_avatar: "",
    community_association: "Tech Entrepreneurs Network",
    status: "Pending Approval",
    submitted_at: "2024-11-28 11:30",
    last_updated: "2024-11-28 11:30",
    full_content: "We are looking for a Senior Software Engineer to join our remote team. Requirements: 5+ years experience, proficiency in React, Node.js, and cloud technologies. Competitive salary and benefits package.",
    media: [],
    likes: 45,
    comments: 12,
    shares: 28,
    saves: 67,
  },
  {
    id: "CNT-004",
    type: "Vendor Listing",
    title_excerpt: "Authentic Ghanaian Kente Cloth - Premium Quality",
    author: "AfriCraft Store",
    author_avatar: "",
    community_association: "Belgian Ghanaians",
    status: "Flagged",
    submitted_at: "2024-11-27 09:00",
    last_updated: "2024-11-28 14:30",
    full_content: "Authentic handwoven Kente cloth from Ghana. Premium quality traditional patterns. Available in various sizes and designs. Perfect for special occasions.",
    media: ["https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400"],
    likes: 89,
    comments: 15,
    shares: 34,
    saves: 112,
  },
  {
    id: "CNT-005",
    type: "Post",
    title_excerpt: "Community meetup this Saturday at Grand Place!",
    author: "Community Events",
    author_avatar: "",
    community_association: "Belgian Ghanaians",
    status: "Rejected",
    submitted_at: "2024-11-25 14:20",
    last_updated: "2024-11-26 10:00",
    full_content: "Join us this Saturday at Grand Place for our monthly community meetup. Food, music, and networking. All are welcome!",
    media: [],
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
  },
];

const mockAuditLogs = [
  { timestamp: "2024-11-30 10:15", action: "Content Submitted", performed_by: "John Doe", notes: "New post created" },
  { timestamp: "2024-11-30 10:20", action: "Auto-flagged", performed_by: "System", notes: "Contains keywords requiring review" },
];

const mockInteractions = [
  { user: "Alice Brown", action: "Liked", timestamp: "2024-11-30 11:00" },
  { user: "Bob Wilson", action: "Commented", timestamp: "2024-11-30 11:15" },
  { user: "Charlie Davis", action: "Saved", timestamp: "2024-11-30 11:30" },
  { user: "Diana Evans", action: "Shared", timestamp: "2024-11-30 12:00" },
];

export default function ContentModeration() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<typeof mockContent[0] | null>(null);
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
      setSelectedContent(mockContent.map((c) => c.id));
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

  const openContentDetail = (item: typeof mockContent[0]) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleApprove = () => {
    toast({ title: "Success", description: "Content approved successfully." });
    setIsApproveModalOpen(false);
    setApproveNote("");
  };

  const handleReject = () => {
    toast({ title: "Success", description: "Content rejected." });
    setIsRejectModalOpen(false);
    setRejectReason("");
  };

  const handleFlag = () => {
    toast({ title: "Success", description: "Content flagged for review." });
    setIsFlagModalOpen(false);
    setFlagReason("");
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
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review and manage user-generated content for compliance and quality.
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
                    checked={selectedContent.length === mockContent.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Content ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title / Excerpt</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContent.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectContent(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span>{item.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.title_excerpt}</TableCell>
                  <TableCell>{item.author}</TableCell>
                  <TableCell>{item.community_association}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-sm">{item.submitted_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openContentDetail(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status === "Pending Approval" && (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Export Content Data
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

        {/* Content Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedItem && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    {getTypeIcon(selectedItem.type)}
                    {selectedItem.type}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{selectedItem.id}</Badge>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By {selectedItem.author} in {selectedItem.community_association}
                  </p>
                </SheetHeader>

                <div className="flex gap-2 mt-4">
                  {selectedItem.status === "Pending Approval" && (
                    <>
                      <Button size="sm" onClick={() => { setIsDetailOpen(false); setIsApproveModalOpen(true); }}>
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setIsDetailOpen(false); setIsRejectModalOpen(true); }}>
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); setIsFlagModalOpen(true); }}>
                    <Flag className="mr-2 h-4 w-4" /> Flag
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="reactions">Reactions</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Content Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Content ID:</span> <span className="ml-2">{selectedItem.id}</span></div>
                        <div><span className="text-muted-foreground">Type:</span> <span className="ml-2">{selectedItem.type}</span></div>
                        <div><span className="text-muted-foreground">Status:</span> <span className="ml-2">{selectedItem.status}</span></div>
                        <div><span className="text-muted-foreground">Author:</span> <span className="ml-2">{selectedItem.author}</span></div>
                        <div><span className="text-muted-foreground">Community:</span> <span className="ml-2">{selectedItem.community_association}</span></div>
                        <div><span className="text-muted-foreground">Submitted:</span> <span className="ml-2">{selectedItem.submitted_at}</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-semibold">Content Preview</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedItem.full_content}</p>
                      {selectedItem.media.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {selectedItem.media.map((url, idx) => (
                            <img key={idx} src={url} alt="Content media" className="w-32 h-32 object-cover rounded-lg" />
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="reactions" className="mt-4 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Heart className="h-6 w-6 mx-auto text-red-500 mb-2" />
                          <div className="text-2xl font-bold">{selectedItem.likes}</div>
                          <div className="text-xs text-muted-foreground">Likes</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <MessageCircle className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                          <div className="text-2xl font-bold">{selectedItem.comments}</div>
                          <div className="text-xs text-muted-foreground">Comments</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Share2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                          <div className="text-2xl font-bold">{selectedItem.shares}</div>
                          <div className="text-xs text-muted-foreground">Shares</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Bookmark className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                          <div className="text-2xl font-bold">{selectedItem.saves}</div>
                          <div className="text-xs text-muted-foreground">Saves</div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Recent Interactions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mockInteractions.map((interaction, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>{interaction.user.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                </Avatar>
                                <span>{interaction.user}</span>
                                <Badge variant="outline" className="text-xs">{interaction.action}</Badge>
                              </div>
                              <span className="text-muted-foreground text-xs">{interaction.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="audit" className="mt-4">
                    <div className="flex justify-end mb-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Export Audit (CSV)
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
                          {mockAuditLogs.map((log, idx) => (
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

        {/* Approve Modal */}
        <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Content</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this content? Approved content will be visible to all platform users.
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
              <Button onClick={handleApprove}>Approve</Button>
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
              <DialogTitle>Flag Content</DialogTitle>
              <DialogDescription>
                Flag this content for further review.
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
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleFlag} disabled={!flagReason.trim()}>Flag</Button>
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
