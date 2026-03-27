import type { EventFormData, EventType } from "@/types/events";

/** Subset of CreateEventLocationInput sent to GraphQL */
export type EventLocationInput = {
  type: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  virtualLink?: string;
  platform?: string;
};

export function requiresPhysicalLocation(eventType: EventType): boolean {
  return eventType === "in-person" || eventType === "hybrid";
}

/**
 * - Physical: { type: "physical", venue, address, city, country } (all required; validated before call).
 * - Virtual: omit locationDetails when no link; else { type: "virtual", virtualLink, platform }.
 * - Hybrid: physical fields required; optional virtualLink + platform when link present.
 */
export function buildEventLocationPayload(data: EventFormData): EventLocationInput | undefined {
  if (data.eventType === "virtual") {
    const link = data.virtualLink.trim();
    if (!link) return undefined;
    return {
      type: "virtual",
      virtualLink: link,
      platform: "Zoom",
    };
  }

  const venue = data.venue.trim();
  const address = data.address.trim();
  const city = data.city.trim();
  const country = data.country.trim();

  if (data.eventType === "hybrid") {
    const link = data.virtualLink.trim();
    return {
      type: "hybrid",
      venue,
      address,
      city,
      country,
      ...(link ? { virtualLink: link, platform: "Zoom" } : {}),
    };
  }

  return {
    type: "physical",
    venue,
    address,
    city,
    country,
  };
}
