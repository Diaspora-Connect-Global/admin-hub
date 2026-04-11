/**
 * Event types aligned with the Events GraphQL API.
 * @see docs/EVENTS-GRAPHQL-API.md
 */

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CANCELLED"
  | "COMPLETED"
  | "draft"
  | "published"
  | "cancelled"
  | "completed";
export type EventLocationType = "PHYSICAL" | "VIRTUAL" | "HYBRID" | "physical" | "virtual" | "hybrid";
export type EventOwnerType = "SYSTEM" | "USER" | "COMMUNITY" | "ASSOCIATION" | "user" | "community" | "association";
export type EventVisibility =
  | "PUBLIC"
  | "COMMUNITY"
  | "ASSOCIATION"
  | "INVITE_ONLY"
  | "public"
  | "community"
  | "association"
  | "invite_only";
export type EventCapacityType = "LIMITED" | "UNLIMITED";

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
  currency?: string | null;
  ticketType?: string | null;
  description?: string | null;
  availableQuantity?: number | null;
}

export interface EventRegistrationFormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[] | null;
}

export interface Event {
  id: string;
  ownerType: EventOwnerType;
  ownerId: string;
  title: string;
  description: string;
  status: EventStatus;
  startAt: string;
  endAt: string;
  eventCategory: string;
  visibility?: EventVisibility | null;
  locationType: EventLocationType;
  locationDetails?: EventLocation | null;
  timezone?: string | null;
  capacityType?: EventCapacityType | null;
  capacity?: number | null;
  isPaid: boolean;
  currency?: string | null;
  registrationCount: number;
  viewCount?: number | null;
  saveCount?: number | null;
  availableSpots?: number | null;
  isRegistered?: boolean;
  canRegister?: boolean;
  tickets?: EventTicket[] | null;
  coverImageUrl?: string | null;
  tags?: string[] | null;
  publishedAt?: string | null;
  cancelledAt?: string | null;
  recurringEventId?: string | null;
  registrationFormFields?: EventRegistrationFormField[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  ticketId?: string | null;
  quantity: number;
  status: string;
  totalAmount?: string | null;
  currency?: string | null;
  registeredAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
}

/** Form data for create/edit event modal (UI values). */
export type EventType = "in-person" | "virtual" | "hybrid";

export interface EventTicketFormData {
  name: string;
  ticketType: "general" | "vip" | "early_bird" | "group" | "student" | "member" | "free";
  price: number;
  currency: string;
  quantity: number;
  maxPerOrder: number;
  isActive: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  bannerImage: File | null;
  date?: Date;
  startTime: string;
  endTime: string;
  eventType: EventType;
  /** Physical / hybrid — required by API for non-virtual events */
  venue: string;
  address: string;
  city: string;
  country: string;
  virtualLink: string;
  isPaid: boolean;
  tickets: EventTicketFormData[];
  ticketType: "general" | "free";
  ticketName: string;
  ticketDescription: string;
  ticketPrice: number;
  ticketQuantity: number;
  ticketMaxPerOrder: number;
  ticketIsActive: boolean;
  currency: string;
  hasParticipantLimit: boolean;
  maxParticipants: number;
  publishNow: boolean;
  notifyMembers: boolean;
  eventCategory?: string;
  ownerId?: string;
  visibility?: string;
}
