import type { EventFormData } from "@/types/events";

/**
 * Participant cap as a positive integer for UpdateEventInput (and post-create patch).
 * Does not depend on paid vs free.
 */
export function resolveEventCapacity(
  data: Pick<EventFormData, "hasParticipantLimit" | "maxParticipants">,
): number | undefined {
  if (data.hasParticipantLimit !== true) {
    return undefined;
  }
  const n = Number(data.maxParticipants);
  if (!Number.isFinite(n) || n < 1) {
    return undefined;
  }
  return Math.floor(n);
}
