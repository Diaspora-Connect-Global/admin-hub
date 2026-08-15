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
 * label → variant for every content/transaction state this console renders.
 *
 * The title-case keys are the display strings the older tabs pass straight
 * through. The SCREAMING_CASE keys are backend enums that arrive unmapped —
 * post-feed-service's five post statuses, which the admin `getUserPosts` view
 * now returns in full (it used to be silently narrowed to public+PUBLISHED, so
 * DRAFT / HIDDEN / FLAGGED / REMOVED had never reached this map before).
 */
export const CONTENT_STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  Active: "active",
  Inactive: "warning",
  Suspended: "error",
  Published: "active",
  Applied: "info",
  Completed: "active",
  Held: "warning",
  Pending: "pending",
  Accepted: "active",
  // post-feed-service PostStatusType
  PUBLISHED: "active",
  DRAFT: "inactive",
  HIDDEN: "warning",
  FLAGGED: "pending",
  REMOVED: "error",
};

/**
 * Generic content/transaction status pill (post published, order completed …).
 * Unknown labels fall back to the neutral variant rather than guessing.
 *
 * `label` overrides the rendered text without changing the variant lookup, so a
 * caller with a translation for a backend enum can show "Draft" while the map
 * still keys on `DRAFT`.
 */
export function ContentStatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <StatusBadge variant={CONTENT_STATUS_VARIANT[status] ?? "inactive"}>
      {label ?? status}
    </StatusBadge>
  );
}

/**
 * post-feed-service `VisibilityType`. `PUBLIC` is an accepted alias of
 * `EVERYONE` on the backend, so it is normalised to it here too.
 */
export const POST_VISIBILITIES = [
  "EVERYONE",
  "FRIENDS",
  "ONLY_ME",
  "COMMUNITY",
  "ASSOCIATION",
] as const;
export type PostVisibility = (typeof POST_VISIBILITIES)[number];

/**
 * Colour by how far the post travels: public is informational, the restricted
 * ones escalate. `ONLY_ME` gets the destructive variant deliberately — it is
 * the post an admin most needs to notice they are looking at.
 */
export const POST_VISIBILITY_VARIANT: Record<PostVisibility, StatusBadgeVariant> = {
  EVERYONE: "info",
  COMMUNITY: "inactive",
  ASSOCIATION: "inactive",
  FRIENDS: "warning",
  ONLY_ME: "error",
};

export function normalizePostVisibility(raw: string | null | undefined): PostVisibility | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "PUBLIC") return "EVERYONE";
  return (POST_VISIBILITIES as readonly string[]).includes(upper) ? (upper as PostVisibility) : null;
}

/**
 * Who could see a post.
 *
 * An unreported visibility renders as a neutral "Unknown" pill with a tooltip,
 * exactly like `AccountStatusBadge` does — NOT as "Public". The admin post list
 * returns posts at every visibility but does not yet say which, and on a
 * moderation screen "we were not told" and "anyone can see this" are opposite
 * facts. Guessing the permissive one is the dangerous direction to guess in.
 */
export function PostVisibilityBadge({ visibility }: { visibility: string | null | undefined }) {
  const { t } = useTranslation();
  const value = normalizePostVisibility(visibility);
  return (
    <StatusBadge
      variant={value ? POST_VISIBILITY_VARIANT[value] : "inactive"}
      title={value ? undefined : t("users.detail.posts.visibilityUnknownHint")}
    >
      {value
        ? t(`users.detail.posts.visibility.${value}`)
        : t("users.detail.posts.visibilityUnknown")}
    </StatusBadge>
  );
}
