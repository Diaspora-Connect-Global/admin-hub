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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useCreateCommunityType } from "@/hooks/admin/useEntityTypes";
import type { CommunityType } from "@/services/networks/graphql/admin";
import { Loader2 } from "lucide-react";

interface CreateCommunityTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: CommunityType) => void;
}

export function CreateCommunityTypeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCommunityTypeModalProps) {
  const [createMutation] = useCreateCommunityType();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isEmbassy: false,
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
            isEmbassy: formData.isEmbassy,
          },
        },
      });

      if (result.data?.createCommunityType) {
        toast({
          title: "Community Type Created",
          description: `${formData.name} has been created.`,
        });
        onSuccess(result.data.createCommunityType);
        setFormData({ name: "", description: "", isEmbassy: false });
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
          <DialogTitle>Create Community Type</DialogTitle>
          <DialogDescription>
            Add a new community type that admins can use when creating communities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Diaspora, Embassy"
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
              placeholder="Description of this community type..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isEmbassy"
              checked={formData.isEmbassy}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isEmbassy: checked as boolean })
              }
              disabled={isLoading}
            />
            <Label htmlFor="isEmbassy" className="cursor-pointer">
              Mark as Embassy-related
            </Label>
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
