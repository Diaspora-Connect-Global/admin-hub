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
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  UserPlus,
  Eye,
  Edit,
  Check,
  Pause,
  Trash2,
  MoreHorizontal,
  Download,
  ChevronDown,
  Star,
  Package,
  Receipt,
  FileText,
  MessageSquare,
  Flag,
} from "lucide-react";

// Mock data
const mockVendors = [
  {
    id: "V001",
    name: "TechGadgets Ltd",
    email: "contact@techgadgets.com",
    phone: "+1-555-0101",
    communities: ["Belgian Ghanaians", "Tech Entrepreneurs"],
    category: "Products",
    items_count: 45,
    trust_score: 92,
    status: "Active",
    created_at: "2024-01-15",
    transactions_count: 156,
    total_revenue: 45600,
    average_rating: 4.7,
    disputes_count: 2,
  },
  {
    id: "V002",
    name: "ProServices Hub",
    email: "info@proservices.com",
    phone: "+1-555-0102",
    communities: ["Belgian Ghanaians"],
    category: "Services",
    items_count: 12,
    trust_score: 85,
    status: "Active",
    created_at: "2024-02-20",
    transactions_count: 89,
    total_revenue: 23400,
    average_rating: 4.5,
    disputes_count: 1,
  },
  {
    id: "V003",
    name: "HomeGoods Express",
    email: "sales@homegoods.com",
    phone: "+1-555-0103",
    communities: ["Dutch Nigerians"],
    category: "Products",
    items_count: 78,
    trust_score: 78,
    status: "Pending Approval",
    created_at: "2024-11-01",
    transactions_count: 0,
    total_revenue: 0,
    average_rating: 0,
    disputes_count: 0,
  },
  {
    id: "V004",
    name: "ConsultPro Agency",
    email: "hello@consultpro.com",
    phone: "+1-555-0104",
    communities: ["Belgian Ghanaians", "French Cameroonians"],
    category: "Services",
    items_count: 8,
    trust_score: 45,
    status: "Suspended",
    created_at: "2024-03-10",
    transactions_count: 34,
    total_revenue: 8900,
    average_rating: 3.2,
    disputes_count: 5,
  },
];

const mockProducts = [
  { id: "P001", item_name: "Wireless Earbuds Pro", category: "Electronics", price: 79.99, status: "Active", created_at: "2024-06-15" },
  { id: "P002", item_name: "Smart Watch X2", category: "Electronics", price: 199.99, status: "Active", created_at: "2024-07-20" },
  { id: "P003", item_name: "Laptop Stand Deluxe", category: "Accessories", price: 49.99, status: "Suspended", created_at: "2024-08-10" },
];

const mockTransactions = [
  { id: "TXN001", customer_name: "John Doe", item_name: "Wireless Earbuds Pro", amount: 79.99, status: "Completed", created_at: "2024-11-20" },
  { id: "TXN002", customer_name: "Jane Smith", item_name: "Smart Watch X2", amount: 199.99, status: "In Escrow", created_at: "2024-11-25" },
  { id: "TXN003", customer_name: "Bob Wilson", item_name: "Laptop Stand Deluxe", amount: 49.99, status: "Disputed", created_at: "2024-11-28" },
];

const mockReviews = [
  { id: "R001", customer_name: "John Doe", rating: 5, review_text: "Excellent product quality and fast shipping!", created_at: "2024-11-21" },
  { id: "R002", customer_name: "Jane Smith", rating: 4, review_text: "Good product, packaging could be better.", created_at: "2024-11-26" },
  { id: "R003", customer_name: "Bob Wilson", rating: 2, review_text: "Item arrived damaged. Waiting for resolution.", created_at: "2024-11-29" },
];

const mockAuditLogs = [
  { timestamp: "2024-11-30 14:32", action: "Vendor Approved", performed_by: "Admin John", notes: "Initial approval after document verification" },
  { timestamp: "2024-11-28 09:15", action: "Trust Score Updated", performed_by: "System", notes: "Auto-adjusted based on transaction history" },
  { timestamp: "2024-11-25 16:45", action: "Product Added", performed_by: "Vendor", notes: "New product listing: Smart Watch X2" },
];

export default function VendorManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [trustScoreRange, setTrustScoreRange] = useState([0, 100]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<typeof mockVendors[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Products",
    communities: [] as string[],
    trust_score: 50,
    status: "Pending Approval",
  });
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("Indefinite");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Active": "default",
      "Pending Approval": "secondary",
      "Suspended": "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendors(mockVendors.map((v) => v.id));
    } else {
      setSelectedVendors([]);
    }
  };

  const handleSelectVendor = (vendorId: string, checked: boolean) => {
    if (checked) {
      setSelectedVendors([...selectedVendors, vendorId]);
    } else {
      setSelectedVendors(selectedVendors.filter((id) => id !== vendorId));
    }
  };

  const openVendorDetail = (vendor: typeof mockVendors[0]) => {
    setSelectedVendor(vendor);
    setIsDetailOpen(true);
  };

  const openEditModal = (vendor: typeof mockVendors[0]) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      category: vendor.category,
      communities: vendor.communities,
      trust_score: vendor.trust_score,
      status: vendor.status,
    });
    setIsEditModalOpen(true);
  };

  const handleAddVendor = () => {
    toast({ title: "Success", description: "Vendor created successfully." });
    setIsAddModalOpen(false);
    setFormData({ name: "", email: "", phone: "", category: "Products", communities: [], trust_score: 50, status: "Pending Approval" });
  };

  const handleEditVendor = () => {
    toast({ title: "Success", description: "Vendor updated successfully." });
    setIsEditModalOpen(false);
  };

  const handleApproveVendor = () => {
    toast({ title: "Success", description: "Vendor approved successfully." });
    setIsApproveModalOpen(false);
  };

  const handleSuspendVendor = () => {
    toast({ title: "Success", description: "Vendor suspended successfully." });
    setIsSuspendModalOpen(false);
    setSuspendReason("");
  };

  const handleDeleteVendor = () => {
    toast({ title: "Success", description: "Vendor deleted successfully." });
    setIsDeleteModalOpen(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground">
            Track, approve, and manage all vendors and their offerings across the platform.
          </p>
        </div>

        {/* Top Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Vendor name, email, phone, or product/service"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedVendors.length === 0}>
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <DropdownMenuItem>Bulk Approve Vendors</DropdownMenuItem>
                <DropdownMenuItem>Bulk Suspend Vendors</DropdownMenuItem>
                <DropdownMenuItem>Bulk Export Vendors</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Products">Products</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-xs">Trust Score: {trustScoreRange[0]} - {trustScoreRange[1]}</Label>
            <Slider
              value={trustScoreRange}
              onValueChange={setTrustScoreRange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            setStatusFilter("all");
            setCategoryFilter("all");
            setTrustScoreRange([0, 100]);
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
                    checked={selectedVendors.length === mockVendors.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Communities</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={(checked) => handleSelectVendor(vendor.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vendor.communities.slice(0, 2).map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                      {vendor.communities.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{vendor.communities.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{vendor.category}</TableCell>
                  <TableCell>{vendor.items_count}</TableCell>
                  <TableCell>
                    <Badge variant={vendor.trust_score >= 80 ? "default" : vendor.trust_score >= 50 ? "secondary" : "destructive"}>
                      {vendor.trust_score}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                  <TableCell>{vendor.created_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openVendorDetail(vendor)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(vendor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {vendor.status === "Pending Approval" && (
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedVendor(vendor); setIsApproveModalOpen(true); }}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {vendor.status !== "Suspended" && (
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedVendor(vendor); setIsSuspendModalOpen(true); }}>
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setIsDeleteModalOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Export Vendor Data
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

        {/* Vendor Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedVendor && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    {selectedVendor.name}
                    {getStatusBadge(selectedVendor.status)}
                  </SheetTitle>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{selectedVendor.email} | {selectedVendor.phone}</p>
                    <p>Category: {selectedVendor.category} | Trust Score: {selectedVendor.trust_score}</p>
                  </div>
                </SheetHeader>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => { setIsDetailOpen(false); openEditModal(selectedVendor); }}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  {selectedVendor.status === "Pending Approval" && (
                    <Button size="sm" onClick={() => { setIsDetailOpen(false); setIsApproveModalOpen(true); }}>
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  )}
                  {selectedVendor.status !== "Suspended" && (
                    <Button variant="destructive" size="sm" onClick={() => { setIsDetailOpen(false); setIsSuspendModalOpen(true); }}>
                      <Pause className="mr-2 h-4 w-4" /> Suspend
                    </Button>
                  )}
                </div>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold">Basic Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span>{selectedVendor.name}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{selectedVendor.email}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span>{selectedVendor.phone}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span>{selectedVendor.category}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Joined:</span><span>{selectedVendor.created_at}</span></div>
                        </div>
                      </div>
                      <div className="space-y-3 p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Performance</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Items:</span><span>{selectedVendor.items_count}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Transactions:</span><span>{selectedVendor.transactions_count}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Revenue:</span><span>${selectedVendor.total_revenue.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Avg Rating:</span>{renderStars(selectedVendor.average_rating)}</div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Disputes:</span><span>{selectedVendor.disputes_count}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold mb-2">Communities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedVendor.communities.map((c) => (
                          <Badge key={c} variant="outline">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="products" className="mt-4">
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.item_name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell>${product.price}</TableCell>
                              <TableCell>{getStatusBadge(product.status)}</TableCell>
                              <TableCell>{product.created_at}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Pause className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="transactions" className="mt-4">
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockTransactions.map((txn) => (
                            <TableRow key={txn.id}>
                              <TableCell className="font-medium">{txn.id}</TableCell>
                              <TableCell>{txn.customer_name}</TableCell>
                              <TableCell>{txn.item_name}</TableCell>
                              <TableCell>${txn.amount}</TableCell>
                              <TableCell>
                                <Badge variant={txn.status === "Completed" ? "default" : txn.status === "Disputed" ? "destructive" : "secondary"}>
                                  {txn.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{txn.created_at}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Receipt className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-4">
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Review</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockReviews.map((review) => (
                            <TableRow key={review.id}>
                              <TableCell className="font-medium">{review.customer_name}</TableCell>
                              <TableCell>{renderStars(review.rating)}</TableCell>
                              <TableCell className="max-w-xs truncate">{review.review_text}</TableCell>
                              <TableCell>{review.created_at}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Flag className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="audit" className="mt-4">
                    <div className="flex justify-end mb-2">
                      <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export Audit (CSV)</Button>
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
                              <TableCell>{log.timestamp}</TableCell>
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

        {/* Add Vendor Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Vendor</DialogTitle>
              <DialogDescription>Create a new vendor account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vendor Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Products">Products</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trust Score: {formData.trust_score}</Label>
                <Slider value={[formData.trust_score]} onValueChange={(v) => setFormData({ ...formData, trust_score: v[0] })} max={100} step={1} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddVendor}>Create Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Vendor Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>Update vendor information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vendor Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Products">Products</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trust Score: {formData.trust_score}</Label>
                <Slider value={[formData.trust_score]} onValueChange={(v) => setFormData({ ...formData, trust_score: v[0] })} max={100} step={1} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleEditVendor}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Vendor Modal */}
        <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Vendor</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this vendor? Approved vendors can list products/services immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
              <Button onClick={handleApproveVendor}>Approve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Vendor Modal */}
        <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Vendor</DialogTitle>
              <DialogDescription>Provide a reason and duration for the suspension.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Suspension *</Label>
                <Textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Enter reason..." />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Indefinite">Indefinite</SelectItem>
                    <SelectItem value="1 day">1 day</SelectItem>
                    <SelectItem value="7 days">7 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleSuspendVendor} disabled={!suspendReason}>Suspend</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Vendor Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Vendor</DialogTitle>
              <DialogDescription>
                Deleting this vendor will remove all their products/services. This action is irreversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteVendor}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
