/**
 * Events Service hooks. Uses shared admin Apollo client (Bearer).
 * @see docs/EVENTS-GRAPHQL-API.md
 */

import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import {
  LIST_EVENTS,
  GET_EVENT,
  GET_EVENT_REGISTRATIONS,
  CREATE_EVENT,
  UPDATE_EVENT,
  GET_UPLOAD_URL,
  DELETE_EVENT,
  PUBLISH_EVENT,
  UNPUBLISH_EVENT,
  MARK_REGISTRATION_CHECKED_IN,
  REMOVE_EVENT_REGISTRATION,
} from "@/services/networks/graphql/events";

export interface ListEventsInput {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  status?: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  communityId?: string;
  ownerType?: string;
  ownerId?: string;
}

export function useListEvents(input?: ListEventsInput) {
  return useQuery(LIST_EVENTS, {
    variables: { input: input ?? {} },
    fetchPolicy: "network-only",
  });
}

export function useGetEvent(id: string | null) {
  return useQuery(GET_EVENT, {
    variables: { id: id ?? "" },
    skip: !id,
  });
}

export interface GetEventRegistrationsVariables {
  eventId: string;
  limit?: number;
  offset?: number;
  status?: string;
}

export function useGetEventRegistrations(variables: GetEventRegistrationsVariables | null) {
  return useQuery(GET_EVENT_REGISTRATIONS, {
    variables: variables ?? { eventId: "" },
    skip: !variables?.eventId,
  });
}

export function useCreateEvent() {
  return useMutation(CREATE_EVENT);
}

export function useUpdateEvent() {
  return useMutation(UPDATE_EVENT);
}

/** Lazy query: call with contentType + category (e.g. event_cover) before PUT to uploadUrl. */
export function useGetUploadUrl() {
  return useLazyQuery<
    { getUploadUrl: { uploadUrl: string; publicUrl: string } },
    { contentType: string; category: string }
  >(GET_UPLOAD_URL, { fetchPolicy: "network-only" });
}

export function useDeleteEvent() {
  return useMutation(DELETE_EVENT);
}

export function usePublishEvent() {
  return useMutation(PUBLISH_EVENT);
}

export function useUnpublishEvent() {
  return useMutation(UNPUBLISH_EVENT);
}

export function useMarkRegistrationCheckedIn() {
  return useMutation(MARK_REGISTRATION_CHECKED_IN);
}

export function useRemoveEventRegistration() {
  return useMutation(REMOVE_EVENT_REGISTRATION);
}
