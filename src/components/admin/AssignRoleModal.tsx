import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAssignAdminRole } from "@/hooks/admin/useAdminAccounts";
import type { AdminAccount } from "@/services/networks/graphql/admin";
import { Loader2 } from "lucide-react";

type AdminRoleType =
  | "SYSTEM_ADMIN"
  | "COMMUNITY_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "MODERATOR";

type AdminScopeType = "GLOBAL" | "COMMUNITY" | "ASSOCIATION";

interface AssignRoleModalProps {
  admin: AdminAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignRoleModal({
  admin,
  isOpen,
  onClose,
  onSuccess,
}: AssignRoleModalProps) {
  const [assignRoleMutation] = useAssignAdminRole();
  const [isLoading, setIsLoading] = useState(false);
  const [roleType, setRoleType] = useState<AdminRoleType>("COMMUNITY_ADMIN");
  const [scopeType, setScopeType] = useState<AdminScopeType>("COMMUNITY");
  const [scopeId, setScopeId] = useState("");

  const handleAssignRole = async () => {
    if (!admin) return;

    if (scopeType !== "GLOBAL" && !scopeId.trim()) {
      toast({
        title: "Scope ID Required",
        description: "Please provide the community/association ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await assignRoleMutation({
        variables: {
          input: {
            adminId: admin.id,
            roleType,
            scopeType,
            scopeId: scopeType === "GLOBAL" ? undefined : scopeId.trim(),
          },
        },
      });

      if (result.data?.assignAdminRole?.success) {
        toast({
          title: "Role Assigned",
          description: `${roleType} role assigned to ${admin.email}.`,
        });
        onSuccess();
        setScopeId("");
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.data?.assignAdminRole?.message || "Failed to assign role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Additional Role</DialogTitle>
          <DialogDescription>
            Assign a new role to {admin?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="roleType">Role Type</Label>
            <Select
              value={roleType}
              onValueChange={(value) => setRoleType(value as AdminRoleType)}
              disabled={isLoading}
            >
              <SelectTrigger id="roleType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
                <SelectItem value="COMMUNITY_ADMIN">Community Admin</SelectItem>
                <SelectItem value="ASSOCIATION_ADMIN">Association Admin</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scopeType">Scope Type</Label>
            <Select
              value={scopeType}
              onValueChange={(value) => setScopeType(value as AdminScopeType)}
              disabled={isLoading}
            >
              <SelectTrigger id="scopeType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Global</SelectItem>
                <SelectItem value="COMMUNITY">Community</SelectItem>
                <SelectItem value="ASSOCIATION">Association</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scopeType !== "GLOBAL" && (
            <div>
              <Label htmlFor="scopeId">
                {scopeType === "COMMUNITY" ? "Community" : "Association"} ID
              </Label>
              <Input
                id="scopeId"
                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssignRole} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
