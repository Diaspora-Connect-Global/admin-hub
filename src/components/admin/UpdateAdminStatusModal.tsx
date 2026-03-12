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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useUpdateAdminStatus } from "@/hooks/admin/useAdminAccounts";
import type { AdminAccount } from "@/services/networks/graphql/admin";
import { Loader2 } from "lucide-react";

type AdminStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface UpdateAdminStatusModalProps {
  admin: AdminAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateAdminStatusModal({
  admin,
  isOpen,
  onClose,
  onSuccess,
}: UpdateAdminStatusModalProps) {
  const [updateStatusMutation] = useUpdateAdminStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AdminStatus>("ACTIVE");
  const [reason, setReason] = useState("");

  const handleUpdateStatus = async () => {
    if (!admin) return;

    setIsLoading(true);
    try {
      const result = await updateStatusMutation({
        variables: {
          input: {
            adminId: admin.id,
            status,
            reason: reason.trim() || undefined,
          },
        },
      });

      if (result.data?.updateAdminStatus?.success) {
        toast({
          title: "Status Updated",
          description: `${admin.email} status changed to ${status}.`,
        });
        onSuccess();
        setReason("");
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.data?.updateAdminStatus?.message || "Failed to update status",
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
          <DialogTitle>Update Admin Status</DialogTitle>
          <DialogDescription>
            Change the status of {admin?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as AdminStatus)}
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Provide a reason for this status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
