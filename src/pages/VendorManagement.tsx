import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import {
  useListVendors,
  useGetVendorDashboard,
  useGetVendorEligibility,
  useListVendorProducts,
  useListVendorOrders,
  useSuspendVendor,
  useReinstateVendor,
  useGetVendorSuspensionHistory,
  useApproveVendorKyc,
  useRejectVendorKyc,
  useVerifyVendor,
} from "@/hooks/admin/useVendor";
import {
  Search,
  Eye,
  Check,
  Pause,
  MoreHorizontal,
  Download,
  ChevronDown,
  Star,
  Package,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from "lucide-react";
import type { Vendor, VendorStatus } from "@/types/vendor";

const PAGE_SIZE = 20;

const VENDOR_STATUSES: VendorStatus[] = [
  "DRAFT",
  "ACTIVE",
  "KYC_PENDING",
  "SUSPENDED",
];

const KYC_ACTION_STATUSES = ["REGISTERED", "AWAITING_KYC", "KYC_UNDER_REVIEW"] as const;

export default function VendorManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VendorStatus>("all");
  const [page, setPage] = useState(0);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modal states
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isReinstateModalOpen, setIsReinstateModalOpen] = useState(false);
  const [isRejectKycModalOpen, setIsRejectKycModalOpen] = useState(false);

  // Form states
  const [suspendReason, setSuspendReason] = useState("");
  const [rejectKycReason, setRejectKycReason] = useState("");

  // GraphQL queries
  const {
    data: vendorsData,
    vendors,
    total,
    loading: vendorsLoading,
    error: vendorsError,
  } = useListVendors({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: dashboardData } = useGetVendorDashboard(
    selectedVendor?.id || null,
    !selectedVendor
  );
  const { data: eligibilityData } = useGetVendorEligibility(
    selectedVendor?.id || null,
    !selectedVendor
  );
  const { data: productsData } = useListVendorProducts(
    selectedVendor?.id || null,
    null,
    10,
    0,
    !selectedVendor
  );
  const { data: ordersData } = useListVendorOrders(
    selectedVendor?.id || null,
    null,
    10,
    0,
    !selectedVendor
  );

  // Suspension history for selected vendor
  const { suspensions, loading: suspensionsLoading } = useGetVendorSuspensionHistory(
    selectedVendor?.id,
    !selectedVendor
  );

  // Mutations
  const [suspendVendor] = useSuspendVendor();
  const [reinstateVendor] = useReinstateVendor();
  const [approveKyc, { loading: approvingKyc }] = useApproveVendorKyc();
  const [rejectKyc, { loading: rejectingKyc }] = useRejectVendorKyc();
  const [verifyVendor, { loading: verifyingVendor }] = useVerifyVendor();

  const getStatusBadge = (status: VendorStatus | string | undefined) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      DRAFT: "secondary",
      KYC_PENDING: "outline",
      SUSPENDED: "destructive",
    };
    return <Badge variant={variants[status as string] || "outline"}>{status}</Badge>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendors(vendors.map((v) => v.id));
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

  const openVendorDetail = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDetailOpen(true);
  };

  const handleSuspendVendor = async () => {
    if (!selectedVendor || !suspendReason) return;
    try {
      await suspendVendor({
        variables: {
          vendorId: selectedVendor.id,
          reason: suspendReason,
        },
      });
      toast({
        title: "Success",
        description: "Vendor suspended successfully.",
      });
      setIsSuspendModalOpen(false);
      setSuspendReason("");
      setIsDetailOpen(false);
      setSelectedVendor(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to suspend vendor.",
        variant: "destructive",
      });
    }
  };

  const handleReinstateVendor = async () => {
    if (!selectedVendor) return;
    try {
      await reinstateVendor({
        variables: {
          vendorId: selectedVendor.id,
        },
      });
      toast({
        title: "Success",
        description: "Vendor reinstated successfully.",
      });
      setIsReinstateModalOpen(false);
      setIsDetailOpen(false);
      setSelectedVendor(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to reinstate vendor.",
        variant: "destructive",
      });
    }
  };

  const handleApproveKyc = async () => {
    if (!selectedVendor) return;
    try {
      await approveKyc({ variables: { vendorId: selectedVendor.id } });
      toast({ title: "Success", description: "KYC approved successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to approve KYC.", variant: "destructive" });
    }
  };

  const handleRejectKyc = async () => {
    if (!selectedVendor || !rejectKycReason) return;
    try {
      await rejectKyc({
        variables: { vendorId: selectedVendor.id, reason: rejectKycReason },
      });
      toast({ title: "Success", description: "KYC rejected." });
      setIsRejectKycModalOpen(false);
      setRejectKycReason("");
    } catch {
      toast({ title: "Error", description: "Failed to reject KYC.", variant: "destructive" });
    }
  };

  const handleVerifyVendor = async () => {
    if (!selectedVendor) return;
    try {
      await verifyVendor({ variables: { vendorId: selectedVendor.id } });
      toast({ title: "Success", description: "Vendor verified successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to verify vendor.", variant: "destructive" });
    }
  };

  const renderStars = (rating: number | undefined) => {
    const r = rating || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= r
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({r.toFixed(1)})</span>
      </div>
    );
  };

  const showKycActions =
    selectedVendor &&
    (KYC_ACTION_STATUSES as readonly string[]).includes(selectedVendor.status as string);

  const kycVerified = eligibilityData?.getVendorEligibility?.isKycVerified;

  if (vendorsError) {
    return (
      <AdminLayout>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading vendors</p>
            <p className="text-sm">{vendorsError.message}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("vendors.title")}</h1>
          <p className="text-muted-foreground">
            {t("vendors.searchPlaceholder")}
          </p>
        </div>

        {/* Top Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Vendor name or ID"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
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
                <DropdownMenuItem disabled>Bulk Suspend</DropdownMenuItem>
                <DropdownMenuItem disabled>Bulk Export</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as "all" | VendorStatus);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="KYC_PENDING">KYC Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setSearchQuery("");
              setPage(0);
            }}
          >
            Clear Filters
          </Button>
          {total > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">
              {total} vendor{total !== 1 ? "s" : ""} total
            </span>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {vendorsLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        vendors.length > 0 &&
                        selectedVendors.length === vendors.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Vendor ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length > 0 ? (
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={(checked) =>
                            handleSelectVendor(vendor.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {vendor.displayName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {vendor.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vendor.type || vendor.vendorType}</Badge>
                      </TableCell>
                      <TableCell>{renderStars(vendor.rating ?? undefined)}</TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell className="text-sm">
                        {vendor.createdAt
                          ? new Date(vendor.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openVendorDetail(vendor as unknown as Vendor)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {vendor.status !== "SUSPENDED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedVendor(vendor as unknown as Vendor);
                                setIsSuspendModalOpen(true);
                              }}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {vendor.status === "SUSPENDED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedVendor(vendor as unknown as Vendor);
                                setIsReinstateModalOpen(true);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem disabled>
                                <Download className="mr-2 h-4 w-4" /> Export
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-8 w-8 opacity-40" />
                        <p className="font-medium">No vendors found</p>
                        <p className="text-sm">
                          {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your filters."
                            : "No vendors have been registered yet."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!vendorsLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Vendor Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
            {selectedVendor && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3 flex-wrap">
                    {selectedVendor.displayName}
                    {getStatusBadge(selectedVendor.status)}
                    {/* KYC Badge */}
                    {kycVerified === true && (
                      <Badge className="bg-green-600 text-white hover:bg-green-700">
                        <ShieldCheck className="mr-1 h-3 w-3" /> KYC Verified
                      </Badge>
                    )}
                    {kycVerified === false && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        <ShieldAlert className="mr-1 h-3 w-3" /> KYC Pending
                      </Badge>
                    )}
                  </SheetTitle>
                  <div className="text-sm text-muted-foreground space-y-1 mt-4">
                    <p>ID: {selectedVendor.id}</p>
                    <p>Type: {selectedVendor.type}</p>
                    {selectedVendor.createdAt && (
                      <p>
                        Joined:{" "}
                        {new Date(selectedVendor.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </SheetHeader>

                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedVendor.status !== "SUSPENDED" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setIsDetailOpen(false);
                        setIsSuspendModalOpen(true);
                      }}
                    >
                      <Pause className="mr-2 h-4 w-4" /> Suspend
                    </Button>
                  )}
                  {selectedVendor.status === "SUSPENDED" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsDetailOpen(false);
                        setIsReinstateModalOpen(true);
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" /> Reinstate
                    </Button>
                  )}
                  {/* KYC / Verify actions for eligible statuses */}
                  {showKycActions && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={handleVerifyVendor}
                        disabled={verifyingVendor}
                      >
                        {verifyingVendor ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="mr-2 h-4 w-4" />
                        )}
                        Verify Vendor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={handleApproveKyc}
                        disabled={approvingKyc}
                      >
                        {approvingKyc ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Approve KYC
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-600 hover:bg-red-50"
                        onClick={() => setIsRejectKycModalOpen(true)}
                      >
                        <ShieldX className="mr-2 h-4 w-4" /> Reject KYC
                      </Button>
                    </>
                  )}
                </div>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold">Vendor Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span>{selectedVendor.displayName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{selectedVendor.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span>{selectedVendor.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Package className="h-4 w-4" /> Performance
                        </h4>
                        {dashboardData?.getVendorDashboard && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Completed Orders:
                              </span>
                              <span>
                                {dashboardData.getVendorDashboard.completedOrders ||
                                  0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Total Earnings:
                              </span>
                              <span>
                                $
                                {(
                                  dashboardData.getVendorDashboard.totalEarnings || 0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg Rating:</span>
                              {renderStars(
                                dashboardData.getVendorDashboard.averageRating
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedVendor.description && (
                      <div className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedVendor.description}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="products" className="mt-4">
                    {productsData?.listVendorProducts?.items &&
                    productsData.listVendorProducts.items.length > 0 ? (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productsData.listVendorProducts.items.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">
                                  {product.title || product.name}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(product.status ?? undefined)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {product.createdAt
                                    ? new Date(
                                        product.createdAt
                                      ).toLocaleDateString()
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No products found
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="orders" className="mt-4">
                    {ordersData?.listVendorOrders?.items &&
                    ordersData.listVendorOrders.items.length > 0 ? (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ordersData.listVendorOrders.items.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                  {order.id}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(order.status ?? undefined)}
                                </TableCell>
                                <TableCell>
                                  {order.currency}{" "}
                                  {order.totalAmount?.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString()
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No orders found
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    {suspensionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : suspensions.length > 0 ? (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reason</TableHead>
                              <TableHead>Suspended By</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Reinstated</TableHead>
                              <TableHead>Active</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {suspensions.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell className="max-w-[180px] truncate" title={s.reason}>
                                  {s.reason}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {s.suspendedBy}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(s.suspendedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {s.reinstatedAt
                                    ? new Date(s.reinstatedAt).toLocaleDateString()
                                    : s.reinstatedBy
                                    ? s.reinstatedBy
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {s.isActive ? (
                                    <Badge variant="destructive">Active</Badge>
                                  ) : (
                                    <Badge variant="secondary">Resolved</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No suspension history
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Suspend Vendor Modal */}
        <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Vendor</DialogTitle>
              <DialogDescription>
                Provide a reason for the suspension. The vendor will be immediately unable
                to list products or receive orders.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Suspension *</Label>
                <Textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuspendModalOpen(false);
                  setSuspendReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspendVendor}
                disabled={!suspendReason}
              >
                Suspend Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reinstate Vendor Modal */}
        <Dialog open={isReinstateModalOpen} onOpenChange={setIsReinstateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reinstate Vendor</DialogTitle>
              <DialogDescription>
                Are you sure you want to reinstate this vendor? They will be able to list
                products and receive orders again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReinstateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleReinstateVendor}>Reinstate Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject KYC Modal */}
        <Dialog open={isRejectKycModalOpen} onOpenChange={setIsRejectKycModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject KYC</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this vendor's KYC submission.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Rejection *</Label>
                <Textarea
                  value={rejectKycReason}
                  onChange={(e) => setRejectKycReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectKycModalOpen(false);
                  setRejectKycReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectKyc}
                disabled={!rejectKycReason || rejectingKyc}
              >
                {rejectingKyc ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reject KYC
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
