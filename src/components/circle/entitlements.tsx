import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Check, Infinity as InfinityIcon, X } from "lucide-react";
import type {
  CircleEntitlement,
  CircleEntitlementKey,
  CircleEntitlementValueKind,
} from "@/hooks/admin";

/**
 * Entitlement vocabulary + read-only rendering.
 *
 * TIER NAMES ARE NOT CAPABILITIES. Nothing in this console branches on a plan's
 * name or code — a tier is a row an admin created and may be called anything.
 * What a circle may do is the entitlement list, and only that.
 *
 * The KEY list, by contrast, is fixed: it mirrors the schema enum
 * `CircleEntitlementKey`, and adding one costs a backend code change plus a
 * migration. Rendering an unknown key would mean rendering a control that
 * cannot be saved, so the editor iterates this list.
 */

/** Every `CircleEntitlementKey` value, in the order the editor shows them. */
export const ENTITLEMENT_KEYS: CircleEntitlementKey[] = [
  "MAX_MEMBERS",
  "MAX_ACTIVE_PROJECTS",
  "MAX_ACTIVE_CHALLENGES",
  "CHAT_HISTORY_DAYS",
  "STORAGE_MB",
  "CUSTOM_BRANDING",
];

/**
 * The kind each key naturally carries — a DEFAULT for a key an admin has not
 * configured yet, not a constraint. The API accepts either kind for any key, so
 * the editor still exposes the choice; this only decides which control opens
 * first so the common case is one click instead of two.
 */
export const DEFAULT_ENTITLEMENT_KIND: Record<
  CircleEntitlementKey,
  CircleEntitlementValueKind
> = {
  MAX_MEMBERS: "INT",
  MAX_ACTIVE_PROJECTS: "INT",
  MAX_ACTIVE_CHALLENGES: "INT",
  CHAT_HISTORY_DAYS: "INT",
  STORAGE_MB: "INT",
  CUSTOM_BRANDING: "BOOL",
};

/** Find a plan's / subscription's entitlement for a key, if it has one. */
export function findEntitlement(
  entitlements: CircleEntitlement[] | undefined,
  key: string,
): CircleEntitlement | undefined {
  return entitlements?.find((e) => e.key === key);
}

/**
 * One entitlement's value as text.
 *
 * The whole point of this helper: on an INT entitlement `hasIntValue: false`
 * means UNLIMITED, NOT zero. Printing `intValue` without checking that flag
 * first turns an unlimited plan into one that permits nothing — the single
 * easiest way to break this feature.
 */
export function EntitlementValue({ entitlement }: { entitlement: CircleEntitlement }) {
  const { t } = useTranslation();
  if (entitlement.valueKind === "BOOL") {
    return entitlement.boolValue ? (
      <span className="inline-flex items-center gap-1 text-success">
        <Check className="h-4 w-4" aria-hidden />
        {t("circles.entitlements.enabled")}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <X className="h-4 w-4" aria-hidden />
        {t("circles.entitlements.disabled")}
      </span>
    );
  }
  if (!entitlement.hasIntValue) {
    return (
      <span className="inline-flex items-center gap-1 text-foreground">
        <InfinityIcon className="h-4 w-4" aria-hidden />
        {t("circles.entitlements.unlimited")}
      </span>
    );
  }
  return <span className="font-mono text-sm">{entitlement.intValue.toLocaleString()}</span>;
}

/** Human label for an entitlement key, falling back to the raw key. */
export function useEntitlementLabel() {
  const { t } = useTranslation();
  return (key: string) => {
    const label = t(`circles.entitlements.keys.${key}`);
    return label === `circles.entitlements.keys.${key}` ? key : label;
  };
}

/**
 * Read-only entitlement summary, used on the plan cards and on the
 * subscription snapshot. Keys the plan has never configured are omitted rather
 * than shown as zero — "not set" and "capped at nothing" are different facts.
 */
export function EntitlementSummary({
  entitlements,
  emptyLabel,
}: {
  entitlements: CircleEntitlement[];
  emptyLabel: string;
}) {
  const label = useEntitlementLabel();
  if (!entitlements.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {entitlements.map((entitlement) => (
        <li
          key={entitlement.key}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="text-muted-foreground">{label(entitlement.key)}</span>
          <EntitlementValue entitlement={entitlement} />
        </li>
      ))}
    </ul>
  );
}

/** Compact inline pill list, for table cells where a full list will not fit. */
export function EntitlementPills({ entitlements }: { entitlements: CircleEntitlement[] }) {
  const { t } = useTranslation();
  const label = useEntitlementLabel();
  if (!entitlements.length) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {entitlements.map((entitlement) => {
        const value =
          entitlement.valueKind === "BOOL"
            ? entitlement.boolValue
              ? t("circles.entitlements.enabled")
              : t("circles.entitlements.disabled")
            : entitlement.hasIntValue
              ? entitlement.intValue.toLocaleString()
              : t("circles.entitlements.unlimited");
        return (
          <Badge key={entitlement.key} variant="outline" className="font-normal">
            {label(entitlement.key)}: {value}
          </Badge>
        );
      })}
    </div>
  );
}
