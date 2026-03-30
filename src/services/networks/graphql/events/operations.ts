import { gql } from "@apollo/client";

/**
 * Events Service — GraphQL operations for admin hub.
 * Auth: Bearer JWT (same as admin client). Use with adminClient or Apollo hooks.
 * @see docs/EVENTS-GRAPHQL-API.md
 */

const EVENT_LIST_FIELDS = gql`
  fragment EventListFields on Event {
    id
    ownerType
    ownerId
    title
    visibility
    status
    isPaid
    currency
    capacityType
    capacity
    registrationCount
    startAt
    createdAt
    coverImageUrl
  }
`;

const EVENT_FULL_FIELDS = gql`
  fragment EventFullFields on Event {
    id
    ownerType
    ownerId
    title
    description
    eventCategory
    visibility
    locationType
    locationDetails
    startAt
    endAt
    timezone
    capacityType
    capacity
    status
    isPaid
    currency
    coverImageUrl
    tags
    registrationCount
    viewCount
    saveCount
    publishedAt
    cancelledAt
    createdAt
    updatedAt
    recurringEventId
  }
`;

const EVENT_REGISTRATION_FIELDS = gql`
  fragment EventRegistrationFields on EventRegistrationGQL {
    id
    eventId
    userId
    ticketId
    quantity
    status
    totalAmount
    registeredAt
    confirmedAt
    cancelledAt
    createdAt
  }
`;

/** Admin list events with filters — all statuses, all owners. */
export const SEARCH_EVENTS = gql`
  ${EVENT_LIST_FIELDS}
  query SearchEvents(
    $status: String
    $ownerType: String
    $ownerId: String
    $category: String
    $isPaid: Boolean
    $page: Int
    $limit: Int
  ) {
    searchEvents(
      status: $status
      ownerType: $ownerType
      ownerId: $ownerId
      category: $category
      isPaid: $isPaid
      page: $page
      limit: $limit
    ) {
      items {
        ...EventListFields
      }
      total
      page
      limit
    }
  }
`;

/** Kept for backward compatibility, but prefer SEARCH_EVENTS for admin. */
export const LIST_EVENTS = SEARCH_EVENTS;

/** Get single event by ID (admin view — full detail). */
export const GET_EVENT = gql`
  ${EVENT_FULL_FIELDS}
  query GetEvent($id: ID!) {
    getEvent(id: $id) {
      ...EventFullFields
    }
  }
`;

/** Get registrations for an event. */
export const GET_EVENT_REGISTRATIONS = gql`
  ${EVENT_REGISTRATION_FIELDS}
  query GetEventRegistrations(
    $eventId: ID!
    $limit: Int
    $offset: Int
    $status: String
  ) {
    getEventRegistrations(
      eventId: $eventId
      limit: $limit
      offset: $offset
      status: $status
    ) {
      registrations {
        ...EventRegistrationFields
      }
      total
    }
  }
`;

/** Create event (include coverImageUrl in input when banner was uploaded first). */
export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      description
      status
      locationType
      startAt
      endAt
      timezone
      coverImageUrl
      tags
      isPaid
      currency
      capacity
      availableSpots
      tickets {
        id
        name
        priceInCents
      }
    }
  }
`;

/** Update event. */
export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      status
      startAt
      endAt
      coverImageUrl
      tags
      isPaid
      currency
      capacity
      availableSpots
      tickets {
        id
        name
        priceInCents
      }
    }
  }
`;

/**
 * Signed upload URL for event cover (same flow as profile image).
 * PUT file to uploadUrl without Authorization; use publicUrl as coverImageUrl on createEvent/updateEvent.
 */
export const GET_UPLOAD_URL = gql`
  query GetUploadUrl($contentType: String!, $category: String!) {
    getUploadUrl(contentType: $contentType, category: $category) {
      uploadUrl
      publicUrl
    }
  }
`;

/** Delete event. */
export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
      success
      message
    }
  }
`;

/** Publish event. */
export const PUBLISH_EVENT = gql`
  mutation PublishEvent($id: ID!) {
    publishEvent(id: $id) {
      id
      status
    }
  }
`;

/** Revert published event to draft. */
export const UNPUBLISH_EVENT = gql`
  mutation UnpublishEvent($id: ID!) {
    unpublishEvent(id: $id) {
      id
      status
    }
  }
`;

/** Mark registration as checked in. */
export const MARK_REGISTRATION_CHECKED_IN = gql`
  mutation MarkRegistrationCheckedIn($registrationId: ID!) {
    markRegistrationCheckedIn(registrationId: $registrationId) {
      id
      status
    }
  }
`;

/** Remove a registration. */
export const REMOVE_EVENT_REGISTRATION = gql`
  mutation RemoveEventRegistration($registrationId: ID!) {
    removeEventRegistration(registrationId: $registrationId) {
      success
      message
    }
  }
`;

/** Admin — Get event tickets (for paid events). */
export const GET_EVENT_TICKETS = gql`
  query GetEventTickets($eventId: String!) {
    getEventTickets(eventId: $eventId) {
      id
      name
      ticketType
      price
      currency
      totalQuantity
      soldCount
      status
    }
  }
`;

/** Admin — Get event registrations with pagination. */
export const GET_EVENT_REGISTRATIONS_ADMIN = gql`
  query GetEventRegistrations(
    $eventId: String!
    $status: String
    $page: Int
    $limit: Int
  ) {
    getEventRegistrations(
      eventId: $eventId
      status: $status
      page: $page
      limit: $limit
    ) {
      items {
        id
        userId
        status
        checkedIn
        checkedInAt
        createdAt
      }
      total
      page
      limit
    }
  }
`;

/** Admin — Force cancel an event. */
export const CANCEL_EVENT = gql`
  mutation CancelEvent($eventId: String!, $reason: String!) {
    cancelEvent(eventId: $eventId, reason: $reason) {
      id
      status
      cancelledAt
    }
  }
`;

/** Admin — Force delete an event. */
export const DELETE_EVENT_ADMIN = gql`
  mutation DeleteEventAdmin($eventId: String!) {
    deleteEvent(eventId: $eventId)
  }
`;

/** Admin — Publish event on behalf of owner. */
export const PUBLISH_EVENT_ADMIN = gql`
  mutation PublishEventAdmin($eventId: String!) {
    publishEvent(eventId: $eventId) {
      id
      status
      publishedAt
    }
  }
`;

/** Admin — Unpublish event on behalf of owner. */
export const UNPUBLISH_EVENT_ADMIN = gql`
  mutation UnpublishEventAdmin($eventId: String!) {
    unpublishEvent(eventId: $eventId) {
      id
      status
    }
  }
`;

/** Admin — Get event dashboard stats. */
export const EVENT_DASHBOARD_STATS = gql`
  query EventDashboardStats {
    liveEventCount: searchEvents(status: "published", limit: 1) {
      total
    }
    draftEventCount: searchEvents(status: "draft", limit: 1) {
      total
    }
    cancelledEventCount: searchEvents(status: "cancelled", limit: 1) {
      total
    }
    paidEventCount: searchEvents(isPaid: true, limit: 1) {
      total
    }
  }
`;
