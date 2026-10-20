import { useMutation, useQuery } from "@apollo/client/react";
import {
  DELETE_ALL_NOTIFICATIONS,
  DELETE_NOTIFICATION,
  GET_MY_ADMIN_NOTIFICATIONS,
  MARK_MY_ADMIN_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_AS_READ,
} from "@/services/networks/graphql/admin";
import type {
  NotificationMutationResult,
  NotificationsWithMeta,
} from "@/types/notifications";

interface MyAdminNotificationsResponse {
  myAdminNotifications: NotificationsWithMeta;
}

interface MyAdminNotificationsVariables {
  limit?: number;
  offset?: number;
}

/** Notifications directed to platform admins (never the personal inbox). */
export function useMyAdminNotifications(limit = 20, offset = 0, skip = false) {
  return useQuery<MyAdminNotificationsResponse, MyAdminNotificationsVariables>(
    GET_MY_ADMIN_NOTIFICATIONS,
    {
      variables: { limit, offset },
      skip,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );
}

/** Unread count for the same directed set (a one-row page carries it). */
export function useMyAdminUnreadCount(pollIntervalMs = 45000) {
  return useQuery<MyAdminNotificationsResponse, MyAdminNotificationsVariables>(
    GET_MY_ADMIN_NOTIFICATIONS,
    {
      variables: { limit: 1, offset: 0 },
      pollInterval: pollIntervalMs,
      fetchPolicy: "network-only",
      nextFetchPolicy: "cache-first",
    }
  );
}

/** Marks only the directed set read - never the admin's personal rows. */
export function useMarkMyAdminNotificationsRead() {
  return useMutation<{ markMyAdminNotificationsRead: NotificationMutationResult }>(
    MARK_MY_ADMIN_NOTIFICATIONS_READ
  );
}

export function useMarkNotificationAsRead() {
  return useMutation<{ markNotificationAsRead: NotificationMutationResult }, { notificationId: string }>(
    MARK_NOTIFICATION_AS_READ
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
