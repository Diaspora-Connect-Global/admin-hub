import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/ui/StatusBadge";

/**
 * Status pills shared by the circle list, the circle detail header and the
 * subscriptions table, so those three surfaces can never disagree about what a
 * state looks like.
 *
 * An unrecognised value renders neutrally with the raw string as the label —
 * circle-service can add a lifecycle state before this console knows about it,
 * and inventing a colour for it would be a claim we cannot back.
 */

export type StatusBadgeVariant =
  | "active"
  | "warning"
  | "inactive"
  | "error"
  | "pending"
  | "info";

/**
 * `CircleStatus`. DORMANT is not a fault — it means fewer than two active
 * members, and it reactivates on the next join — so it stays neutral rather
 * than warning. SUSPENDED / DISSOLVED are platform moderation outcomes.
 */
export const CIRCLE_STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  ACTIVE: "active",
  DORMANT: "inactive",
  SUSPENDED: "warning",
  ARCHIVED: "inactive",
  DISSOLVED: "error",
};

export function CircleStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const known = status in CIRCLE_STATUS_VARIANT;
  return (
    <StatusBadge variant={known ? CIRCLE_STATUS_VARIANT[status] : "inactive"}>
      {known ? t(`circles.status.${status}`) : status}
    </StatusBadge>
  );
}

/**
 * `CircleSubscriptionStatus` — note the SUBSCRIPTION_ prefix is part of the
 * schema enum value, not decoration.
 */
export const SUBSCRIPTION_STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  SUBSCRIPTION_ACTIVE: "active",
  SUBSCRIPTION_PAST_DUE: "warning",
  SUBSCRIPTION_CANCELLED: "inactive",
  SUBSCRIPTION_EXPIRED: "error",
};

export function CircleSubscriptionStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const known = status in SUBSCRIPTION_STATUS_VARIANT;
  return (
    <StatusBadge variant={known ? SUBSCRIPTION_STATUS_VARIANT[status] : "inactive"}>
      {known ? t(`circles.subscriptionStatus.${status}`) : status}
    </StatusBadge>
  );
}
