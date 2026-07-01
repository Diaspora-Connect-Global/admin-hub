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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  useAiUpsertProviderCredential,
  type AiProviderCredential,
  type AiProviderType,
} from "@/hooks/admin";
import { FieldError } from "@/components/common/FieldError";
import { secureHttpsUrl } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface AiProviderCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass an existing credential to put the modal in "rotate / edit" mode. */
  editing?: AiProviderCredential | null;
}

const PROVIDER_OPTIONS: Array<{ value: AiProviderType; label: string; hint: string }> = [
  { value: "GROQ", label: "Groq (free)", hint: "Low-latency Llama-3 / Mixtral. Free tier — no card." },
  { value: "OPENROUTER", label: "OpenRouter (free tier)", hint: "Multi-model aggregator. Many free models." },
  { value: "HUGGINGFACE", label: "Hugging Face (free)", hint: "Zero-shot BART. Returns categories only." },
  { value: "OPENAI", label: "OpenAI (paid)", hint: "Highest quality. Requires a paid API account." },
];

export function AiProviderCredentialModal({
  isOpen,
  onClose,
  editing,
}: AiProviderCredentialModalProps) {
  const [upsert, { loading }] = useAiUpsertProviderCredential();
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({
    provider: "GROQ" as AiProviderType,
    label: "",
    apiKey: "",
    modelDefault: "",
    endpointUrl: "",
    isActive: true,
    priority: 100,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Update a field and clear any inline error sitting on it. */
  const setField = (key: string, value: unknown) => {
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Reset form when modal opens / mode changes. Never echoes the existing key
  // back — apiKey starts empty in edit mode (empty = "do not rotate").
  useEffect(() => {
    if (!isOpen) return;
    setShowKey(false);
    setErrors({});
    if (editing) {
      setForm({
        provider: editing.provider,
        label: editing.label,
        apiKey: "",
        modelDefault: editing.modelDefault ?? "",
        endpointUrl: editing.endpointUrl ?? "",
        isActive: editing.isActive,
        priority: editing.priority,
      });
    } else {
      setForm({
        provider: "GROQ",
        label: "",
        apiKey: "",
        modelDefault: "",
        endpointUrl: "",
        isActive: true,
        priority: 100,
      });
    }
  }, [isOpen, editing]);

  const isEdit = !!editing;

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!form.label.trim()) next.label = "Label is required";
    if (!isEdit && !form.apiKey.trim()) next.apiKey = "API key is required";
    if (form.endpointUrl.trim()) {
      const parsed = secureHttpsUrl.safeParse(form.endpointUrl.trim());
      if (!parsed.success) {
        // Mirror the server-side SSRF guard (https + public host only).
        next.endpointUrl =
          parsed.error.issues[0]?.message ?? "Use a public https endpoint";
      }
    }
    if (!Number.isFinite(Number(form.priority)) || Number(form.priority) < 0) {
      next.priority = "Priority must be a non-negative number";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await upsert({
        variables: {
          input: {
            id: editing?.id,
            provider: form.provider,
            label: form.label.trim(),
            // Skip apiKey on edit if user left it blank — server treats this
            // as "do not rotate". The backend resolver also ignores empty
            // strings. We always send a value (empty string for "leave alone").
            apiKey: form.apiKey,
            modelDefault: form.modelDefault.trim() || undefined,
            endpointUrl: form.endpointUrl.trim() || undefined,
            isActive: form.isActive,
            priority: Number(form.priority),
          },
        },
      });
      // Clear the secret from local state before unmounting.
      setForm((prev) => ({ ...prev, apiKey: "" }));
      toast({
        title: isEdit ? "Credential updated" : "Credential added",
        description: `${form.label} is now ${form.isActive ? "active" : "inactive"}.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: friendlyErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Provider Credential" : "Add Provider Credential"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update settings or leave API key blank to keep the existing one."
              : "Store an LLM provider API key. The key is encrypted at rest and never echoed back."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={form.provider}
              onValueChange={(v) => setForm((p) => ({ ...p, provider: v as AiProviderType }))}
              disabled={loading || isEdit}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PROVIDER_OPTIONS.find((o) => o.value === form.provider)?.hint}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-label">Label</Label>
            <Input
              id="ai-label"
              placeholder="e.g. Production Groq"
              value={form.label}
              onChange={(e) => setField("label", e.target.value)}
              disabled={loading}
              className="bg-secondary border-border"
              aria-invalid={!!errors.label}
            />
            <FieldError message={errors.label} />
            <p className="text-xs text-muted-foreground">
              Friendly name shown in this admin only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-key">
              API Key {isEdit && <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="ai-key"
                  type={showKey ? "text" : "password"}
                  placeholder={isEdit ? "Paste new key to rotate" : "sk-..."}
                  value={form.apiKey}
                  onChange={(e) => setField("apiKey", e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                  className="bg-secondary border-border pr-10"
                  aria-invalid={!!errors.apiKey}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  disabled={loading}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <FieldError message={errors.apiKey} />
            <p className="text-xs text-muted-foreground">
              Encrypted with AES-256-GCM before storage. Never logged or echoed back over the wire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ai-model">Default Model (optional)</Label>
              <Input
                id="ai-model"
                placeholder="e.g. llama-3.1-70b-versatile"
                value={form.modelDefault}
                onChange={(e) => setField("modelDefault", e.target.value)}
                disabled={loading}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-priority">Priority</Label>
              <Input
                id="ai-priority"
                type="number"
                min={0}
                value={form.priority}
                onChange={(e) => setField("priority", Number(e.target.value))}
                disabled={loading}
                className="bg-secondary border-border"
                aria-invalid={!!errors.priority}
              />
              <FieldError message={errors.priority} />
              <p className="text-xs text-muted-foreground">Lower runs first within the same provider.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-endpoint">Endpoint URL (optional)</Label>
            <Input
              id="ai-endpoint"
              placeholder="Override the default provider endpoint"
              value={form.endpointUrl}
              onChange={(e) => setField("endpointUrl", e.target.value)}
              disabled={loading}
              className="bg-secondary border-border"
              aria-invalid={!!errors.endpointUrl}
            />
            <FieldError message={errors.endpointUrl} />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 h-10">
            <div>
              <Label className="cursor-pointer">Active</Label>
              <p className="text-xs text-muted-foreground">
                Only active credentials are tried at classify time.
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
