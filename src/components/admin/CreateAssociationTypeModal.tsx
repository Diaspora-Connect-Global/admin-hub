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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useCreateAssociationType } from "@/hooks/admin/useEntityTypes";
import type { AssociationType } from "@/services/networks/graphql/admin";
import { Loader2 } from "lucide-react";

interface CreateAssociationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: AssociationType) => void;
}

export function CreateAssociationTypeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAssociationTypeModalProps) {
  const [createMutation] = useCreateAssociationType();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name Required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await createMutation({
        variables: {
          input: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
          },
        },
      });

      if (result.data?.createAssociationType) {
        toast({
          title: "Association Type Created",
          description: `${formData.name} has been created.`,
        });
        onSuccess(result.data.createAssociationType);
        setFormData({ name: "", description: "" });
        onClose();
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
          <DialogTitle>Create Association Type</DialogTitle>
          <DialogDescription>
            Add a new association type that admins can use when creating associations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Medical Association, Engineers Guild"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Description of this association type..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
