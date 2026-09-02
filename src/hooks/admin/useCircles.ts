/**
 * Circle super-admin hooks (circle-service, via the api-gateway circle module).
 *
 * Every operation here is one of the `admin*` fields on `circle-plan.resolver.ts`,
 * which are gated by `@Roles('SYSTEM_ADMIN','SUPER_ADMIN')`. The rest of the
 * circle surface is member/lead-scoped and is deliberately absent from this
 * console: a platform admin can curate the plan catalogue, grant or expire a
 * subscription, suspend/dissolve a circle for illegality, and read its audit
 * trail — and can NOT open or vote on a motion, or add or remove a member.
 *
 * UNITS: `amountMinor` is INTEGER minor units in both directions. Conversion
 * lives in `@/lib/money` and happens only at the UI boundary.
 *
 * FILTER ENUMS: send the schema values verbatim (`SUBSCRIPTION_ACTIVE`, not
 * `ACTIVE`). There is a known, not-yet-deployed gateway bug that forwards these
 * prefixed values to a service comparing against unprefixed domain values, so a
 * status-filtered list may come back empty. That fix is server-side.
 */

import { useQuery, useMutation } from "@apollo/client/react";
import {
  ADMIN_CIRCLE_PLANS,
  ADMIN_CIRCLES,
  ADMIN_CIRCLE,
  ADMIN_CIRCLE_SUBSCRIPTIONS,
  ADMIN_CIRCLE_SUBSCRIPTION,
  ADMIN_CIRCLE_AUDIT_TRAIL,
  ADMIN_CREATE_CIRCLE_PLAN,
  ADMIN_UPDATE_CIRCLE_PLAN,
  ADMIN_DEACTIVATE_CIRCLE_PLAN,
  ADMIN_SET_CIRCLE_PLAN_PRICE,
  ADMIN_SET_CIRCLE_PLAN_ENTITLEMENT,
  ADMIN_GRANT_CIRCLE_SUBSCRIPTION,
  ADMIN_FORCE_EXPIRE_CIRCLE_SUBSCRIPTION,
  ADMIN_SUSPEND_CIRCLE,
  ADMIN_UNSUSPEND_CIRCLE,
  ADMIN_DISSOLVE_CIRCLE,
  type Circle,
  type CircleAuditTrailPage,
  type CircleEntitlement,
  type CircleEntitlementKey,
  type CircleEntitlementValueKind,
  type CircleOwnerType,
  type CirclePlan,
  type CirclePlanPrice,
  type CirclePriceInterval,
  type CircleStatus,
  type CircleSubscription,
  type CircleSubscriptionStatus,
  type CreateCirclePlanInput,
  type UpdateCirclePlanInput,
  type SetCirclePlanPriceInput,
  type SetCirclePlanEntitlementInput,
  type GrantCircleSubscriptionInput,
} from "@/services/networks/graphql/admin";

export type {
  Circle,
  CircleAuditTrailPage,
  CircleEntitlement,
  CircleEntitlementKey,
  CircleEntitlementValueKind,
  CircleOwnerType,
  CirclePlan,
  CirclePlanPrice,
  CirclePriceInterval,
  CircleStatus,
  CircleSubscription,
  CircleSubscriptionStatus,
  CreateCirclePlanInput,
  UpdateCirclePlanInput,
  SetCirclePlanPriceInput,
  SetCirclePlanEntitlementInput,
  GrantCircleSubscriptionInput,
};

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * The full plan catalogue. `includeInactive` defaults to true here — the admin
 * catalogue is the one place deactivated tiers must stay visible, since circles
 * may still be sitting on them.
 */
export function useAdminCirclePlans(
  options: { ownerKind?: CircleOwnerType; includeInactive?: boolean } = {},
) {
  return useQuery<{ adminCirclePlans: CirclePlan[] }>(ADMIN_CIRCLE_PLANS, {
    variables: {
      ownerKind: options.ownerKind ?? undefined,
      includeInactive: options.includeInactive ?? true,
    },
    fetchPolicy: "cache-and-network",
  });
}

export interface AdminCirclesFilters {
  status?: CircleStatus;
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Circle oversight listing. Returns a bare array — the resolver exposes no
 * total, so pagination is "asked for `limit`, got `limit`" (see the pages).
 */
export function useAdminCircles(filters: AdminCirclesFilters = {}) {
  return useQuery<{ adminCircles: Circle[] }>(ADMIN_CIRCLES, {
    variables: {
      status: filters.status ?? undefined,
      query: filters.query?.trim() ? filters.query.trim() : undefined,
      limit: filters.limit ?? 25,
      offset: filters.offset ?? 0,
    },
    fetchPolicy: "cache-and-network",
  });
}

export function useAdminCircle(circleId: string | null) {
  return useQuery<{ adminCircle: Circle | null }>(ADMIN_CIRCLE, {
    variables: { circleId: circleId ?? "" },
    skip: !circleId,
    fetchPolicy: "cache-and-network",
  });
}

export interface AdminCircleSubscriptionsFilters {
  status?: CircleSubscriptionStatus;
  planId?: string;
  limit?: number;
  offset?: number;
}

export function useAdminCircleSubscriptions(
  filters: AdminCircleSubscriptionsFilters = {},
) {
  return useQuery<{ adminCircleSubscriptions: CircleSubscription[] }>(
    ADMIN_CIRCLE_SUBSCRIPTIONS,
    {
      variables: {
        status: filters.status ?? undefined,
        planId: filters.planId ?? undefined,
        limit: filters.limit ?? 25,
        offset: filters.offset ?? 0,
      },
      fetchPolicy: "cache-and-network",
    },
  );
}

export function useAdminCircleSubscription(circleId: string | null) {
  return useQuery<{ adminCircleSubscription: CircleSubscription | null }>(
    ADMIN_CIRCLE_SUBSCRIPTION,
    {
      variables: { circleId: circleId ?? "" },
      skip: !circleId,
      fetchPolicy: "cache-and-network",
    },
  );
}

/**
 * The circle's hash-chained audit trail. This is the ONE place platform
 * oversight looks inside a circle, and it is read-only by construction.
 */
export function useAdminCircleAuditTrail(
  circleId: string | null,
  options: { since?: string; skip?: boolean } = {},
) {
  return useQuery<{ adminCircleAuditTrail: CircleAuditTrailPage }>(
    ADMIN_CIRCLE_AUDIT_TRAIL,
    {
      variables: { circleId: circleId ?? "", since: options.since ?? undefined },
      skip: !circleId || options.skip,
      fetchPolicy: "cache-and-network",
    },
  );
}

// ── Plan catalogue mutations ─────────────────────────────────────────────────

export function useAdminCreateCirclePlan() {
  return useMutation<{ adminCreateCirclePlan: CirclePlan }, { input: CreateCirclePlanInput }>(
    ADMIN_CREATE_CIRCLE_PLAN,
    { refetchQueries: ["AdminCirclePlans"] },
  );
}

export function useAdminUpdateCirclePlan() {
  return useMutation<{ adminUpdateCirclePlan: CirclePlan }, { input: UpdateCirclePlanInput }>(
    ADMIN_UPDATE_CIRCLE_PLAN,
    { refetchQueries: ["AdminCirclePlans"] },
  );
}

export function useAdminDeactivateCirclePlan() {
  return useMutation<{ adminDeactivateCirclePlan: CirclePlan }, { planId: string }>(
    ADMIN_DEACTIVATE_CIRCLE_PLAN,
    { refetchQueries: ["AdminCirclePlans"] },
  );
}

/** Sets ONE (currency, interval) price. Prices are per currency AND per period. */
export function useAdminSetCirclePlanPrice() {
  return useMutation<
    { adminSetCirclePlanPrice: CirclePlan },
    { input: SetCirclePlanPriceInput }
  >(ADMIN_SET_CIRCLE_PLAN_PRICE, { refetchQueries: ["AdminCirclePlans"] });
}

/**
 * Sets ONE entitlement on a plan. On an INT entitlement `hasIntValue: false`
 * means UNLIMITED, not zero — always send it explicitly.
 */
export function useAdminSetCirclePlanEntitlement() {
  return useMutation<
    { adminSetCirclePlanEntitlement: CirclePlan },
    { input: SetCirclePlanEntitlementInput }
  >(ADMIN_SET_CIRCLE_PLAN_ENTITLEMENT, { refetchQueries: ["AdminCirclePlans"] });
}

// ── Subscription mutations ───────────────────────────────────────────────────

/**
 * The only route onto a paid plan in v1 — circles cannot be charged yet, so an
 * admin grant is how a paid tier is conferred.
 */
export function useAdminGrantCircleSubscription() {
  return useMutation<
    { adminGrantCircleSubscription: CircleSubscription },
    { input: GrantCircleSubscriptionInput }
  >(ADMIN_GRANT_CIRCLE_SUBSCRIPTION, {
    refetchQueries: ["AdminCircleSubscriptions", "AdminCircleSubscription"],
  });
}

/** Expiring a grant locks the circle back to free-plan caps — it never evicts. */
export function useAdminForceExpireCircleSubscription() {
  return useMutation<
    { adminForceExpireCircleSubscription: CircleSubscription },
    { subscriptionId: string; reason: string }
  >(ADMIN_FORCE_EXPIRE_CIRCLE_SUBSCRIPTION, {
    refetchQueries: ["AdminCircleSubscriptions", "AdminCircleSubscription"],
  });
}

// ── Moderation mutations (illegality only) ───────────────────────────────────

export function useAdminSuspendCircle() {
  return useMutation<{ adminSuspendCircle: Circle }, { circleId: string; reason: string }>(
    ADMIN_SUSPEND_CIRCLE,
    { refetchQueries: ["AdminCircles", "AdminCircle"] },
  );
}

export function useAdminUnsuspendCircle() {
  return useMutation<
    { adminUnsuspendCircle: Circle },
    { circleId: string; reason?: string }
  >(ADMIN_UNSUSPEND_CIRCLE, { refetchQueries: ["AdminCircles", "AdminCircle"] });
}

export function useAdminDissolveCircle() {
  return useMutation<{ adminDissolveCircle: Circle }, { circleId: string; reason: string }>(
    ADMIN_DISSOLVE_CIRCLE,
    { refetchQueries: ["AdminCircles", "AdminCircle"] },
  );
}
