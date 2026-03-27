import type { EventFormData } from "@/types/events";

/**
 * Maps participant-cap UI to CreateEventInput / UpdateEventInput `capacity`.
 * The API treats free events (`isPaid: false`) as unlimited-capacity and rejects any `capacity` value.
 * Only send `capacity` for paid events with the limit switch on and a valid positive integer.
 */
export function buildEventCapacityPayload(
  data: Pick<EventFormData, "isPaid" | "hasParticipantLimit" | "maxParticipants">,
): { capacity?: number } {
  if (data.isPaid !== true) {
    return {};
  }
  if (data.hasParticipantLimit !== true) {
    return {};
  }
  const n = Number(data.maxParticipants);
  if (!Number.isFinite(n) || n < 1) {
    return {};
  }
  return { capacity: Math.floor(n) };
}
