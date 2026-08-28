import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/ui/StatusBadge";

/**
 * How an account was created, as reported by the gateway's admin `getUsers`
 * query (auth-service `users.registration_method`).
 *
 * This is the SIGNUP FLOW, stamped once at registration — it is not the set of
 * OAuth providers linked to the account today. A user who signed up with a
 * password and later connected Google still reads PASSWORD, which is the
 * question support is actually asking ("how did this person get in?").
 *
 * `null` is a real, distinct case — the gateway is degraded, the caller is not
 * a platform admin, or auth-service predates the column — and renders as
 * "unknown" rather than being collapsed into "Email & password".
 */
export type RegistrationMethod = "PASSWORD" | "GOOGLE" | "FACEBOOK" | "TWITTER" | null;

const KNOWN_REGISTRATION_METHODS = ["PASSWORD", "GOOGLE", "FACEBOOK", "TWITTER"] as const;

export function normalizeRegistrationMethod(raw: string | null | undefined): RegistrationMethod {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  return (KNOWN_REGISTRATION_METHODS as readonly string[]).includes(upper)
    ? (upper as RegistrationMethod)
    : null;
}

/**
 * Signup-method pill for the users table.
 *
 * Deliberately one neutral colour for every known method: the column reports a
 * fact, not a health state, and colouring OAuth differently from a password
 * would read as an alert nobody needs to act on.
 */
export function RegistrationMethodBadge({ method }: { method: RegistrationMethod }) {
  const { t } = useTranslation();
  const label = method
    ? t(`users.registrationMethod.${method}`)
    : t("users.registrationMethod.unknown");
  return (
    <div title={method ? undefined : t("users.registrationMethod.unknownHint")}>
      <StatusBadge variant={method ? "info" : "inactive"}>{label}</StatusBadge>
    </div>
  );
}
