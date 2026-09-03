import { useMutation, useQuery } from "@apollo/client/react";
import {
  ADMIN_LIST_CIRCLE_PLANS,
  ADMIN_CREATE_CIRCLE_PLAN,
  ADMIN_UPDATE_CIRCLE_PLAN,
  ADMIN_DEACTIVATE_CIRCLE_PLAN,
  ADMIN_SET_CIRCLE_PLAN_PRICE,
  ADMIN_SET_CIRCLE_PLAN_ENTITLEMENT,
  type AdminCirclePlan,
  type AdminCircleEntitlement,
  type AdminCirclePlanPrice,
  type CreateCirclePlanInput,
  type UpdateCirclePlanInput,
  type SetCirclePlanPriceInput,
  type SetCirclePlanEntitlementInput,
} from "@/services/networks/graphql/admin";

export type {
  AdminCirclePlan,
  AdminCircleEntitlement,
  AdminCirclePlanPrice,
  CreateCirclePlanInput,
  UpdateCirclePlanInput,
  SetCirclePlanPriceInput,
  SetCirclePlanEntitlementInput,
};

/** Billing intervals. NONE is the free plan — priced at zero, not absent. */
export const CIRCLE_PRICE_INTERVALS = ["MONTH", "YEAR", "ONE_TIME", "NONE"] as const;

/**
 * The COMPLETE v1 entitlement vocabulary, with the value kind each key must be
 * set as. Tiers are unlimited and admin-created; these keys are not — something
 * has to enforce the limit before member twenty-one walks in. Adding a key
 * costs a backend code change plus a migration, so this list is exhaustive and
 * the editor renders exactly it rather than a free-text key field.
 */
export const CIRCLE_ENTITLEMENT_KEYS = [
  { key: "MAX_MEMBERS", valueKind: "INT" },
  { key: "MAX_ACTIVE_PROJECTS", valueKind: "INT" },
  { key: "MAX_ACTIVE_CHALLENGES", valueKind: "INT" },
  { key: "CHAT_HISTORY_DAYS", valueKind: "INT" },
  { key: "STORAGE_MB", valueKind: "INT" },
  { key: "CUSTOM_BRANDING", valueKind: "BOOL" },
] as const;

export type CircleEntitlementKey = (typeof CIRCLE_ENTITLEMENT_KEYS)[number]["key"];

/**
 * Is this INT entitlement unlimited?
 *
 * `hasIntValue: false` means the admin set NO CEILING. `intValue` is then 0
 * only because proto3 has no null, so a reader that consults the number without
 * checking the flag turns an unlimited plan into one that permits nothing. That
 * is the single easiest way to break this feature, which is why the check lives
 * in one exported function rather than being re-typed at each call site.
 */
export function isUnlimited(entitlement: AdminCircleEntitlement | undefined | null): boolean {
  if (!entitlement) return false;
  return entitlement.valueKind === "INT" && !entitlement.hasIntValue;
}

/**
 * The value to SHOW for an entitlement. Callers pass their own translated
 * "Unlimited" / "Not set" strings so this stays i18n-agnostic.
 */
export function describeEntitlement(
  entitlement: AdminCircleEntitlement | undefined | null,
  labels: { unlimited: string; notSet: string; on: string; off: string },
): string {
  if (!entitlement) return labels.notSet;
  if (entitlement.valueKind === "BOOL") return entitlement.boolValue ? labels.on : labels.off;
  if (!entitlement.hasIntValue) return labels.unlimited;
  return String(entitlement.intValue);
}

/** Look one entitlement up on a plan by key. */
export function findEntitlement(
  plan: AdminCirclePlan | null | undefined,
  key: string,
): AdminCircleEntitlement | undefined {
  return plan?.entitlements?.find((e) => e.key === key);
}

/** Look one price up on a plan by (currency, interval). */
export function findPrice(
  plan: AdminCirclePlan | null | undefined,
  currency: string,
  interval: string,
): AdminCirclePlanPrice | undefined {
  return plan?.prices?.find((p) => p.currency === currency && p.interval === interval);
}

/**
 * The catalogue, including deactivated plans by default — this is the admin
 * listing, and a retired plan still needs to be visible to the person who
 * retired it. (The end-user `circlePlans` query hard-codes `includeInactive:
 * false`; do not use it here.)
 */
export function useAdminCirclePlans(includeInactive = true) {
  return useQuery<{ adminCirclePlans: AdminCirclePlan[] }>(ADMIN_LIST_CIRCLE_PLANS, {
    variables: { includeInactive },
    fetchPolicy: "cache-and-network",
  });
}

export function useAdminCreateCirclePlan() {
  return useMutation<{ adminCreateCirclePlan: AdminCirclePlan }>(ADMIN_CREATE_CIRCLE_PLAN);
}

/**
 * Rename / re-describe / re-order only. `code` is immutable, and editing a plan
 * never rewrites what a circle already holds — entitlements are snapshotted
 * onto the subscription at purchase precisely so that a catalogue edit cannot
 * silently reduce a live circle's capabilities.
 */
export function useAdminUpdateCirclePlan() {
  return useMutation<{ adminUpdateCirclePlan: AdminCirclePlan }>(ADMIN_UPDATE_CIRCLE_PLAN);
}

/**
 * Retire a plan. Circles already on it keep their snapshot and lose nothing.
 *
 * Guard the call site with `canDeactivatePlan` — the default free plan must
 * never reach this mutation.
 */
export function useAdminDeactivateCirclePlan() {
  return useMutation<{ adminDeactivateCirclePlan: AdminCirclePlan }>(
    ADMIN_DEACTIVATE_CIRCLE_PLAN,
  );
}

/**
 * Whether a plan may be deactivated.
 *
 * The default plan cannot. Every new circle is created with its free
 * subscription in the SAME transaction as the circle itself, so a catalogue
 * with no default leaves new circles with no entitlements at all — and a circle
 * created without entitlements is unrecoverable. circle-service refuses it, and
 * the console refuses it too: an admin should never be offered a button whose
 * only outcome is an error, because "the backend will stop me" is exactly the
 * assumption that stops being true when someone adds a bulk action later.
 */
export function canDeactivatePlan(plan: AdminCirclePlan | null | undefined): boolean {
  return !!plan && plan.isActive && !plan.isDefault;
}

/** Set one (currency, interval) price. `amountMinor` must already be minor units. */
export function useAdminSetCirclePlanPrice() {
  return useMutation<{ adminSetCirclePlanPrice: AdminCirclePlan }>(ADMIN_SET_CIRCLE_PLAN_PRICE);
}

/**
 * Set one entitlement.
 *
 * Always send `hasIntValue` explicitly for an INT key: the backend forwards it
 * verbatim and false means UNLIMITED. Never derive it from "the number box is
 * empty" — build the input with `buildEntitlementInput`.
 */
export function useAdminSetCirclePlanEntitlement() {
  return useMutation<{ adminSetCirclePlanEntitlement: AdminCirclePlan }>(
    ADMIN_SET_CIRCLE_PLAN_ENTITLEMENT,
  );
}

/**
 * Build a `SetCirclePlanEntitlementInput` from an editor's state, making the
 * unlimited/limited choice explicit rather than inferring it from emptiness.
 *
 * `unlimited: true` sends `hasIntValue: false` and no number at all. Anything
 * else requires a real integer — the caller must have validated it, because
 * passing `null` here would send a limit of nothing.
 */
export function buildEntitlementInput(args: {
  planId: string;
  key: string;
  valueKind: string;
  /** INT keys only. Ignored for BOOL. */
  unlimited?: boolean;
  /** INT keys only, and only when `unlimited` is false. */
  intValue?: number | null;
  /** BOOL keys only. */
  boolValue?: boolean;
}): SetCirclePlanEntitlementInput | null {
  const { planId, key, valueKind } = args;
  if (valueKind === "BOOL") {
    return { planId, key, valueKind, boolValue: !!args.boolValue };
  }
  if (args.unlimited) {
    // No ceiling. `hasIntValue: false` is the entire signal — sending an
    // intValue alongside it would be noise the backend ignores.
    return { planId, key, valueKind, hasIntValue: false };
  }
  const n = args.intValue;
  if (n === null || n === undefined || !Number.isFinite(n) || n < 0) return null;
  return { planId, key, valueKind, hasIntValue: true, intValue: Math.floor(n) };
}
