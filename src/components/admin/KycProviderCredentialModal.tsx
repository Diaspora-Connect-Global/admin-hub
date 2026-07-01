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
  useKycUpsertProviderKey,
  type KycProviderCredential,
  type KycProviderType,
} from "@/hooks/admin";
import { FieldError } from "@/components/common/FieldError";
import { httpUrl } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface KycProviderCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass an existing credential to put the modal in "edit" mode. */
  editing?: KycProviderCredential | null;
}

/**
 * Per-provider field configuration. KYC uses a single-upsert model (like the AI
 * vertical) — there is no separate rotate path. `configJson` is built from the
 * non-secret fields each provider declares below.
 *
 * Field mapping (locked contract):
 *  - ONFIDO: apiKey = "Onfido API Token", webhookSecret = "Webhook Token",
 *    config = { region: 'EU' | 'US' }. (no apiSecret)
 *  - ITSME:  apiKey = "Client ID", apiSecret = "Client Secret",
 *    config = { redirectUri, environment: 'sandbox' | 'production' }.
 *    (no webhookSecret)
 *  - SUMSUB: apiKey = "App Token", apiSecret = "Secret Key",
 *    config = { baseUrl, levelName }. (no webhookSecret)
 */
const PROVIDER_OPTIONS: Array<{
  value: KycProviderType;
  label: string;
  hint: string;
}> = [
  {
    value: "ONFIDO",
    label: "Onfido",
    hint: "Document + selfie verification. API Token + Webhook Token.",
  },
  {
    value: "ITSME",
    label: "itsme",
    hint: "Belgian OIDC digital identity. Client ID goes in the identifier field, Client Secret in the secret field.",
  },
  {
    value: "SUMSUB",
    label: "Sumsub",
    hint: "KYC/KYB platform. App Token + Secret Key.",
  },
];

interface FormState {
  provider: KycProviderType;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  // Onfido config
  region: string;
  // itsme config
  redirectUri: string;
  environment: string;
  // Sumsub config
  baseUrl: string;
  levelName: string;
}

const SUMSUB_DEFAULT_BASE_URL = "https://api.sumsub.com";
const SUMSUB_DEFAULT_LEVEL_NAME = "basic-kyc-level";

const EMPTY_FORM: FormState = {
  provider: "ONFIDO",
  apiKey: "",
  apiSecret: "",
  webhookSecret: "",
  region: "EU",
  redirectUri: "",
  environment: "sandbox",
  baseUrl: SUMSUB_DEFAULT_BASE_URL,
  levelName: SUMSUB_DEFAULT_LEVEL_NAME,
};

/**
 * Per-provider labels / which fields are rendered. `apiKeyLabel` doubles as the
 * identifier field (Client ID for itsme, App Token for Sumsub, API Token for
 * Onfido). `showApiSecret` / `showWebhookSecret` gate the two secret inputs.
 */
const PROVIDER_FIELD_CONFIG: Record<
  KycProviderType,
  {
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    showApiSecret: boolean;
    apiSecretLabel?: string;
    apiSecretPlaceholder?: string;
    showWebhookSecret: boolean;
    webhookLabel?: string;
    webhookPlaceholder?: string;
  }
> = {
  ONFIDO: {
    apiKeyLabel: "Onfido API Token",
    apiKeyPlaceholder: "api_live_... / api_sandbox_...",
    showApiSecret: false,
    showWebhookSecret: true,
    webhookLabel: "Webhook Token",
    webhookPlaceholder: "Onfido webhook token",
  },
  ITSME: {
    apiKeyLabel: "Client ID",
    apiKeyPlaceholder: "itsme client ID",
    showApiSecret: true,
    apiSecretLabel: "Client Secret",
    apiSecretPlaceholder: "itsme client secret",
    showWebhookSecret: false,
  },
  SUMSUB: {
    apiKeyLabel: "App Token",
    apiKeyPlaceholder: "sbx:... / prd:...",
    showApiSecret: true,
    apiSecretLabel: "Secret Key",
    apiSecretPlaceholder: "Sumsub secret key",
    showWebhookSecret: false,
  },
};

const ONFIDO_REGION_OPTIONS = [
  { value: "EU", label: "EU" },
  { value: "US", label: "US" },
];

const ITSME_ENVIRONMENT_OPTIONS = [
  { value: "sandbox", label: "Sandbox" },
  { value: "production", label: "Production" },
];

export function KycProviderCredentialModal({
  isOpen,
  onClose,
  editing,
}: KycProviderCredentialModalProps) {
  const [upsert, { loading }] = useKycUpsertProviderKey();
  const [showSecrets, setShowSecrets] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!editing;

  /** Update a field and clear any inline error sitting on it. */
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Reset form when modal opens / mode changes. Never echoes existing secret
  // values back — all secret fields start empty in edit mode (empty = "keep").
  useEffect(() => {
    if (!isOpen) return;
    setShowSecrets(false);
    setErrors({});
    if (editing) {
      setForm({
        provider: editing.provider,
        apiKey: "",
        apiSecret: "",
        webhookSecret: "",
        region: editing.region ?? "EU",
        redirectUri: editing.redirectUri ?? "",
        environment: editing.environment ?? "sandbox",
        baseUrl: editing.baseUrl ?? SUMSUB_DEFAULT_BASE_URL,
        levelName: editing.levelName ?? SUMSUB_DEFAULT_LEVEL_NAME,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, editing]);

  const fieldConfig = PROVIDER_FIELD_CONFIG[form.provider];

  // When the provider changes (add mode only), reset config fields to that
  // provider's sensible defaults.
  const handleProviderChange = (provider: KycProviderType) => {
    setErrors({});
    setForm((prev) => ({
      ...prev,
      provider,
      region: provider === "ONFIDO" ? prev.region || "EU" : prev.region,
      environment:
        provider === "ITSME" ? prev.environment || "sandbox" : prev.environment,
      baseUrl:
        provider === "SUMSUB"
          ? prev.baseUrl || SUMSUB_DEFAULT_BASE_URL
          : prev.baseUrl,
      levelName:
        provider === "SUMSUB"
          ? prev.levelName || SUMSUB_DEFAULT_LEVEL_NAME
          : prev.levelName,
    }));
  };

  /** Build the non-secret config JSON string for the active provider. */
  const buildConfigJson = (): string => {
    switch (form.provider) {
      case "ONFIDO":
        return JSON.stringify({ region: form.region });
      case "ITSME":
        return JSON.stringify({
          redirectUri: form.redirectUri.trim(),
          environment: form.environment,
        });
      case "SUMSUB":
        return JSON.stringify({
          baseUrl: form.baseUrl.trim() || SUMSUB_DEFAULT_BASE_URL,
          levelName: form.levelName.trim() || SUMSUB_DEFAULT_LEVEL_NAME,
        });
      default:
        return "{}";
    }
  };

  const handleSubmit = async () => {
    // Validation: on add, require apiKey (+ apiSecret for itsme/sumsub).
    // On edit, empty secret = keep existing. Plus URL checks on config fields.
    const next: Record<string, string> = {};
    if (!isEdit) {
      if (!form.apiKey.trim()) next.apiKey = `${fieldConfig.apiKeyLabel} is required`;
      if (fieldConfig.showApiSecret && !form.apiSecret.trim())
        next.apiSecret = `${fieldConfig.apiSecretLabel} is required`;
    }
    if (form.provider === "ITSME" && form.redirectUri.trim() && !httpUrl.safeParse(form.redirectUri.trim()).success) {
      next.redirectUri = "Enter a valid URL (https://…)";
    }
    if (form.provider === "SUMSUB" && form.baseUrl.trim() && !httpUrl.safeParse(form.baseUrl.trim()).success) {
      next.baseUrl = "Enter a valid URL (https://…)";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const configJson = buildConfigJson();

    try {
      await upsert({
        variables: {
          input: {
            provider: form.provider,
            // Empty string secrets are dropped → "keep existing" on the server.
            apiKey: form.apiKey.trim() || undefined,
            apiSecret: fieldConfig.showApiSecret
              ? form.apiSecret.trim() || undefined
              : undefined,
            webhookSecret: fieldConfig.showWebhookSecret
              ? form.webhookSecret.trim() || undefined
              : undefined,
            configJson,
          },
        },
      });
      // Clear secrets from local state before unmounting.
      setForm((prev) => ({
        ...prev,
        apiKey: "",
        apiSecret: "",
        webhookSecret: "",
      }));
      const label =
        PROVIDER_OPTIONS.find((o) => o.value === form.provider)?.label ??
        form.provider;
      toast({
        title: isEdit ? "Provider key updated" : "Provider key added",
        description: `${label} saved.`,
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
            {isEdit ? "Edit KYC Provider Key" : "Add KYC Provider Key"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the config, or paste a new secret to rotate it. Leave secret fields blank to keep the existing ones."
              : "Store a KYC provider's API credentials. Secrets are encrypted at rest and never echoed back."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Provider */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={form.provider}
              onValueChange={(v) => handleProviderChange(v as KycProviderType)}
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

          {/* Show secrets toggle */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowSecrets((s) => !s)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              {showSecrets ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              {showSecrets ? "Hide secrets" : "Show secrets"}
            </button>
          </div>

          {/* API key / identifier */}
          <div className="space-y-2">
            <Label htmlFor="kyc-api-key">
              {fieldConfig.apiKeyLabel}{" "}
              {isEdit && (
                <span className="text-muted-foreground font-normal">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="kyc-api-key"
              type={showSecrets ? "text" : "password"}
              placeholder={
                isEdit ? "Paste new value to rotate" : fieldConfig.apiKeyPlaceholder
              }
              value={form.apiKey}
              onChange={(e) => setField("apiKey", e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
              className="bg-secondary border-border"
              aria-invalid={!!errors.apiKey}
            />
            <FieldError message={errors.apiKey} />
            {form.provider === "ITSME" && (
              <p className="text-xs text-muted-foreground">
                The itsme <span className="font-medium">Client ID</span> goes
                here; the <span className="font-medium">Client Secret</span> goes
                in the secret field below.
              </p>
            )}
          </div>

          {/* API secret (itsme / Sumsub) */}
          {fieldConfig.showApiSecret && (
            <div className="space-y-2">
              <Label htmlFor="kyc-api-secret">
                {fieldConfig.apiSecretLabel}{" "}
                {isEdit && (
                  <span className="text-muted-foreground font-normal">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="kyc-api-secret"
                type={showSecrets ? "text" : "password"}
                placeholder={
                  isEdit
                    ? "Paste new value to rotate"
                    : fieldConfig.apiSecretPlaceholder
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

          {/* Webhook secret (Onfido) */}
          {fieldConfig.showWebhookSecret && (
            <div className="space-y-2">
              <Label htmlFor="kyc-webhook">
                {fieldConfig.webhookLabel}{" "}
                {isEdit && (
                  <span className="text-muted-foreground font-normal">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="kyc-webhook"
                type={showSecrets ? "text" : "password"}
                placeholder={
                  isEdit
                    ? "Paste new value to rotate"
                    : fieldConfig.webhookPlaceholder
                }
                value={form.webhookSecret}
                onChange={(e) => setField("webhookSecret", e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={loading}
                className="bg-secondary border-border"
              />
            </div>
          )}

          {/* ── Provider-specific non-secret config ───────────────────────── */}

          {/* Onfido: region */}
          {form.provider === "ONFIDO" && (
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={form.region}
                onValueChange={(v) => setForm((p) => ({ ...p, region: v }))}
                disabled={loading}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {ONFIDO_REGION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Onfido data residency region.
              </p>
            </div>
          )}

          {/* itsme: redirectUri + environment */}
          {form.provider === "ITSME" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="kyc-redirect">Redirect URI</Label>
                <Input
                  id="kyc-redirect"
                  placeholder="https://app.diaspoplug.com/kyc/itsme/callback"
                  value={form.redirectUri}
                  onChange={(e) => setField("redirectUri", e.target.value)}
                  disabled={loading}
                  className="bg-secondary border-border"
                  aria-invalid={!!errors.redirectUri}
                />
                <FieldError message={errors.redirectUri} />
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={form.environment}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, environment: v }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {ITSME_ENVIRONMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Sumsub: baseUrl + levelName */}
          {form.provider === "SUMSUB" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="kyc-base-url">Base URL</Label>
                <Input
                  id="kyc-base-url"
                  placeholder={SUMSUB_DEFAULT_BASE_URL}
                  value={form.baseUrl}
                  onChange={(e) => setField("baseUrl", e.target.value)}
                  disabled={loading}
                  className="bg-secondary border-border"
                  aria-invalid={!!errors.baseUrl}
                />
                <FieldError message={errors.baseUrl} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kyc-level">Level Name</Label>
                <Input
                  id="kyc-level"
                  placeholder={SUMSUB_DEFAULT_LEVEL_NAME}
                  value={form.levelName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, levelName: e.target.value }))
                  }
                  disabled={loading}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  The Sumsub verification level applicants are routed through.
                </p>
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Secrets are encrypted at rest. They are never logged or echoed back
            over the wire.
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
