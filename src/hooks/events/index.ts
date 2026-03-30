/**
 * Events Service hooks. Uses shared admin Apollo client (Bearer).
 * @see docs/EVENTS-GRAPHQL-API.md
 */

import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import {
  LIST_EVENTS,
  SEARCH_EVENTS,
  GET_EVENT,
  GET_EVENT_REGISTRATIONS,
  GET_EVENT_TICKETS,
  GET_EVENT_REGISTRATIONS_ADMIN,
  CREATE_EVENT,
  UPDATE_EVENT,
  GET_UPLOAD_URL,
  DELETE_EVENT,
  DELETE_EVENT_ADMIN,
  PUBLISH_EVENT,
  PUBLISH_EVENT_ADMIN,
  UNPUBLISH_EVENT,
  UNPUBLISH_EVENT_ADMIN,
  CANCEL_EVENT,
  MARK_REGISTRATION_CHECKED_IN,
  REMOVE_EVENT_REGISTRATION,
  EVENT_DASHBOARD_STATS,
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

export interface SearchEventsInput {
  status?: string;
  ownerType?: string;
  ownerId?: string;
  category?: string;
  isPaid?: boolean;
  page?: number;
  limit?: number;
}

export function useListEvents(input?: ListEventsInput) {
  return useQuery(LIST_EVENTS, {
    variables: { input: input ?? {} },
    fetchPolicy: "network-only",
  });
}

export function useSearchEvents(input?: SearchEventsInput) {
  return useQuery(SEARCH_EVENTS, {
    variables: input ?? {},
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

export function useGetEventTickets(eventId: string | null) {
  return useQuery(GET_EVENT_TICKETS, {
    variables: { eventId: eventId ?? "" },
    skip: !eventId,
  });
}

export function useGetEventRegistrationsAdmin(variables: GetEventRegistrationsVariables | null) {
  return useQuery(GET_EVENT_REGISTRATIONS_ADMIN, {
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

export function useDeleteEventAdmin() {
  return useMutation(DELETE_EVENT_ADMIN);
}

export function usePublishEvent() {
  return useMutation(PUBLISH_EVENT);
}

export function usePublishEventAdmin() {
  return useMutation(PUBLISH_EVENT_ADMIN);
}

export function useUnpublishEvent() {
  return useMutation(UNPUBLISH_EVENT);
}

export function useUnpublishEventAdmin() {
  return useMutation(UNPUBLISH_EVENT_ADMIN);
}

export function useCancelEvent() {
  return useMutation(CANCEL_EVENT);
}

export function useMarkRegistrationCheckedIn() {
  return useMutation(MARK_REGISTRATION_CHECKED_IN);
}

export function useRemoveEventRegistration() {
  return useMutation(REMOVE_EVENT_REGISTRATION);
}

export function useEventDashboardStats() {
  return useQuery(EVENT_DASHBOARD_STATS, { fetchPolicy: "network-only" });
}

