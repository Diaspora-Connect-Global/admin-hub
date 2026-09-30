import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/common/FieldError";
import { useToast } from "@/hooks/use-toast";
import { throwIfGraphQLErrors, friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminPrivateReplySettings,
  useUpdatePrivateReplySettings,
  type PrivateReplyMemberManagement,
} from "@/hooks/admin";

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 50;

const MEMBER_MANAGEMENT_OPTIONS: Array<{
  value: PrivateReplyMemberManagement;
  label: string;
}> = [
  { value: "NOBODY", label: "No one — who is in it is fixed once it starts" },
  { value: "STARTER", label: "The person who started it" },
  { value: "GROUP_ADMINS", label: "Group admins (owner and admins of the group)" },
];

/** Parses a trimmed whole number, or null when the text isn't one (no decimals, no signs, no leading/trailing junk). */
function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

function validateMaxMembers(value: string): string | undefined {
  const n = parseWholeNumber(value);
  if (n === null) return `Enter a whole number between ${MIN_MEMBERS} and ${MAX_MEMBERS}.`;
  if (n < MIN_MEMBERS || n > MAX_MEMBERS) {
    return `Must be between ${MIN_MEMBERS} and ${MAX_MEMBERS}.`;
  }
  return undefined;
}

/**
 * Platform-wide rules for private replies inside group chats — a private
 * conversation started inside a group chat, visible only to the people in it.
 * System-admin only (route-gated by RequireSystemAdmin at the page level).
 */
export function PrivateReplySettingsCard() {
  const { toast } = useToast();
  const { data, loading, error } = useAdminPrivateReplySettings();
  const [updateSettings, { loading: saving }] = useUpdatePrivateReplySettings();

  const settings = data?.adminPrivateReplySettings;

  const [maxMembersInput, setMaxMembersInput] = useState("");
  const [memberManagement, setMemberManagement] = useState<PrivateReplyMemberManagement>("STARTER");
  const [newMembersSeeHistory, setNewMembersSeeHistory] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Snapshot of the last-loaded/-saved values, used to tell whether the form is dirty.
  const [loaded, setLoaded] = useState<{
    maxMembers: string;
    memberManagement: PrivateReplyMemberManagement;
    newMembersSeeHistory: boolean;
  } | null>(null);

  useEffect(() => {
    if (!settings) return;
    const next = {
      maxMembers: String(settings.maxMembers),
      memberManagement: settings.memberManagement,
      newMembersSeeHistory: settings.newMembersSeeHistory,
    };
    setMaxMembersInput(next.maxMembers);
    setMemberManagement(next.memberManagement);
    setNewMembersSeeHistory(next.newMembersSeeHistory);
    setLoaded(next);
  }, [settings]);

  const maxMembersError = validateMaxMembers(maxMembersInput);
  // Don't flash a validation error before the first load has populated the field.
  const showMaxMembersError = !!loaded && !!maxMembersError;

  const isDirty =
    !!loaded &&
    (loaded.maxMembers !== maxMembersInput.trim() ||
      loaded.memberManagement !== memberManagement ||
      loaded.newMembersSeeHistory !== newMembersSeeHistory);

  const canSave = !maxMembersError && isDirty && !saving && !loading;

  const maxMembersDescribedBy = [
    "prr-max-members-help",
    showMaxMembersError ? "prr-max-members-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const handleSave = async () => {
    if (!canSave) return;
    const parsed = parseWholeNumber(maxMembersInput);
    if (parsed === null) return;

    setSaveError(null);
    try {
      const result = await updateSettings({
        variables: {
          input: {
            maxMembers: parsed,
            memberManagement,
            newMembersSeeHistory,
          },
        },
      });
      // KNOWN TRAP: errorPolicy 'all' resolves refused mutations with data:null
      // plus `errors` — never toast success without checking both.
      throwIfGraphQLErrors(result, "UpdatePrivateReplySettings");
      if (!result.data?.updatePrivateReplySettings) {
        throw new Error("The server did not return the updated settings.");
      }
      toast({ title: "Saved", description: "Private reply settings have been updated." });
    } catch (err) {
      const message = friendlyErrorMessage(
        err,
        "Could not save private reply settings. Please try again.",
      );
      setSaveError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Private Replies
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        <CardDescription>
          Platform-wide rules for private replies inside group chats — a conversation
          started inside a group chat that stays visible only to the people in it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Could not load private reply settings. {friendlyErrorMessage(error)}
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {/* Maximum people */}
        <div className="space-y-2">
          <Label htmlFor="prr-max-members">Maximum people in a private conversation</Label>
          <Input
            id="prr-max-members"
            type="number"
            inputMode="numeric"
            min={MIN_MEMBERS}
            max={MAX_MEMBERS}
            step={1}
            value={maxMembersInput}
            onChange={(e) => setMaxMembersInput(e.target.value)}
            disabled={loading || saving}
            aria-invalid={showMaxMembersError}
            aria-describedby={maxMembersDescribedBy}
            className="max-w-[160px]"
          />
          <p id="prr-max-members-help" className="text-xs text-muted-foreground">
            Includes the person who started it. Lowering this never removes anyone; a
            conversation already over the limit just can&apos;t add more people.
          </p>
          {showMaxMembersError && (
            <div id="prr-max-members-error" role="alert">
              <FieldError message={maxMembersError} />
            </div>
          )}
        </div>

        {/* Who can add/remove people */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none mb-2">
            Who can add and remove people after it starts
          </legend>
          <RadioGroup
            value={memberManagement}
            onValueChange={(v) => setMemberManagement(v as PrivateReplyMemberManagement)}
            disabled={loading || saving}
          >
            {MEMBER_MANAGEMENT_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`prr-mm-${opt.value}`} />
                <Label htmlFor={`prr-mm-${opt.value}`} className="font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Anyone can always leave. Group admins never see what&apos;s said — in &quot;Group
            admins&quot; mode they can see who is in each private conversation so they can
            manage it, and they can&apos;t add themselves.
          </p>
        </fieldset>

        {/* New members see history */}
        <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="prr-see-history">People added later can see earlier messages</Label>
            <p className="text-xs text-muted-foreground">
              Locked in for each person when they&apos;re added. Changing this never changes
              what people already added can see.
            </p>
          </div>
          <Switch
            id="prr-see-history"
            checked={newMembersSeeHistory}
            onCheckedChange={setNewMembersSeeHistory}
            disabled={loading || saving}
          />
        </div>

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
