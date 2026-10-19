import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Mail, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/common/FieldError";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminOtpSettings,
  useUpdateOtpSettings,
  type OtpChannelMode,
  type UpdateOtpSettingsInput,
} from "@/hooks/admin";
import { ISO2_TO_COUNTRY_LABEL } from "@/lib/countriesServedIso";
import { CountryMultiSelect } from "./CountryMultiSelect";

// A static ISO alpha-2 universe (already maintained for the Communities admin
// UI) — localized display names come from Intl.DisplayNames per the current
// admin locale, so this list only needs to supply the codes, not English names.
const ALL_COUNTRY_CODES = Object.keys(ISO2_TO_COUNTRY_LABEL);

type ChannelDraft = { mode: OtpChannelMode; countries: string[] };

function samePolicy(a: ChannelDraft, b: ChannelDraft): boolean {
  if (a.mode !== b.mode) return false;
  if (a.mode !== "LIST") return true;
  const sa = [...a.countries].sort();
  const sb = [...b.countries].sort();
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

/** LIST with zero countries can't be saved — it wouldn't allow anyone. */
function policyValid(p: ChannelDraft): boolean {
  return p.mode !== "LIST" || p.countries.length > 0;
}

const MODE_OPTIONS: Array<{ value: OtpChannelMode; label: string }> = [
  { value: "ALL", label: "All countries" },
  { value: "NONE", label: "No countries" },
  { value: "LIST", label: "Only these countries" },
];

function ChannelSection({
  idPrefix,
  title,
  helpText,
  draft,
  onChange,
  sortedCodes,
  countryNames,
  disabled,
}: {
  idPrefix: string;
  title: string;
  helpText: string;
  draft: ChannelDraft;
  onChange: (next: ChannelDraft) => void;
  sortedCodes: string[];
  countryNames: Map<string, string>;
  disabled: boolean;
}) {
  const showListError = draft.mode === "LIST" && draft.countries.length === 0;
  const errorId = `${idPrefix}-list-error`;

  return (
    <fieldset className="space-y-3 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <p className="text-xs text-muted-foreground">{helpText}</p>

      <RadioGroup
        value={draft.mode}
        onValueChange={(v) => onChange({ ...draft, mode: v as OtpChannelMode })}
        disabled={disabled}
      >
        {MODE_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`${idPrefix}-mode-${opt.value}`} />
            <Label htmlFor={`${idPrefix}-mode-${opt.value}`} className="font-normal">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {draft.mode === "LIST" && (
        <div className="pl-1">
          <CountryMultiSelect
            idPrefix={`${idPrefix}-countries`}
            label={`Countries for ${title}`}
            sortedCodes={sortedCodes}
            countryNames={countryNames}
            selected={draft.countries}
            onChange={(countries) => onChange({ ...draft, countries })}
            disabled={disabled}
            describedById={showListError ? errorId : undefined}
          />
          {showListError && (
            <div id={errorId} role="alert" className="mt-1">
              <FieldError message="Select at least one country, or choose a different option." />
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
}

/**
 * OTP delivery policy. Email is ALWAYS on for every country (owner decision,
 * 2026-10-18; auth-service refuses any other email mode), so it is shown as a
 * fixed fact, not a choice. Only the SMS policy is editable. System-admin only
 * (route-gated by RequireSystemAdmin at the page level).
 */
export function OtpDeliverySettingsCard() {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const { data, loading, error } = useAdminOtpSettings();
  const [updateOtpSettings, { loading: saving }] = useUpdateOtpSettings();

  const settings = data?.adminOtpSettings;

  const [sms, setSms] = useState<ChannelDraft>({ mode: "NONE", countries: [] });
  const [saveError, setSaveError] = useState<string | null>(null);

  // Snapshot of the last-loaded/-saved values, used to tell whether the form is dirty.
  const [loaded, setLoaded] = useState<ChannelDraft | null>(null);

  // Guards the sync-from-server effect below against clobbering an in-progress
  // edit: `data` (and therefore `settings`) isn't guaranteed to keep the same
  // object identity across every re-render, so an effect keyed on `[settings]`
  // alone can re-fire — and silently discard whatever the admin just picked —
  // on a render that has nothing to do with a real settings change (e.g. the
  // very re-render its own onChange just caused). Once the admin has touched
  // the form, only an explicit reload (or a completed save, which resets this)
  // is allowed to overwrite their draft.
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!settings || dirtyRef.current) return;
    const next = { mode: settings.sms.mode, countries: settings.sms.countries };
    setSms(next);
    setLoaded(next);
  }, [settings]);

  const updateSms = (next: ChannelDraft) => {
    dirtyRef.current = true;
    setSms(next);
  };

  // Localized country names + a stable display order, computed once per admin
  // locale (avoids rebuilding Intl.DisplayNames / re-sorting the ~195-country
  // list on every render).
  const countryNames = useMemo(() => {
    const map = new Map<string, string>();
    let displayNames: Intl.DisplayNames | null = null;
    try {
      displayNames = new Intl.DisplayNames([i18n.language], { type: "region" });
    } catch {
      displayNames = null;
    }
    for (const code of ALL_COUNTRY_CODES) {
      const resolved = displayNames?.of(code);
      map.set(code, resolved && resolved !== code ? resolved : ISO2_TO_COUNTRY_LABEL[code] ?? code);
    }
    return map;
  }, [i18n.language]);

  const sortedCodes = useMemo(
    () =>
      [...ALL_COUNTRY_CODES].sort((a, b) =>
        (countryNames.get(a) ?? a).localeCompare(countryNames.get(b) ?? b),
      ),
    [countryNames],
  );

  const smsValid = policyValid(sms);

  const isDirty = !!loaded && !samePolicy(loaded, sms);
  const canSave = !!loaded && isDirty && smsValid && !saving && !loading;

  const handleSave = async () => {
    if (!canSave) return;
    setSaveError(null);

    const input: UpdateOtpSettingsInput = {
      // Email is always on everywhere; the server refuses anything else.
      email: { mode: "ALL", countries: [] },
      sms: { mode: sms.mode, countries: sms.mode === "LIST" ? sms.countries : [] },
    };

    try {
      const result = await updateOtpSettings({ variables: { input } });

      // KNOWN TRAP: Apollo Client v4 with errorPolicy 'all' resolves a refused
      // mutation with `{ data: null, error }` — a CombinedGraphQLErrors on
      // `result.error` — NOT a v3-style `result.errors` array. A check that
      // only looks at `.errors` never fires under v4 and a refusal renders as
      // a false success. Check `.error` first, `.errors` as a fallback, and
      // require the settings to actually be present before toasting success.
      const gqlError = (result as { error?: { message?: string } }).error;
      if (gqlError) {
        throw new Error(gqlError.message ?? "Failed to update OTP delivery settings.");
      }
      const legacyErrors = (result as { errors?: ReadonlyArray<{ message?: string }> }).errors;
      if (legacyErrors?.length) {
        throw new Error(legacyErrors.map((e) => e.message ?? "Unknown error").join("; "));
      }
      if (!result.data?.updateOtpSettings) {
        throw new Error("The server did not return the updated settings.");
      }

      // The just-saved draft is now the source of truth on the server too —
      // let the next settings sync (from refetchQueries) update `loaded` again
      // instead of permanently locking the form to "always dirty until reload".
      dirtyRef.current = false;
      toast({ title: "Saved", description: "OTP delivery settings have been updated." });
    } catch (err) {
      const message = friendlyErrorMessage(
        err,
        "Could not save OTP delivery settings. Please try again.",
      );
      setSaveError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          OTP Delivery
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        <CardDescription>
          Verification codes always go by email, in every country. Choose which countries also
          get them by SMS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Could not load OTP delivery settings. {friendlyErrorMessage(error)}
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <fieldset className="space-y-1 rounded-md border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Email codes</legend>
          <p className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Always on, in all countries
          </p>
          <p className="text-xs text-muted-foreground">
            Every code is sent to the email address people sign up with, so nobody is locked out.
            This can&apos;t be turned off.
          </p>
        </fieldset>

        <ChannelSection
          idPrefix="otp-sms"
          title="SMS codes"
          helpText="An SMS copy of the code goes only to phone numbers from the countries you allow (people without a phone number get email only). SMS delivery depends on the SMS provider's country permissions."
          draft={sms}
          onChange={updateSms}
          sortedCodes={sortedCodes}
          countryNames={countryNames}
          disabled={loading || saving}
        />

        {settings?.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Last changed {new Date(settings.updatedAt).toLocaleString()}
            {settings.updatedByName ? ` by ${settings.updatedByName}` : ""}
          </p>
        )}

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={!canSave} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
