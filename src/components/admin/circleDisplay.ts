import type { StatusBadgeProps } from "@/components/ui/StatusBadge";

type Variant = NonNullable<StatusBadgeProps["variant"]>;

/**
 * Badge colour for a circle's lifecycle state.
 *
 * The values are the BARE domain spellings circle-service stores and emits
 * (`ACTIVE`, `SUSPENDED`), not the proto's prefixed siblings. Anything
 * unrecognised falls through to the neutral variant rather than the healthy
 * one — a state this console does not know about must not be painted green.
 *
 * DORMANT is warning-coloured but is not a fault: it means fewer than two
 * active members, reads still work, and it reactivates on the next join.
 */
export function circleStatusVariant(status?: string | null): Variant {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "DORMANT":
      return "pending";
    case "SUSPENDED":
      return "warning";
    case "DISSOLVED":
      return "error";
    case "ARCHIVED":
      return "inactive";
    default:
      return "inactive";
  }
}

/**
 * Badge colour for a subscription state. Again BARE: `ACTIVE`, not
 * `SUBSCRIPTION_ACTIVE`. Matching on the prefixed spelling would silently paint
 * every subscription with the neutral fallback.
 */
export function subscriptionStatusVariant(status?: string | null): Variant {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "PAST_DUE":
      return "warning";
    case "CANCELLED":
    case "EXPIRED":
      return "inactive";
    default:
      return "inactive";
  }
}

/** ISO-8601 to a locale string, or an em dash. Never renders "Invalid Date". */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/** Up to two initials for an avatar fallback. */
export function initialsOf(name?: string | null, fallback = "?"): string {
  if (!name) return fallback;
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || fallback
  );
}
