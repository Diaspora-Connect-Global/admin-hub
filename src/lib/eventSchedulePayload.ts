import type { EventFormData } from "@/types/events";

/** Matches API: public | community | association | invite_only */
export const DEFAULT_EVENT_VISIBILITY = "public";

/**
 * Virtual/online events use UTC per API examples; physical/hybrid use the browser IANA zone when available.
 */
export function resolveEventTimezone(eventType: EventFormData["eventType"]): string {
  if (eventType === "virtual") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
