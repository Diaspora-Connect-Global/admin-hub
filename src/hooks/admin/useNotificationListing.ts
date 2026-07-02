import { useQuery, useMutation } from "@apollo/client/react";
import {
  LIST_PUSH_NOTIFICATIONS,
  LIST_IN_APP_NOTIFICATIONS,
  LIST_NOTIFICATION_TEMPLATES,
  GET_NOTIFICATION_ANALYTICS,
  CREATE_IN_APP_NOTIFICATION,
  CREATE_NOTIFICATION_TEMPLATE,
  type AdminPushNotificationListResponse,
  type AdminInAppNotificationListResponse,
  type AdminNotificationTemplateListResponse,
  type AdminInAppNotificationItem,
  type AdminNotificationTemplateItem,
  type NotificationAnalyticsData,
  type CreateInAppNotificationInput,
  type CreateNotificationTemplateInput,
} from "@/services/networks/graphql/admin";

export type { CreateInAppNotificationInput, CreateNotificationTemplateInput };

// ─── Push Notifications ────────────────────────────────────────────────────

interface ListPushNotificationsFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

interface ListPushNotificationsResponse {
  listPushNotifications: AdminPushNotificationListResponse;
}

export function useListPushNotifications(
  filters: ListPushNotificationsFilters = {},
) {
  return useQuery<ListPushNotificationsResponse>(LIST_PUSH_NOTIFICATIONS, {
    variables: {
      filters: {
        status: filters.status ?? undefined,
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
      },
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
}

// ─── In-App Notifications ──────────────────────────────────────────────────

interface ListInAppNotificationsFilters {
  priority?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

interface ListInAppNotificationsResponse {
  listInAppNotifications: AdminInAppNotificationListResponse;
}

export function useListInAppNotifications(
  filters: ListInAppNotificationsFilters = {},
) {
  return useQuery<ListInAppNotificationsResponse>(LIST_IN_APP_NOTIFICATIONS, {
    variables: {
      filters: {
        priority: filters.priority ?? undefined,
        active: filters.active ?? undefined,
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
      },
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
}

// ─── Notification Templates ────────────────────────────────────────────────

interface ListNotificationTemplatesFilters {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface ListNotificationTemplatesResponse {
  listNotificationTemplates: AdminNotificationTemplateListResponse;
}

export function useListNotificationTemplates(
  filters: ListNotificationTemplatesFilters = {},
) {
  return useQuery<ListNotificationTemplatesResponse>(
    LIST_NOTIFICATION_TEMPLATES,
    {
      variables: {
        filters: {
          type: filters.type ?? undefined,
          status: filters.status ?? undefined,
          limit: filters.limit ?? 20,
          offset: filters.offset ?? 0,
        },
      },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );
}

// ─── Notification Analytics ────────────────────────────────────────────────

interface GetNotificationAnalyticsResponse {
  getNotificationAnalytics: NotificationAnalyticsData;
}

export function useGetNotificationAnalytics(period = "last_7_days") {
  return useQuery<GetNotificationAnalyticsResponse>(
    GET_NOTIFICATION_ANALYTICS,
    {
      variables: { period },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );
}

// ─── Create In-App Notification ────────────────────────────────────────────

interface CreateInAppNotificationResponse {
  createInAppNotification: AdminInAppNotificationItem;
}

export function useCreateInAppNotification() {
  return useMutation<
    CreateInAppNotificationResponse,
    { input: CreateInAppNotificationInput }
  >(CREATE_IN_APP_NOTIFICATION);
}

// ─── Create Notification Template ──────────────────────────────────────────

interface CreateNotificationTemplateResponse {
  createNotificationTemplate: AdminNotificationTemplateItem;
}

export function useCreateNotificationTemplate() {
  return useMutation<
    CreateNotificationTemplateResponse,
    { input: CreateNotificationTemplateInput }
  >(CREATE_NOTIFICATION_TEMPLATE);
}
