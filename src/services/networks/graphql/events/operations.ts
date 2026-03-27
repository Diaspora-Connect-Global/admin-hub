import { gql } from "@apollo/client";

/**
 * Events Service — GraphQL operations for admin hub.
 * Auth: Bearer JWT (same as admin client). Use with adminClient or Apollo hooks.
 * @see docs/EVENTS-GRAPHQL-API.md
 */

const EVENT_LIST_FIELDS = gql`
  fragment EventListFields on EventGQL {
    id
    title
    status
    startAt
    endAt
    eventCategory
    locationType
    locationDetails {
      type
      venueName
      city
      country
      virtualLink
      platform
    }
    isPaid
    registrationCount
    availableSpots
    isRegistered
    canRegister
    coverImageUrl
    tags
  }
`;

const EVENT_FULL_FIELDS = gql`
  fragment EventFullFields on EventGQL {
    id
    title
    description
    status
    startAt
    endAt
    eventCategory
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
    isPaid
    registrationCount
    availableSpots
    isRegistered
    canRegister
    tickets {
      id
      name
      priceInCents
      availableQuantity
    }
    coverImageUrl
    tags
    timezone
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

/** List events with filters and pagination. */
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

/** Get single event by ID. */
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
      visibility
      locationType
      startAt
      endAt
      timezone
      coverImageUrl
      tags
      isPaid
      capacity
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
