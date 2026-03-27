import type { EventFormData } from "@/types/events";

/**
 * Maps participant-cap UI to CreateEventInput / UpdateEventInput `capacity`.
 */
export function buildEventCapacityPayload(
  data: Pick<EventFormData, "hasParticipantLimit" | "maxParticipants">,
): { capacity?: number } {
  if (data.hasParticipantLimit && data.maxParticipants >= 1) {
    return { capacity: Math.floor(data.maxParticipants) };
  }
  return {};
}
