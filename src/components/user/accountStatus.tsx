import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/ui/StatusBadge";

/**
 * Account status as reported by the gateway.
 *
 * `null` is a real, distinct case — the gateway is degraded, predates the
 * enforcement rpcs, or (on the user-detail page) the status was never fetched —
 * and must render as "unknown". Rendering it as ACTIVE would assert a state we
 * were never told, on the screens where an admin decides whether someone is
 * already suspended.
 */
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | null;

const KNOWN_ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED", "BANNED"] as const;

export function normalizeAccountStatus(raw: string | null | undefined): AccountStatus {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  return (KNOWN_ACCOUNT_STATUSES as readonly string[]).includes(upper)
    ? (upper as AccountStatus)
    : null;
}

/** The three enforcement fields that always travel together. */
export interface AccountStatusInfo {
  accountStatus: AccountStatus;
  statusReason: string | null;
  /** ISO date the suspension lapses; null for an indefinite suspension. */
  suspendedUntil: string | null;
}

export type StatusBadgeVariant = "active" | "warning" | "inactive" | "error" | "pending" | "info";

/** Colour per account state. Unknown stays neutral — it is not a good state. */
export const ACCOUNT_STATUS_VARIANT: Record<"ACTIVE" | "SUSPENDED" | "BANNED", StatusBadgeVariant> = {
  ACTIVE: "active",
  SUSPENDED: "warning",
  BANNED: "error",
};

/**
 * Account-status pill, shared by the users table and the user-detail header so
 * the two surfaces can never disagree. An unknown status renders as a neutral
 * "Unknown" pill with a tooltip explaining why — never as "Active", which would
 * be a claim the gateway never made.
 */
export function AccountStatusBadge({
  accountStatus,
  statusReason,
  suspendedUntil,
}: AccountStatusInfo) {
  const { t } = useTranslation();
  const label = accountStatus
    ? t(`users.accountStatus.${accountStatus}`)
    : t("users.accountStatus.unknown");
  const variant = accountStatus ? ACCOUNT_STATUS_VARIANT[accountStatus] : "inactive";
  const expiry = suspendedUntil ? new Date(suspendedUntil) : null;
  const expiryValid = expiry && !Number.isNaN(expiry.getTime());
  return (
    <div
      className="flex flex-col items-start gap-1"
      title={
        accountStatus
          ? statusReason
            ? t("users.accountStatus.reason", { reason: statusReason })
            : undefined
          : t("users.accountStatus.unknownHint")
      }
    >
      <StatusBadge variant={variant}>{label}</StatusBadge>
      {expiryValid && (
        <span className="text-xs text-muted-foreground">
          {t("users.accountStatus.until", { date: expiry.toLocaleDateString() })}
        </span>
      )}
    </div>
  );
}

/**
 * Generic content/transaction status pill (post published, order completed …).
 * Unknown labels fall back to the neutral variant rather than guessing.
 */
export function ContentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, StatusBadgeVariant> = {
    Active: "active",
    Inactive: "warning",
    Suspended: "error",
    Published: "active",
    Applied: "info",
    Completed: "active",
    Held: "warning",
    Pending: "pending",
    Accepted: "active",
  };
  return <StatusBadge variant={variants[status] ?? "inactive"}>{status}</StatusBadge>;
}
