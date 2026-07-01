import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  KeyRound,
  Plus,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import {
  usePaymentProviderKeysList,
  usePaymentDisableProviderKey,
  usePaymentEnableProviderKey,
  type PaymentProviderCredential,
  type PaymentProviderType,
} from "@/hooks/admin";
import { PaymentProviderKeyModal } from "@/components/admin/PaymentProviderKeyModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";

const PROVIDER_LABELS: Record<PaymentProviderType, string> = {
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
  PAYSTACK: "Paystack",
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function PaymentProviderKeys() {
  const { toast } = useToast();
  const { isSystemAdmin, isAuthenticated } = useAdminAuth();
  // Client-side role gate — the underlying GraphQL operations are server-gated
  // too (`@Roles('SYSTEM_ADMIN', 'SUPER_ADMIN')`). The <Navigate /> is rendered
  // at the bottom so we never break rules-of-hooks ordering between renders.
  const shouldRedirect = isAuthenticated && !isSystemAdmin;

  const { data, loading } = usePaymentProviderKeysList();
  const credentials = data?.paymentListProviderCredentials ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentProviderCredential | null>(null);
  const [disableTarget, setDisableTarget] = useState<PaymentProviderCredential | null>(null);

  const [disableMutation, { loading: disabling }] = usePaymentDisableProviderKey();
  const [enableMutation, { loading: enabling }] = usePaymentEnableProviderKey();

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (cred: PaymentProviderCredential) => {
    setEditing(cred);
    setModalOpen(true);
  };

  const handleEnable = async (cred: PaymentProviderCredential) => {
    try {
      await enableMutation({ variables: { id: cred.id } });
      toast({
        title: "Provider key enabled",
        description: `${PROVIDER_LABELS[cred.provider] ?? cred.provider} (${cred.environment}) is now active.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: friendlyErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const handleDisable = async () => {
    if (!disableTarget) return;
    try {
      await disableMutation({ variables: { id: disableTarget.id } });
      toast({
        title: "Provider key disabled",
        description: `${PROVIDER_LABELS[disableTarget.provider] ?? disableTarget.provider} (${disableTarget.environment}) can no longer process payments.`,
      });
      setDisableTarget(null);
    } catch (err) {
      toast({
        title: "Error",
        description: friendlyErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              Payment Provider Keys
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage encrypted Stripe, PayPal, and Paystack API credentials per environment.
            </p>
          </div>
        </div>

        <SettingsTabs />

        {/* Provider Credentials */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Provider Credentials
                </CardTitle>
                <CardDescription>
                  Encrypted-at-rest API keys. Only the masked preview (e.g.{" "}
                  <code>sk_...XYZ4</code>) is ever displayed.
                </CardDescription>
              </div>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Provider Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && credentials.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No payment provider keys yet. Add one to start processing payments.
              </p>
            ) : (
              <div className="table-container">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Provider</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Key Preview</TableHead>
                      <TableHead>Countries</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Rotated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials.map((cred) => (
                      <TableRow key={cred.id} className="border-border">
                        <TableCell className="font-medium">
                          {PROVIDER_LABELS[cred.provider] ?? cred.provider}
                        </TableCell>
                        <TableCell>
                          {cred.environment === "production" ? (
                            <StatusBadge variant="warning">Production</StatusBadge>
                          ) : (
                            <StatusBadge variant="inactive">Sandbox</StatusBadge>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {cred.keyPreview}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {cred.enabledCountries.length > 0
                            ? cred.enabledCountries.join(", ")
                            : "All"}
                        </TableCell>
                        <TableCell>
                          {cred.isActive ? (
                            <StatusBadge variant="active">Active</StatusBadge>
                          ) : (
                            <StatusBadge variant="inactive">Disabled</StatusBadge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(cred.lastRotatedAt ?? cred.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleEdit(cred)}
                              >
                                <Pencil className="w-4 h-4" /> Edit / Rotate
                              </DropdownMenuItem>
                              {cred.isActive ? (
                                <DropdownMenuItem
                                  className="gap-2 text-destructive"
                                  onClick={() => setDisableTarget(cred)}
                                >
                                  <PowerOff className="w-4 h-4" /> Disable
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleEnable(cred)}
                                  disabled={enabling}
                                >
                                  <Power className="w-4 h-4" /> Enable
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit modal */}
      <PaymentProviderKeyModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />

      {/* Disable confirm */}
      <AlertDialog
        open={!!disableTarget}
        onOpenChange={(open) => !open && setDisableTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable provider key?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                <span className="font-medium">
                  {disableTarget && PROVIDER_LABELS[disableTarget.provider]}
                </span>{" "}
                ({disableTarget?.environment}) will stop processing payments immediately.
              </span>
              <span className="block mt-2 text-xs">
                You can re-enable it later from the actions menu. The encrypted secrets are retained.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={disabling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disabling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
