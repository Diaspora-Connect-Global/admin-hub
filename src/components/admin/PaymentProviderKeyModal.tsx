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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  usePaymentUpsertProviderKey,
  usePaymentRotateProviderKey,
  type PaymentProviderCredential,
  type PaymentProviderType,
} from "@/hooks/admin";
import { FieldError } from "@/components/common/FieldError";
import { isoAlpha2, jsonString } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface PaymentProviderKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass an existing credential to put the modal in "rotate / edit" mode. */
  editing?: PaymentProviderCredential | null;
}

const PROVIDER_OPTIONS: Array<{ value: PaymentProviderType; label: string; hint: string }> = [
  {
    value: "STRIPE",
    label: "Stripe",
    hint: "Secret key (sk_...) + webhook signing secret (whsec_...).",
  },
  {
    value: "PAYPAL",
    label: "PayPal",
    hint: "Client ID + Client Secret. Webhook verified via Webhook ID.",
  },
  {
    value: "PAYSTACK",
    label: "Paystack",
    hint: "Secret key (sk_...). Webhook secret optional (falls back to secret key).",
  },
];

const ENVIRONMENT_OPTIONS = [
  { value: "sandbox", label: "Sandbox" },
  { value: "production", label: "Production" },
];

/**
 * Per-provider labels / placeholders for the three secret-ish fields. `apiSecret`
 * is only shown when `showApiSecret` is true (PayPal). `webhookSecret` label
 * differs per provider; `webhookOptional` controls the "(optional)" hint.
 */
const PROVIDER_FIELD_CONFIG: Record<
  PaymentProviderType,
  {
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    showApiSecret: boolean;
    apiSecretLabel?: string;
    apiSecretPlaceholder?: string;
    webhookLabel: string;
    webhookPlaceholder: string;
    webhookOptional: boolean;
    showAdditionalConfig: boolean;
  }
> = {
  STRIPE: {
    apiKeyLabel: "Secret key",
    apiKeyPlaceholder: "sk_live_... / sk_test_...",
    showApiSecret: false,
    webhookLabel: "Webhook signing secret",
    webhookPlaceholder: "whsec_...",
    webhookOptional: false,
    showAdditionalConfig: false,
  },
  PAYPAL: {
    apiKeyLabel: "Client ID",
    apiKeyPlaceholder: "PayPal client ID",
    showApiSecret: true,
    apiSecretLabel: "Client Secret",
    apiSecretPlaceholder: "PayPal client secret",
    webhookLabel: "Webhook ID",
    webhookPlaceholder: "PayPal webhook ID",
    webhookOptional: false,
    showAdditionalConfig: true,
  },
  PAYSTACK: {
    apiKeyLabel: "Secret key",
    apiKeyPlaceholder: "sk_live_... / sk_test_...",
    showApiSecret: false,
    webhookLabel: "Webhook secret",
    webhookPlaceholder: "Optional — falls back to secret key",
    webhookOptional: true,
    showAdditionalConfig: false,
  },
};

interface FormState {
  provider: PaymentProviderType;
  environment: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  additionalConfigJson: string;
  enabledCountries: string;
  expiresAt: string;
}

const EMPTY_FORM: FormState = {
  provider: "STRIPE",
  environment: "sandbox",
  apiKey: "",
  apiSecret: "",
  webhookSecret: "",
  additionalConfigJson: "",
  enabledCountries: "",
  expiresAt: "",
};

/** Parse a comma/space separated country-code list into a clean uppercased array. */
function parseCountries(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

/** Convert an ISO timestamp into a value usable by <input type="datetime-local">. */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Trim seconds/ms and timezone for the local input.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local input value back to an ISO string (or undefined). */
function localInputToIso(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function PaymentProviderKeyModal({
  isOpen,
  onClose,
  editing,
}: PaymentProviderKeyModalProps) {
  const [upsert, { loading: upserting }] = usePaymentUpsertProviderKey();
  const [rotate, { loading: rotating }] = usePaymentRotateProviderKey();
  const loading = upserting || rotating;

  const [showSecrets, setShowSecrets] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!editing;

  /** Update a field and clear any inline error sitting on it. */
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => {
      setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
      return { ...prev, [key]: value };
    });

  // Reset form when modal opens / mode changes. Never echoes existing secret
  // values back — all secret fields start empty in edit mode (empty = "keep").
  useEffect(() => {
    if (!isOpen) return;
    setShowSecrets(false);
    setErrors({});
    if (editing) {
      setForm({
        provider: editing.provider,
        environment: editing.environment,
        apiKey: "",
        apiSecret: "",
        webhookSecret: "",
        additionalConfigJson: "",
        enabledCountries: (editing.enabledCountries ?? []).join(", "),
        expiresAt: isoToLocalInput(editing.expiresAt),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, editing]);

  const fieldConfig = PROVIDER_FIELD_CONFIG[form.provider];

  const clearSecrets = () =>
    setForm((prev) => ({ ...prev, apiKey: "", apiSecret: "", webhookSecret: "" }));

  /**
   * Validate the form, returning the parsed payload when valid, or null after
   * populating inline field errors. Covers: required-on-add, ISO country codes,
   * future expiry, valid JSON config, and the rotate-needs-apiKey rule.
   */
  const validateForm = (): {
    countries: string[];
    expiresAt?: string;
    additionalConfigJson?: string;
  } | null => {
    const next: Record<string, string> = {};

    const countries = parseCountries(form.enabledCountries);
    if (countries.some((c) => !isoAlpha2.safeParse(c).success)) {
      next.enabledCountries = "Use 2-letter ISO country codes (e.g. GH, NG, US)";
    }

    const expiresAt = localInputToIso(form.expiresAt);
    if (form.expiresAt.trim()) {
      if (!expiresAt) next.expiresAt = "Enter a valid date";
      else if (new Date(expiresAt).getTime() <= Date.now())
        next.expiresAt = "Expiry must be a future date";
    }

    let additionalConfigJson: string | undefined;
    if (fieldConfig.showAdditionalConfig && form.additionalConfigJson.trim()) {
      if (!jsonString.safeParse(form.additionalConfigJson).success) {
        next.additionalConfigJson = "Must be valid JSON";
      } else {
        additionalConfigJson = form.additionalConfigJson.trim();
      }
    }

    const hasNewSecret =
      !!form.apiKey.trim() || !!form.apiSecret.trim() || !!form.webhookSecret.trim();

    if (!isEdit) {
      if (!form.apiKey.trim()) next.apiKey = `${fieldConfig.apiKeyLabel} is required`;
      if (fieldConfig.showApiSecret && !form.apiSecret.trim())
        next.apiSecret = `${fieldConfig.apiSecretLabel} is required`;
    } else if (hasNewSecret && !form.apiKey.trim()) {
      next.apiKey = "Enter the primary key alongside the secrets you're rotating";
    }

    setErrors(next);
    if (Object.keys(next).length) return null;
    return { countries, expiresAt, additionalConfigJson };
  };

  const handleSubmit = async () => {
    const parsed = validateForm();
    if (!parsed) return;
    const { countries, expiresAt, additionalConfigJson } = parsed;

    const hasNewSecret =
      !!form.apiKey.trim() || !!form.apiSecret.trim() || !!form.webhookSecret.trim();

    try {
      if (isEdit) {
        // Editing => rotate new secrets (if any were entered), and always
        // upsert the non-secret config (environment / enabledCountries /
        // expiresAt / additionalConfig).
        if (hasNewSecret) {
          await rotate({
            variables: {
              input: {
                id: editing!.id,
                apiKey: form.apiKey.trim(),
                apiSecret: form.apiSecret.trim() || undefined,
                webhookSecret: form.webhookSecret.trim() || undefined,
                expiresAt,
              },
            },
          });
        }
        // Always sync non-secret config via upsert (re-uses the existing secret
        // server-side when apiKey is omitted/empty — the resolver treats empty
        // apiKey on an existing (provider, environment) as "keep current").
        await upsert({
          variables: {
            input: {
              provider: form.provider,
              environment: form.environment,
              apiKey: form.apiKey.trim() || "",
              apiSecret: form.apiSecret.trim() || undefined,
              webhookSecret: form.webhookSecret.trim() || undefined,
              additionalConfigJson,
              enabledCountries: countries,
              expiresAt,
            },
          },
        });
      } else {
        await upsert({
          variables: {
            input: {
              provider: form.provider,
              environment: form.environment,
              apiKey: form.apiKey.trim(),
              apiSecret: form.apiSecret.trim() || undefined,
              webhookSecret: form.webhookSecret.trim() || undefined,
              additionalConfigJson,
              enabledCountries: countries,
              expiresAt,
            },
          },
        });
      }

      clearSecrets();
      toast({
        title: isEdit ? "Provider key updated" : "Provider key added",
        description: `${form.provider} (${form.environment}) saved.`,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Payment Provider Key" : "Add Payment Provider Key"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update settings, or paste a new secret to rotate it. Leave secret fields blank to keep the existing ones."
              : "Store a payment provider's API credentials. Secrets are encrypted at rest and never echoed back."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={form.provider}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, provider: v as PaymentProviderType }))
                }
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
            </div>

            <div className="space-y-2">
              <Label>Environment</Label>
              <Select
                value={form.environment}
                onValueChange={(v) => setForm((p) => ({ ...p, environment: v }))}
                disabled={loading || isEdit}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {ENVIRONMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {PROVIDER_OPTIONS.find((o) => o.value === form.provider)?.hint}
          </p>

          {/* Show secrets toggle */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowSecrets((s) => !s)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showSecrets ? "Hide secrets" : "Show secrets"}
            </button>
          </div>

          {/* API key */}
          <div className="space-y-2">
            <Label htmlFor="pp-api-key">
              {fieldConfig.apiKeyLabel}{" "}
              {isEdit && (
                <span className="text-muted-foreground font-normal">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="pp-api-key"
              type={showSecrets ? "text" : "password"}
              placeholder={isEdit ? "Paste new value to rotate" : fieldConfig.apiKeyPlaceholder}
              value={form.apiKey}
              onChange={(e) => setField("apiKey", e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
              className="bg-secondary border-border"
              aria-invalid={!!errors.apiKey}
            />
            <FieldError message={errors.apiKey} />
          </div>

          {/* API secret (PayPal only) */}
          {fieldConfig.showApiSecret && (
            <div className="space-y-2">
              <Label htmlFor="pp-api-secret">
                {fieldConfig.apiSecretLabel}{" "}
                {isEdit && (
                  <span className="text-muted-foreground font-normal">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="pp-api-secret"
                type={showSecrets ? "text" : "password"}
                placeholder={
                  isEdit ? "Paste new value to rotate" : fieldConfig.apiSecretPlaceholder
                }
                value={form.apiSecret}
                onChange={(e) => setField("apiSecret", e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={loading}
                className="bg-secondary border-border"
                aria-invalid={!!errors.apiSecret}
              />
              <FieldError message={errors.apiSecret} />
            </div>
          )}

          {/* Webhook secret / ID */}
          <div className="space-y-2">
            <Label htmlFor="pp-webhook">
              {fieldConfig.webhookLabel}{" "}
              {fieldConfig.webhookOptional && (
                <span className="text-muted-foreground font-normal">(optional)</span>
              )}
              {isEdit && !fieldConfig.webhookOptional && (
                <span className="text-muted-foreground font-normal">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="pp-webhook"
              type={showSecrets ? "text" : "password"}
              placeholder={isEdit ? "Paste new value to rotate" : fieldConfig.webhookPlaceholder}
              value={form.webhookSecret}
              onChange={(e) => setField("webhookSecret", e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
              className="bg-secondary border-border"
            />
          </div>

          {/* Additional config JSON (PayPal optional) */}
          {fieldConfig.showAdditionalConfig && (
            <div className="space-y-2">
              <Label htmlFor="pp-config">Additional Config (optional JSON)</Label>
              <textarea
                id="pp-config"
                placeholder='{"merchantId":"..."}'
                value={form.additionalConfigJson}
                onChange={(e) => setField("additionalConfigJson", e.target.value)}
                spellCheck={false}
                disabled={loading}
                rows={3}
                aria-invalid={!!errors.additionalConfigJson}
                className="flex w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <FieldError message={errors.additionalConfigJson} />
            </div>
          )}

          {/* Enabled countries */}
          <div className="space-y-2">
            <Label htmlFor="pp-countries">Enabled Countries (optional)</Label>
            <Input
              id="pp-countries"
              placeholder="e.g. GH, NG, US (comma separated)"
              value={form.enabledCountries}
              onChange={(e) => setField("enabledCountries", e.target.value)}
              disabled={loading}
              className="bg-secondary border-border"
              aria-invalid={!!errors.enabledCountries}
            />
            <FieldError message={errors.enabledCountries} />
            <p className="text-xs text-muted-foreground">
              ISO country codes this provider routes for. Leave empty for all countries.
            </p>
          </div>

          {/* Expires at */}
          <div className="space-y-2">
            <Label htmlFor="pp-expires">Expires At (optional)</Label>
            <Input
              id="pp-expires"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setField("expiresAt", e.target.value)}
              disabled={loading}
              className="bg-secondary border-border"
              aria-invalid={!!errors.expiresAt}
            />
            <FieldError message={errors.expiresAt} />
          </div>

          <p className="text-xs text-muted-foreground">
            Secrets are encrypted at rest. They are never logged or echoed back over the wire.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Provider Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
