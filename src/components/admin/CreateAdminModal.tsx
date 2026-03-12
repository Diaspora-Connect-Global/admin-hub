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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useCreateAdmin } from "@/hooks/admin/useAdminAccounts";
import type { AdminAccount } from "@/services/networks/graphql/admin";
import { Loader2 } from "lucide-react";

type AdminRoleType =
  | "SYSTEM_ADMIN"
  | "COMMUNITY_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "MODERATOR";

type AdminScopeType = "GLOBAL" | "COMMUNITY" | "ASSOCIATION";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: AdminAccount) => void;
}

export function CreateAdminModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAdminModalProps) {
  const [createAdminMutation] = useCreateAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    adminType: "COMMUNITY_ADMIN" as AdminRoleType,
    scopeType: "COMMUNITY" as AdminScopeType,
    scopeId: "",
  });

  const handleCreateAdmin = async () => {
    // Validation
    if (!formData.email.trim()) {
      toast({ title: "Email Required", variant: "destructive" });
      return;
    }
    if (!formData.password.trim()) {
      toast({ title: "Password Required", variant: "destructive" });
      return;
    }
    if (formData.adminType === "SYSTEM_ADMIN" && formData.scopeType !== "GLOBAL") {
      toast({
        title: "Scope Type Invalid",
        description: "SYSTEM_ADMIN must use GLOBAL scope",
        variant: "destructive",
      });
      return;
    }
    if (
      formData.adminType !== "SYSTEM_ADMIN" &&
      formData.scopeType === "GLOBAL"
    ) {
      toast({
        title: "Scope ID Required",
        description: "Non-SYSTEM_ADMIN accounts need a scope ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await createAdminMutation({
        variables: {
          input: {
            email: formData.email.trim(),
            password: formData.password,
            adminType: formData.adminType,
            scopeType: formData.scopeType,
            scopeId: formData.scopeId || undefined,
          },
        },
      });

      if (result.data?.createAdmin?.success) {
        toast({
          title: "Admin Created",
          description: `${formData.email} has been created as ${formData.adminType}.`,
        });
        onSuccess(result.data.createAdmin.admin);
        setFormData({
          email: "",
          password: "",
          adminType: "COMMUNITY_ADMIN",
          scopeType: "COMMUNITY",
          scopeId: "",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.data?.createAdmin?.message || "Failed to create admin",
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
          <DialogTitle>Create Admin Account</DialogTitle>
          <DialogDescription>
            Create a new admin panel account with specific roles and scope.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="SecurePass123!"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="adminType">Admin Type</Label>
            <Select
              value={formData.adminType}
              onValueChange={(value) =>
                setFormData({ ...formData, adminType: value as AdminRoleType })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="adminType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
                <SelectItem value="COMMUNITY_ADMIN">Community Admin</SelectItem>
                <SelectItem value="ASSOCIATION_ADMIN">
                  Association Admin
                </SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scopeType">Scope Type</Label>
            <Select
              value={formData.scopeType}
              onValueChange={(value) =>
                setFormData({ ...formData, scopeType: value as AdminScopeType })
              }
              disabled={
                isLoading || formData.adminType === "SYSTEM_ADMIN"
              }
            >
              <SelectTrigger id="scopeType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formData.adminType === "SYSTEM_ADMIN" ? (
                  <SelectItem value="GLOBAL">Global</SelectItem>
                ) : (
                  <>
                    <SelectItem value="COMMUNITY">Community</SelectItem>
                    <SelectItem value="ASSOCIATION">Association</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.scopeType !== "GLOBAL" && (
            <div>
              <Label htmlFor="scopeId">Scope ID (Community/Association UUID)</Label>
              <Input
                id="scopeId"
                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                value={formData.scopeId}
                onChange={(e) =>
                  setFormData({ ...formData, scopeId: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateAdmin} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
