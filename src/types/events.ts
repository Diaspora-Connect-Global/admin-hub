/**
 * Event types aligned with the Events GraphQL API.
 * @see docs/EVENTS-GRAPHQL-API.md
 */

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type EventLocationType = "PHYSICAL" | "VIRTUAL" | "HYBRID";

export interface EventLocation {
  type: EventLocationType;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  virtualLink?: string | null;
  platform?: string | null;
}

export interface EventTicket {
  id: string;
  name: string;
  priceInCents: number;
  description?: string | null;
  availableQuantity?: number | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  startAt: string;
  endAt: string;
  eventCategory: string;
  locationType: EventLocationType;
  locationDetails?: EventLocation | null;
  isPaid: boolean;
  registrationCount: number;
  availableSpots?: number | null;
  isRegistered?: boolean;
  canRegister?: boolean;
  tickets?: EventTicket[] | null;
  coverImageUrl?: string | null;
  tags?: string[] | null;
  timezone?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  ticketId?: string | null;
  quantity: number;
  status: string;
  totalAmount?: string | null;
  registeredAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
}

/** Form data for create/edit event modal (UI values). */
export type EventType = "in-person" | "virtual" | "hybrid";

export interface EventFormData {
  title: string;
  description: string;
  bannerImage: File | null;
  date?: Date;
  startTime: string;
  endTime: string;
  eventType: EventType;
  location: string;
  virtualLink: string;
  isPaid: boolean;
  ticketPrice: number;
  currency: string;
  hasParticipantLimit: boolean;
  maxParticipants: number;
  publishNow: boolean;
  notifyMembers: boolean;
  allowComments: boolean;
  eventCategory?: string;
  ownerType?: string;
  ownerId?: string;
}
