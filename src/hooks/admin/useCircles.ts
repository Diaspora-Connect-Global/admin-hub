import { useMutation, useQuery } from "@apollo/client/react";
import {
  ADMIN_LIST_CIRCLES,
  ADMIN_GET_CIRCLE,
  ADMIN_SUSPEND_CIRCLE,
  ADMIN_UNSUSPEND_CIRCLE,
  ADMIN_DISSOLVE_CIRCLE,
  ADMIN_LIST_CIRCLE_SUBSCRIPTIONS,
  ADMIN_GET_CIRCLE_SUBSCRIPTION,
  ADMIN_GRANT_CIRCLE_SUBSCRIPTION,
  ADMIN_FORCE_EXPIRE_CIRCLE_SUBSCRIPTION,
  ADMIN_CIRCLE_AUDIT_TRAIL,
  type AdminCircle,
  type AdminCircleSubscription,
  type AdminCircleAuditTrailPage,
  type GrantCircleSubscriptionInput,
} from "@/services/networks/graphql/admin";

export type {
  AdminCircle,
  AdminCircleSubscription,
  AdminCircleAuditTrailPage,
  GrantCircleSubscriptionInput,
};

/**
 * Circle lifecycle, in the BARE domain spelling circle-service stores and
 * emits. The proto prefixes some sibling enums (`MEMBERSHIP_ACTIVE`,
 * `SUBSCRIPTION_ACTIVE`) but `CircleStatus` is bare on both sides.
 *
 * DORMANT is not a fault: it means fewer than two active members. Reads still
 * work, motions cannot open, and it reactivates on the next join. A circle is
 * never deleted for being small.
 */
export const CIRCLE_STATUSES = [
  "ACTIVE",
  "DORMANT",
  "SUSPENDED",
  "ARCHIVED",
  "DISSOLVED",
] as const;

/**
 * Subscription lifecycle as it arrives on `CircleSubscription.status` — bare,
 * NOT the proto's `SUBSCRIPTION_ACTIVE`. Used for client-side filtering and
 * badge colouring; see `useAdminCircleSubscriptions` for why it is not a
 * server-side filter.
 */
export const CIRCLE_SUBSCRIPTION_STATUSES = [
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
] as const;

/** How someone gets into a circle. Independent of `discoverable`. */
export const CIRCLE_JOIN_MODES = ["INVITE_ONLY", "REQUEST"] as const;

/**
 * The platform-wide circle index.
 *
 * `adminCircles` is the ONLY read that sees suspended and non-discoverable
 * circles — the user-facing `searchCircles` runs against partial indexes
 * restricted to `status='ACTIVE'` and `discoverable=true`. Wiring an oversight
 * console to that one would show nothing for precisely the circles it exists to
 * find, and it would look like an empty result rather than an error.
 *
 * Empty filter fields are stripped rather than sent as "" so the Apollo cache
 * key stops churning on every keystroke.
 *
 * No `errorPolicy: "all"` on purpose — an empty list and a failed query are
 * different facts, and an oversight queue that renders a backend outage as "no
 * circles" is worse than one that shows an error.
 */
export function useAdminCircles(filter: {
  status?: string;
  query?: string;
  limit?: number;
  offset?: number;
}) {
  const cleaned = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return useQuery<{ adminCircles: AdminCircle[] }>(ADMIN_LIST_CIRCLES, {
    variables: cleaned,
    fetchPolicy: "cache-and-network",
  });
}

/** One circle, including suspended/dissolved ones. */
export function useAdminCircle(circleId: string | null | undefined) {
  return useQuery<{ adminCircle: AdminCircle | null }>(ADMIN_GET_CIRCLE, {
    variables: { circleId: circleId ?? "" },
    skip: !circleId,
    fetchPolicy: "cache-and-network",
  });
}

/**
 * ACTIVE/DORMANT -> SUSPENDED. `reason` is required by the schema AND by this
 * hook's callers: a platform act has no motion behind it, so the written reason
 * is the only record of why it happened.
 */
export function useAdminSuspendCircle() {
  return useMutation<{ adminSuspendCircle: AdminCircle }>(ADMIN_SUSPEND_CIRCLE);
}

/** SUSPENDED -> ACTIVE. Reason optional — nothing is being taken away. */
export function useAdminUnsuspendCircle() {
  return useMutation<{ adminUnsuspendCircle: AdminCircle }>(ADMIN_UNSUSPEND_CIRCLE);
}

/** Terminal. Irreversible from the console. `reason` required. */
export function useAdminDissolveCircle() {
  return useMutation<{ adminDissolveCircle: AdminCircle }>(ADMIN_DISSOLVE_CIRCLE);
}

/**
 * Subscriptions across every circle.
 *
 * DELIBERATELY SENDS NO `status`. The schema exposes
 * `status: CircleSubscriptionStatus`, whose values are the prefixed proto
 * spellings (`SUBSCRIPTION_ACTIVE`); the gateway forwards them verbatim and
 * circle-service compares them against the bare value in the column (`ACTIVE`),
 * so every value the schema accepts matches zero rows. Filter status on the
 * client instead — a control that silently returns nothing is worse than none.
 *
 * `planId` is safe: the backend resolves it to the plan's code before filtering,
 * and an unknown id yields an empty page rather than an unfiltered one.
 */
export function useAdminCircleSubscriptions(filter: {
  planId?: string;
  limit?: number;
  offset?: number;
}) {
  const cleaned = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return useQuery<{ adminCircleSubscriptions: AdminCircleSubscription[] }>(
    ADMIN_LIST_CIRCLE_SUBSCRIPTIONS,
    { variables: cleaned, fetchPolicy: "cache-and-network" },
  );
}

/** The single ACTIVE subscription for one circle. Every circle always has one. */
export function useAdminCircleSubscription(circleId: string | null | undefined) {
  return useQuery<{ adminCircleSubscription: AdminCircleSubscription | null }>(
    ADMIN_GET_CIRCLE_SUBSCRIPTION,
    {
      variables: { circleId: circleId ?? "" },
      skip: !circleId,
      fetchPolicy: "cache-and-network",
    },
  );
}

/**
 * Put a circle on a paid plan. The only route onto one in v1 — circles cannot
 * be charged yet, so a grant is how a paid tier is conferred.
 */
export function useAdminGrantCircleSubscription() {
  return useMutation<{ adminGrantCircleSubscription: AdminCircleSubscription }>(
    ADMIN_GRANT_CIRCLE_SUBSCRIPTION,
  );
}

/**
 * End a grant early. The circle drops back to the default free plan's caps;
 * existing members and projects are KEPT and only new ones are refused.
 */
export function useAdminForceExpireCircleSubscription() {
  return useMutation<{ adminForceExpireCircleSubscription: AdminCircleSubscription }>(
    ADMIN_FORCE_EXPIRE_CIRCLE_SUBSCRIPTION,
  );
}

/**
 * The circle's hash-chained audit trail — the one place oversight looks inside
 * a circle, and it is read-only.
 *
 * `skip` until a circle is chosen: `circleId` is non-nullable in the schema, so
 * firing early is a guaranteed error that paints the panel as broken.
 */
export function useAdminCircleAuditTrail(
  circleId: string | null | undefined,
  since?: string,
  options?: { skip?: boolean },
) {
  return useQuery<{ adminCircleAuditTrail: AdminCircleAuditTrailPage }>(
    ADMIN_CIRCLE_AUDIT_TRAIL,
    {
      variables: { circleId: circleId ?? "", since: since || undefined },
      skip: !circleId || options?.skip,
      fetchPolicy: "cache-and-network",
    },
  );
}

/*
 * NOT DECLARED HERE, AND NOT MISSING: there is no hook to open, vote on or
 * override a motion, and none to add or remove a circle member.
 * `CircleAdminService` has no rpc for any of it, deliberately — a circle
 * governs itself and the platform supplies neutral voting machinery. That
 * neutrality only holds for as long as the platform genuinely cannot decide who
 * belongs, so the absence is the feature. A SYSTEM_ADMIN token does not pass
 * the member/lead gates either: an admin can dissolve a circle without ever
 * being able to read its chat.
 */
