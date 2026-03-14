import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import {
  useAddMilestone,
  useCreateProduct,
  useCreateServicePackage,
  useCreateVendor,
  useDeleteProduct,
  useGetVendor,
  useGetVendorDashboard,
  useGetVendorEligibility,
  useListVendorOrders,
  useListVendorProducts,
  useListVendorServicePackages,
  usePublishProduct,
  usePublishServicePackage,
  useReinstateVendor,
  useRequestPayout,
  useRequestVendorUploadUrl,
  useSuspendVendor,
  useUpdateProduct,
} from "@/hooks/vendor";
import type { VendorType } from "@/services/networks/graphql/vendor";

type JsonInput = Record<string, unknown>;

const VENDOR_TYPES: VendorType[] = ["INDIVIDUAL", "BUSINESS", "COMMUNITY", "ASSOCIATION"];
const PAGE_SIZE = 20;

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Request failed";
}

function parseJson(raw: string): JsonInput | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as JsonInput;
  } catch {
    return null;
  }
}

function firstText(value: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return "-";
}

export default function VendorManagementGateway() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [vendorLookupInput, setVendorLookupInput] = useState("");
  const [targetVendorId, setTargetVendorId] = useState<string | null>(null);

  const [vendorType, setVendorType] = useState<VendorType>("BUSINESS");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");

  const [suspendReason, setSuspendReason] = useState("");

  const [uploadFileName, setUploadFileName] = useState("image.png");
  const [uploadContentType, setUploadContentType] = useState("image/png");
  const [uploadFileType, setUploadFileType] = useState("PRODUCT_IMAGE");
  const [uploadResult, setUploadResult] = useState<JsonInput | null>(null);

  const [payoutAmount, setPayoutAmount] = useState("100");
  const [payoutCurrency, setPayoutCurrency] = useState("USD");

  const [productStatusFilter, setProductStatusFilter] = useState("ALL");
  const [serviceStatusFilter, setServiceStatusFilter] = useState("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  const [createProductJson, setCreateProductJson] = useState(
    '{\n  "vendorId": "<target-vendor-id>",\n  "name": "Sample Product",\n  "description": "Optional description"\n}'
  );
  const [updateProductJson, setUpdateProductJson] = useState(
    '{\n  "productId": "<product-id>",\n  "name": "Updated product name"\n}'
  );
  const [createServiceJson, setCreateServiceJson] = useState(
    '{\n  "vendorId": "<target-vendor-id>",\n  "title": "Sample Service Package",\n  "description": "Optional description"\n}'
  );
  const [addMilestoneJson, setAddMilestoneJson] = useState(
    '{\n  "packageId": "<service-package-id>",\n  "title": "Milestone 1",\n  "percentage": 50\n}'
  );

  const activeVendorId = useMemo(() => {
    const trimmed = targetVendorId?.trim();
    return trimmed ? trimmed : null;
  }, [targetVendorId]);

  const { data: vendorData, loading: vendorLoading, error: vendorError, refetch: refetchVendor } = useGetVendor(activeVendorId);
  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = useGetVendorDashboard(activeVendorId);
  const { data: eligibilityData, loading: eligibilityLoading, refetch: refetchEligibility } = useGetVendorEligibility(activeVendorId);

  const {
    data: productsData,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useListVendorProducts({
    vendorId: activeVendorId,
    status: productStatusFilter === "ALL" ? undefined : productStatusFilter,
    limit: PAGE_SIZE,
    offset: 0,
  });

  const {
    data: servicePackagesData,
    loading: servicePackagesLoading,
    refetch: refetchServicePackages,
  } = useListVendorServicePackages({
    vendorId: activeVendorId,
    status: serviceStatusFilter === "ALL" ? undefined : serviceStatusFilter,
    limit: PAGE_SIZE,
    offset: 0,
  });

  const {
    data: ordersData,
    loading: ordersLoading,
    refetch: refetchOrders,
  } = useListVendorOrders({
    vendorId: activeVendorId,
    status: orderStatusFilter === "ALL" ? undefined : orderStatusFilter,
    limit: PAGE_SIZE,
    offset: 0,
  });

  const [createVendor, createVendorState] = useCreateVendor();
  const [suspendVendor, suspendVendorState] = useSuspendVendor();
  const [reinstateVendor, reinstateVendorState] = useReinstateVendor();
  const [requestVendorUploadUrl, requestVendorUploadUrlState] = useRequestVendorUploadUrl();
  const [requestPayout, requestPayoutState] = useRequestPayout();

  const [createProduct, createProductState] = useCreateProduct();
  const [updateProduct, updateProductState] = useUpdateProduct();
  const [publishProduct, publishProductState] = usePublishProduct();
  const [deleteProduct, deleteProductState] = useDeleteProduct();

  const [createServicePackage, createServicePackageState] = useCreateServicePackage();
  const [addMilestone, addMilestoneState] = useAddMilestone();
  const [publishServicePackage, publishServicePackageState] = usePublishServicePackage();

  const onLoadVendor = () => {
    const cleaned = vendorLookupInput.trim();
    if (!cleaned) {
      toast({ title: "Vendor ID required", description: "Enter a vendorId to load admin-scoped vendor data." });
      return;
    }
    setTargetVendorId(cleaned);
  };

  const onCreateVendor = async () => {
    if (!displayName.trim()) {
      toast({ title: "Display name required", description: "Enter displayName before creating vendor." });
      return;
    }
    try {
      const result = await createVendor({
        variables: {
          vendorType,
          displayName: displayName.trim(),
          description: description.trim() || undefined,
        },
      });
      const createdId = (result.data as { createVendor?: { id?: string } } | null | undefined)?.createVendor?.id;
      toast({ title: "Vendor created", description: "Self-scoped vendor profile created for the logged-in principal." });
      if (createdId) {
        setTargetVendorId(createdId);
        setVendorLookupInput(createdId);
      }
    } catch (error) {
      toast({
        title: "Create vendor failed",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const onSuspendVendor = async () => {
    if (!activeVendorId) return;
    if (!suspendReason.trim()) {
      toast({ title: "Reason required", description: "Provide a reason for suspension." });
      return;
    }
    try {
      await suspendVendor({ variables: { vendorId: activeVendorId, reason: suspendReason.trim() } });
      toast({ title: "Vendor suspended" });
      setSuspendReason("");
      await Promise.all([refetchVendor(), refetchEligibility(), refetchDashboard()]);
    } catch (error) {
      toast({ title: "Suspend failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onReinstateVendor = async () => {
    if (!activeVendorId) return;
    try {
      await reinstateVendor({ variables: { vendorId: activeVendorId } });
      toast({ title: "Vendor reinstated" });
      await Promise.all([refetchVendor(), refetchEligibility(), refetchDashboard()]);
    } catch (error) {
      toast({ title: "Reinstate failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onRequestUploadUrl = async () => {
    if (!activeVendorId) return;
    try {
      const result = await requestVendorUploadUrl({
        variables: {
          vendorId: activeVendorId,
          fileName: uploadFileName.trim(),
          contentType: uploadContentType.trim(),
          fileType: uploadFileType.trim(),
        },
      });
      setUploadResult(
        ((result.data as { requestVendorUploadUrl?: JsonInput } | null | undefined)?.requestVendorUploadUrl ?? null)
      );
      toast({ title: "Upload URL created", description: "Upload file to uploadUrl, then store readUrl in later mutations." });
    } catch (error) {
      toast({ title: "Upload URL request failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onRequestPayout = async () => {
    if (!activeVendorId) return;
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive payout amount." });
      return;
    }
    try {
      await requestPayout({
        variables: {
          vendorId: activeVendorId,
          amount,
          currency: payoutCurrency.trim().toUpperCase(),
        },
      });
      toast({ title: "Payout requested" });
      await refetchOrders();
    } catch (error) {
      toast({ title: "Payout request failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onCreateProduct = async () => {
    const input = parseJson(createProductJson);
    if (!input) {
      toast({ title: "Invalid JSON", description: "Create product payload must be valid JSON object.", variant: "destructive" });
      return;
    }
    try {
      await createProduct({ variables: { input } });
      toast({ title: "Product created" });
      await Promise.all([refetchProducts(), refetchDashboard()]);
    } catch (error) {
      toast({ title: "Create product failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onUpdateProduct = async () => {
    const input = parseJson(updateProductJson);
    if (!input) {
      toast({ title: "Invalid JSON", description: "Update product payload must be valid JSON object.", variant: "destructive" });
      return;
    }
    try {
      await updateProduct({ variables: { input } });
      toast({ title: "Product updated" });
      await refetchProducts();
    } catch (error) {
      toast({ title: "Update product failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onPublishProduct = async (productId: string) => {
    try {
      await publishProduct({ variables: { productId } });
      toast({ title: "Product published" });
      await refetchProducts();
    } catch (error) {
      toast({ title: "Publish product failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct({ variables: { productId } });
      toast({ title: "Product deleted" });
      await Promise.all([refetchProducts(), refetchDashboard()]);
    } catch (error) {
      toast({ title: "Delete product failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onCreateServicePackage = async () => {
    const input = parseJson(createServiceJson);
    if (!input) {
      toast({ title: "Invalid JSON", description: "Create service package payload must be valid JSON object.", variant: "destructive" });
      return;
    }
    try {
      await createServicePackage({ variables: { input } });
      toast({ title: "Service package created" });
      await Promise.all([refetchServicePackages(), refetchDashboard()]);
    } catch (error) {
      toast({ title: "Create service package failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onAddMilestone = async () => {
    const input = parseJson(addMilestoneJson);
    if (!input) {
      toast({ title: "Invalid JSON", description: "Milestone payload must be valid JSON object.", variant: "destructive" });
      return;
    }
    try {
      await addMilestone({ variables: { input } });
      toast({ title: "Milestone added" });
      await refetchServicePackages();
    } catch (error) {
      toast({ title: "Add milestone failed", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const onPublishServicePackage = async (packageId: string) => {
    try {
      await publishServicePackage({ variables: { packageId } });
      toast({ title: "Service package published" });
      await refetchServicePackages();
    } catch (error) {
      toast({
        title: "Publish package failed",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const vendor = vendorData?.getVendor;
  const dashboard = dashboardData?.getVendorDashboard;
  const eligibility = eligibilityData?.getVendorEligibility;
  const products = productsData?.listVendorProducts?.items ?? [];
  const servicePackages = servicePackagesData?.listVendorServicePackages?.items ?? [];
  const orders = ordersData?.listVendorOrders?.items ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("vendors.title", "Vendor Management")}</h1>
          <p className="text-muted-foreground">
            API Gateway vendor resolver integration (token-protected). System admin views are vendorId-scoped.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Load vendor workspace</CardTitle>
            <CardDescription>
              Always pass a target vendorId for dashboard, eligibility, products, service packages, and orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder="Enter vendorId"
              value={vendorLookupInput}
              onChange={(event) => setVendorLookupInput(event.target.value)}
            />
            <Button onClick={onLoadVendor}>Load</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create vendor profile (self-scoped)</CardTitle>
            <CardDescription>
              createVendor does not accept a target user id. It always uses the authenticated actor id.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Vendor type</Label>
              <Select value={vendorType} onValueChange={(value) => setVendorType(value as VendorType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {VENDOR_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="md:col-span-4">
              <Button onClick={onCreateVendor} disabled={createVendorState.loading}>
                {createVendorState.loading ? "Creating..." : "Create vendor"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeVendorId ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Vendor snapshot</CardTitle>
                <CardDescription>Vendor ID: {activeVendorId}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">Profile</p>
                  {vendorLoading ? (
                    <p>Loading...</p>
                  ) : vendorError ? (
                    <p className="text-sm text-destructive">{extractErrorMessage(vendorError)}</p>
                  ) : vendor ? (
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">ID:</span> {firstText(vendor as JsonInput, ["id"])}</p>
                      <p><span className="text-muted-foreground">Type:</span> {firstText(vendor as JsonInput, ["vendorType"])}</p>
                      <p><span className="text-muted-foreground">Name:</span> {firstText(vendor as JsonInput, ["displayName"])}</p>
                      <p><span className="text-muted-foreground">Status:</span> {firstText(vendor as JsonInput, ["status"])}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">Dashboard</p>
                  {dashboardLoading ? (
                    <p>Loading...</p>
                  ) : dashboard ? (
                    <div className="space-y-1 text-sm">
                      <p>Total products: {String(dashboard.totalProducts ?? "-")}</p>
                      <p>Total service packages: {String(dashboard.totalServicePackages ?? "-")}</p>
                      <p>Total orders: {String(dashboard.totalOrders ?? "-")}</p>
                      <p>Pending orders: {String(dashboard.pendingOrders ?? "-")}</p>
                      <p>
                        Revenue: {String(dashboard.totalRevenue ?? "-")}
                        {dashboard.currency ? ` ${dashboard.currency}` : ""}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">Eligibility</p>
                  {eligibilityLoading ? (
                    <p>Loading...</p>
                  ) : eligibility ? (
                    <div className="space-y-1 text-sm">
                      <p>canSellProducts: {String(eligibility.canSellProducts ?? "-")}</p>
                      <p>canSellServices: {String(eligibility.canSellServices ?? "-")}</p>
                      <p>canRequestPayout: {String(eligibility.canRequestPayout ?? "-")}</p>
                      <p>hasPayoutAccount: {String(eligibility.hasPayoutAccount ?? "-")}</p>
                      <p>isKycVerified: {String(eligibility.isKycVerified ?? "-")}</p>
                      {Array.isArray(eligibility.reasons) && eligibility.reasons.length > 0 ? (
                        <p className="text-xs text-muted-foreground">Reasons: {eligibility.reasons.join(", ")}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin vendor actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Suspend reason</Label>
                  <Textarea value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} />
                  <Button variant="destructive" onClick={onSuspendVendor} disabled={suspendVendorState.loading || !suspendReason.trim()}>
                    Suspend vendor
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Reinstate</Label>
                  <p className="text-sm text-muted-foreground">Re-enable a suspended vendor profile.</p>
                  <Button onClick={onReinstateVendor} disabled={reinstateVendorState.loading}>
                    Reinstate vendor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload URL request</CardTitle>
                <CardDescription>
                  Call requestVendorUploadUrl, upload file directly to uploadUrl, then store readUrl in later payloads.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>fileName</Label>
                  <Input value={uploadFileName} onChange={(event) => setUploadFileName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>contentType</Label>
                  <Input value={uploadContentType} onChange={(event) => setUploadContentType(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>fileType</Label>
                  <Input value={uploadFileType} onChange={(event) => setUploadFileType(event.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={onRequestUploadUrl} disabled={requestVendorUploadUrlState.loading}>
                    Request upload URL
                  </Button>
                </div>
                {uploadResult ? (
                  <div className="md:col-span-4 rounded-md border p-3 text-xs">
                    <p><span className="font-medium">uploadUrl:</span> {firstText(uploadResult, ["uploadUrl"])}</p>
                    <p><span className="font-medium">readUrl:</span> {firstText(uploadResult, ["readUrl"])}</p>
                    <p><span className="font-medium">objectKey:</span> {firstText(uploadResult, ["objectKey"])}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Status</Label>
                    <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="ALL">ALL</SelectItem>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                        <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline">Total: {productsData?.listVendorProducts?.total ?? 0}</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5}>Loading...</TableCell>
                      </TableRow>
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>No products found.</TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.id}</TableCell>
                          <TableCell>{firstText(product as JsonInput, ["name", "title"])}</TableCell>
                          <TableCell>{firstText(product as JsonInput, ["status"])}</TableCell>
                          <TableCell>{firstText(product as JsonInput, ["createdAt", "updatedAt"])}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={publishProductState.loading}
                              onClick={() => onPublishProduct(product.id)}
                            >
                              Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deleteProductState.loading}
                              onClick={() => onDeleteProduct(product.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Create product payload (JSON)</Label>
                    <Textarea className="min-h-36 font-mono text-xs" value={createProductJson} onChange={(event) => setCreateProductJson(event.target.value)} />
                    <Button onClick={onCreateProduct} disabled={createProductState.loading}>Create product</Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Update product payload (JSON)</Label>
                    <Textarea className="min-h-36 font-mono text-xs" value={updateProductJson} onChange={(event) => setUpdateProductJson(event.target.value)} />
                    <Button onClick={onUpdateProduct} disabled={updateProductState.loading}>Update product</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service packages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Status</Label>
                    <Select value={serviceStatusFilter} onValueChange={setServiceStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="ALL">ALL</SelectItem>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                        <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                        <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline">Total: {servicePackagesData?.listVendorServicePackages?.total ?? 0}</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicePackagesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5}>Loading...</TableCell>
                      </TableRow>
                    ) : servicePackages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>No service packages found.</TableCell>
                      </TableRow>
                    ) : (
                      servicePackages.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{firstText(item as JsonInput, ["title", "name"])}</TableCell>
                          <TableCell>{firstText(item as JsonInput, ["status"])}</TableCell>
                          <TableCell>{firstText(item as JsonInput, ["createdAt", "updatedAt"])}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={publishServicePackageState.loading}
                              onClick={() => onPublishServicePackage(item.id)}
                            >
                              Publish
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Create service package payload (JSON)</Label>
                    <Textarea className="min-h-36 font-mono text-xs" value={createServiceJson} onChange={(event) => setCreateServiceJson(event.target.value)} />
                    <Button onClick={onCreateServicePackage} disabled={createServicePackageState.loading}>Create service package</Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Add milestone payload (JSON)</Label>
                    <Textarea className="min-h-36 font-mono text-xs" value={addMilestoneJson} onChange={(event) => setAddMilestoneJson(event.target.value)} />
                    <Button onClick={onAddMilestone} disabled={addMilestoneState.loading}>Add milestone</Button>
                    <p className="text-xs text-muted-foreground">
                      Publishing can fail unless milestone percentages total 100%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders & payout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Status</Label>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="ALL">ALL</SelectItem>
                        <SelectItem value="PENDING">PENDING</SelectItem>
                        <SelectItem value="PAID">PAID</SelectItem>
                        <SelectItem value="DISPUTED">DISPUTED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline">Total: {ordersData?.listVendorOrders?.total ?? 0}</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4}>Loading...</TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>No orders found.</TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{firstText(order as JsonInput, ["status"])}</TableCell>
                          <TableCell>
                            {String(order.amount ?? "-")}
                            {order.currency ? ` ${order.currency}` : ""}
                          </TableCell>
                          <TableCell>{firstText(order as JsonInput, ["createdAt", "updatedAt"])}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value={payoutCurrency} onChange={(event) => setPayoutCurrency(event.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={onRequestPayout} disabled={requestPayoutState.loading}>Request payout</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No vendor selected</CardTitle>
              <CardDescription>Enter vendorId and press Load to use system-admin vendor operations.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
