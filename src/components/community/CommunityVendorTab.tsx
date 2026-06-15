import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Pause, Store, Loader2 } from "lucide-react";
import { getStatusBadge } from "./statusBadge";

interface CommunityProduct {
  id: string;
  title?: string | null;
  name?: string | null;
  vendorName?: string | null;
  vendorId?: string | null;
  productType?: string | null;
  price?: number | null;
  currency?: string | null;
  inventoryCount?: number | null;
  status?: string | null;
}

interface CommunityVendorTabProps {
  communityProducts: CommunityProduct[];
  communityProductsLoading: boolean;
}

export function CommunityVendorTab({
  communityProducts,
  communityProductsLoading,
}: CommunityVendorTabProps) {
  return (
    <TabsContent value="vendor" className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Vendor Products & Services</CardTitle>
          <CardDescription>Manage community's vendor listings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {communityProductsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading products…</span>
            </div>
          ) : communityProducts.length === 0 ? (
            <div className="text-center py-8">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No vendor products found for this community.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Item ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communityProducts.map((item) => (
                  <TableRow key={item.id} className="border-border/50">
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.title ?? item.name ?? "—"}</TableCell>
                    <TableCell>{item.vendorName ?? item.vendorId ?? "—"}</TableCell>
                    <TableCell>{item.productType ?? "—"}</TableCell>
                    <TableCell>{item.price != null ? `${item.currency ?? ""} ${item.price}`.trim() : "—"}</TableCell>
                    <TableCell>{item.inventoryCount ?? "—"}</TableCell>
                    <TableCell>{item.status ? getStatusBadge(item.status) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-success" aria-label="Approve product"><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-warning" aria-label="Pause product"><Pause className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
