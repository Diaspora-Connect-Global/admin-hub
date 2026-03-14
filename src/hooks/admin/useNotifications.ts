import { useMutation, useQuery } from "@apollo/client/react";
import {
  DELETE_ALL_NOTIFICATIONS,
  DELETE_NOTIFICATION,
  GET_NOTIFICATIONS_WITH_META,
  GET_UNREAD_NOTIFICATION_COUNT,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  MARK_NOTIFICATION_AS_READ,
} from "@/services/networks/graphql/admin";
import type {
  NotificationMutationResult,
  NotificationsWithMeta,
} from "@/types/notifications";

interface GetNotificationsWithMetaResponse {
  getNotificationsWithMeta: NotificationsWithMeta;
}

interface GetNotificationsWithMetaVariables {
  limit?: number;
  offset?: number;
}

interface GetUnreadNotificationCountResponse {
  getUnreadNotificationCount: {
    count: number;
  };
}

export function useNotificationsWithMeta(limit = 20, offset = 0, skip = false) {
  return useQuery<GetNotificationsWithMetaResponse, GetNotificationsWithMetaVariables>(
    GET_NOTIFICATIONS_WITH_META,
    {
      variables: { limit, offset },
      skip,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );
}

export function useUnreadNotificationCount(pollIntervalMs = 45000) {
  return useQuery<GetUnreadNotificationCountResponse>(GET_UNREAD_NOTIFICATION_COUNT, {
    pollInterval: pollIntervalMs,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });
}

export function useMarkNotificationAsRead() {
  return useMutation<{ markNotificationAsRead: NotificationMutationResult }, { notificationId: string }>(
    MARK_NOTIFICATION_AS_READ
  );
}

export function useMarkAllNotificationsAsRead() {
  return useMutation<{ markAllNotificationsAsRead: NotificationMutationResult }>(
    MARK_ALL_NOTIFICATIONS_AS_READ
  );
}

export function useDeleteNotification() {
  return useMutation<{ deleteNotification: NotificationMutationResult }, { notificationId: string }>(
    DELETE_NOTIFICATION
  );
}

export function useDeleteAllNotifications() {
  return useMutation<{ deleteAllNotifications: NotificationMutationResult }>(
    DELETE_ALL_NOTIFICATIONS
  );
}
