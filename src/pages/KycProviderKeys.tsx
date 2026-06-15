import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ShieldCheck,
  KeyRound,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import {
  useKycProviderKeysList,
  useKycRevokeProviderKey,
  type KycProviderCredential,
  type KycProviderType,
} from "@/hooks/admin";
import { KycProviderCredentialModal } from "@/components/admin/KycProviderCredentialModal";
import { StatusBadge } from "@/components/ui/StatusBadge";

const PROVIDER_LABELS: Record<KycProviderType, string> = {
  ONFIDO: "Onfido",
  ITSME: "itsme",
  SUMSUB: "Sumsub",
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

/** Human-readable summary of the non-secret config for a credential row. */
function configSummary(cred: KycProviderCredential): string {
  switch (cred.provider) {
    case "ONFIDO":
      return cred.region ? `Region: ${cred.region}` : "—";
    case "ITSME": {
      const parts: string[] = [];
      if (cred.environment) parts.push(cred.environment);
      if (cred.redirectUri) parts.push(cred.redirectUri);
      return parts.length > 0 ? parts.join(" • ") : "—";
    }
    case "SUMSUB": {
      const parts: string[] = [];
      if (cred.baseUrl) parts.push(cred.baseUrl);
      if (cred.levelName) parts.push(cred.levelName);
      return parts.length > 0 ? parts.join(" • ") : "—";
    }
    default:
      return "—";
  }
}

export default function KycProviderKeys() {
  const { toast } = useToast();
  const { isSystemAdmin, isAuthenticated } = useAdminAuth();
  // Client-side role gate — the underlying GraphQL operations are server-gated
  // too (`@Roles('SYSTEM_ADMIN', 'SUPER_ADMIN')`). The <Navigate /> is rendered
  // at the bottom so we never break rules-of-hooks ordering between renders.
  const shouldRedirect = isAuthenticated && !isSystemAdmin;

  const { data, loading } = useKycProviderKeysList();
  const credentials = data?.kycListProviderCredentials ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KycProviderCredential | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<KycProviderCredential | null>(null);

  const [revokeMutation, { loading: revoking }] = useKycRevokeProviderKey();

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (cred: KycProviderCredential) => {
    setEditing(cred);
    setModalOpen(true);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation({ variables: { provider: revokeTarget.provider } });
      toast({
        title: "Provider key revoked",
        description: `${PROVIDER_LABELS[revokeTarget.provider] ?? revokeTarget.provider} can no longer be used for verification.`,
      });
      setRevokeTarget(null);
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
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
              <ShieldCheck className="w-6 h-6 text-primary" />
              KYC Provider Keys
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage encrypted Onfido, itsme, and Sumsub credentials for identity
              verification.
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
                  <code>tok_...XYZ4</code>) is ever displayed. One active
                  credential per provider.
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
                No KYC provider keys yet. Add one to enable identity verification.
              </p>
            ) : (
              <div className="table-container">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Provider</TableHead>
                      <TableHead>Key Preview</TableHead>
                      <TableHead>Config</TableHead>
                      <TableHead>Secrets</TableHead>
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
                          <code className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {cred.keyPreview}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[18rem] truncate">
                          {configSummary(cred)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {cred.hasApiSecret && (
                              <Badge variant="secondary" className="text-xs">
                                Secret
                              </Badge>
                            )}
                            {cred.hasWebhookSecret && (
                              <Badge variant="secondary" className="text-xs">
                                Webhook
                              </Badge>
                            )}
                            {!cred.hasApiSecret && !cred.hasWebhookSecret && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
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
                                <Pencil className="w-4 h-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => setRevokeTarget(cred)}
                              >
                                <Trash2 className="w-4 h-4" /> Revoke
                              </DropdownMenuItem>
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
      <KycProviderCredentialModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />

      {/* Revoke confirm */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke provider key?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                <span className="font-medium">
                  {revokeTarget && PROVIDER_LABELS[revokeTarget.provider]}
                </span>{" "}
                will stop processing identity verifications immediately.
              </span>
              <span className="block mt-2 text-xs">
                KYC is optional — revoking never blocks user or vendor operations.
                You can add a new key later from this page.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
