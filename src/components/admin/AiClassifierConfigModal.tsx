import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  useAiUpdateClassifierConfig,
  type AiClassifierConfig,
} from "@/hooks/admin";
import { Loader2 } from "lucide-react";

interface AiClassifierConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: AiClassifierConfig | null;
}

const parseList = (raw: string): string[] =>
  raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);

export function AiClassifierConfigModal({
  isOpen,
  onClose,
  current,
}: AiClassifierConfigModalProps) {
  const [update, { loading }] = useAiUpdateClassifierConfig();

  const [form, setForm] = useState({
    taxonomyText: "",
    promptTemplate: "",
    temperature: "0.2",
    maxTopics: "10",
    minConfidence: "0.5",
    isActive: true,
  });

  useEffect(() => {
    if (!isOpen || !current) return;
    setForm({
      taxonomyText: current.taxonomy.join(", "),
      promptTemplate: current.promptTemplate,
      temperature: String(current.temperature),
      maxTopics: String(current.maxTopics),
      minConfidence: String(current.minConfidence),
      isActive: current.isActive,
    });
  }, [isOpen, current]);

  const handleSave = async () => {
    const taxonomy = parseList(form.taxonomyText);
    if (taxonomy.length === 0) {
      toast({
        title: "Taxonomy required",
        description: "Provide at least one category.",
        variant: "destructive",
      });
      return;
    }
    const temperature = Number(form.temperature);
    const maxTopics = Number(form.maxTopics);
    const minConfidence = Number(form.minConfidence);
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      toast({ title: "Invalid temperature", description: "Use 0 – 2.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(maxTopics) || maxTopics < 1) {
      toast({ title: "Invalid maxTopics", variant: "destructive" });
      return;
    }
    if (Number.isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1) {
      toast({ title: "Invalid minConfidence", description: "Use 0 – 1.", variant: "destructive" });
      return;
    }

    try {
      await update({
        variables: {
          input: {
            taxonomy,
            promptTemplate: form.promptTemplate.trim() || undefined,
            temperature,
            maxTopics,
            minConfidence,
            isActive: form.isActive,
          },
        },
      });
      toast({
        title: "Classifier config saved",
        description: "Version bumped; downstream services will pick it up on next event.",
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Classifier Config</DialogTitle>
          <DialogDescription>
            Hot-reloadable. Saving bumps the classifier version; post-feed-service
            and recommendation-service skip events older than the active version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="ai-taxonomy">Taxonomy</Label>
            <Textarea
              id="ai-taxonomy"
              rows={3}
              value={form.taxonomyText}
              onChange={(e) => setForm((p) => ({ ...p, taxonomyText: e.target.value }))}
              disabled={loading}
              className="bg-secondary border-border font-mono text-sm"
              placeholder="Politics, Tech, Business, ..."
            />
            <p className="text-xs text-muted-foreground">
              Comma or newline-separated. Non-taxonomy outputs from the LLM are dropped server-side.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-prompt">Prompt Template</Label>
            <Textarea
              id="ai-prompt"
              rows={8}
              value={form.promptTemplate}
              onChange={(e) => setForm((p) => ({ ...p, promptTemplate: e.target.value }))}
              disabled={loading}
              className="bg-secondary border-border font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Post body is appended at the end as untrusted input; the model sees a system message instructing it to ignore embedded instructions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ai-temperature">Temperature</Label>
              <Input
                id="ai-temperature"
                type="number"
                step="0.1"
                min={0}
                max={2}
                value={form.temperature}
                onChange={(e) => setForm((p) => ({ ...p, temperature: e.target.value }))}
                disabled={loading}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">0 deterministic – 2 creative.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-max-topics">Max Topics</Label>
              <Input
                id="ai-max-topics"
                type="number"
                min={1}
                value={form.maxTopics}
                onChange={(e) => setForm((p) => ({ ...p, maxTopics: e.target.value }))}
                disabled={loading}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-min-conf">Min Confidence</Label>
              <Input
                id="ai-min-conf"
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={form.minConfidence}
                onChange={(e) => setForm((p) => ({ ...p, minConfidence: e.target.value }))}
                disabled={loading}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 h-10">
            <div>
              <Label className="cursor-pointer">Active</Label>
              <p className="text-xs text-muted-foreground">
                Disabling pauses live classification (events still consumed, ignored).
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Config
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
