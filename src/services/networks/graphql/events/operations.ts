import { gql } from "@apollo/client";

/**
 * Events Service — GraphQL operations for admin hub.
 * Auth: Bearer JWT (same as admin client). Use with adminClient or Apollo hooks.
 * @see docs/EVENTS-GRAPHQL-API.md
 */

const EVENT_LIST_FIELDS = gql`
  fragment EventListFields on EventGQL {
    id
    ownerType
    ownerId
    title
    visibility
    status
    isPaid
    currency
    capacity
    availableSpots
    registrationCount
    startAt
    createdAt
    coverImageUrl
  }
`;

const EVENT_FULL_FIELDS = gql`
  fragment EventFullFields on EventGQL {
    id
    ownerType
    ownerId
    title
    description
    eventCategory
    visibility
    locationType
    locationDetails {
      type
      venueName
      address
      city
      country
      virtualLink
      platform
    }
    startAt
    endAt
    timezone
    capacity
    availableSpots
    status
    isPaid
    currency
    coverImageUrl
    tags
    registrationCount
    isRegistered
    canRegister
    tickets {
      id
      name
      priceInCents
      description
      availableQuantity
    }
    createdAt
    updatedAt
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

/** Admin list/search events — paginated with optional filters. */
export const LIST_EVENTS = gql`
  ${EVENT_LIST_FIELDS}
  query ListEvents($input: ListEventsInput) {
    listEvents(input: $input) {
      events {
        ...EventListFields
      }
      total
    }
  }
`;

/** Get single event by ID (admin view — full detail). */
export const GET_EVENT = gql`
  ${EVENT_FULL_FIELDS}
  query GetEvent($id: ID!) {
    getEvent(id: $id) {
      ...EventFullFields
    }
  }
`;

/** Get all events belonging to a specific owner (user / community / association). */
export const GET_EVENTS_BY_OWNER = gql`
  ${EVENT_LIST_FIELDS}
  query GetEventsByOwner(
    $ownerId: ID!
    $ownerType: String!
    $status: String
    $limit: Int
    $offset: Int
  ) {
    getEventsByOwner(
      ownerId: $ownerId
      ownerType: $ownerType
      status: $status
      limit: $limit
      offset: $offset
    ) {
      events {
        ...EventListFields
      }
      total
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

/** Admin — Get full ticket details for an event. */
export const GET_EVENT_TICKETS = gql`
  query GetEventTickets($eventId: ID!, $activeOnly: Boolean) {
    getEventTickets(eventId: $eventId, activeOnly: $activeOnly) {
      tickets {
        id
        name
        priceInCents
        ticketType
        totalQuantity
        soldQuantity
        reservedQuantity
        availableQuantity
        isActive
        salesStart
        salesEnd
        createdAt
      }
    }
  }
`;

/** Admin — Get attendance / check-in list for an event. */
export const GET_EVENT_ATTENDANCE = gql`
  query GetEventAttendance($eventId: ID!, $limit: Int, $offset: Int) {
    getEventAttendance(eventId: $eventId, limit: $limit, offset: $offset) {
      total
      attendance {
        id
        userId
        registrationId
        checkInMethod
        checkedInAt
        checkedOutAt
        checkedInBy
        notes
      }
    }
  }
`;

/** Admin — Dashboard stats for a single event. */
export const GET_EVENT_STATS = gql`
  query GetEventStats($eventId: ID!) {
    getEventStats(eventId: $eventId) {
      eventId
      totalRegistrations
      confirmedRegistrations
      pendingRegistrations
      cancelledRegistrations
      totalTicketsSold
      totalCapacity
      availableCapacity
      totalCheckIns
      currentlyAttending
      saveCount
      totalRevenue
      currency
    }
  }
`;

/** Admin — Get registrations with pagination (admin view). */
export const GET_EVENT_REGISTRATIONS_ADMIN = gql`
  query GetEventRegistrationsAdmin(
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
        id
        eventId
        userId
        status
        quantity
        registeredAt
        confirmedAt
        cancelledAt
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

/** Admin — Force delete an event. */
export const DELETE_EVENT_ADMIN = gql`
  mutation DeleteEventAdmin($id: ID!) {
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

/** Admin — Publish event on behalf of owner. */
export const PUBLISH_EVENT_ADMIN = gql`
  mutation PublishEventAdmin($id: ID!) {
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

/** Admin — Unpublish event on behalf of owner. */
export const UNPUBLISH_EVENT_ADMIN = gql`
  mutation UnpublishEventAdmin($id: ID!) {
    unpublishEvent(id: $id) {
      id
      status
    }
  }
`;

/** Admin — Force cancel an event. */
export const CANCEL_EVENT = gql`
  mutation CancelEvent($id: ID!, $reason: String!) {
    cancelEvent(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

/** Admin — Mark event as completed. */
export const COMPLETE_EVENT = gql`
  mutation CompleteEvent($id: ID!) {
    completeEvent(id: $id) {
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

/** Admin — Create a custom ticket for an event. */
export const CREATE_EVENT_TICKET = gql`
  mutation CreateEventTicket($eventId: ID!, $input: CreateTicketInput!) {
    createEventTicket(eventId: $eventId, input: $input) {
      id
      name
      priceInCents
      totalQuantity
      isActive
    }
  }
`;

/** Admin — Update an existing ticket. */
export const UPDATE_EVENT_TICKET = gql`
  mutation UpdateEventTicket($ticketId: ID!, $input: UpdateTicketInput!) {
    updateEventTicket(ticketId: $ticketId, input: $input) {
      id
      name
      priceInCents
      totalQuantity
      isActive
    }
  }
`;

/** Admin — Event dashboard stats (counts by status). */
export const EVENT_DASHBOARD_STATS = gql`
  query EventDashboardStats {
    liveEventCount: listEvents(input: { status: "PUBLISHED", limit: 1 }) {
      total
    }
    draftEventCount: listEvents(input: { status: "DRAFT", limit: 1 }) {
      total
    }
    cancelledEventCount: listEvents(input: { status: "CANCELLED", limit: 1 }) {
      total
    }
    completedEventCount: listEvents(input: { status: "COMPLETED", limit: 1 }) {
      total
    }
  }
`;
