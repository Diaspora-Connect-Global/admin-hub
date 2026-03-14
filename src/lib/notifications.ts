import type { AdminNotification, NotificationData, NotificationItemRaw } from "@/types/notifications";

const NOTIFICATION_FALLBACK_ROUTE = "/notifications";

function parseNotificationData(data: NotificationItemRaw["data"]): NotificationData | undefined {
  if (!data) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as NotificationData;
    } catch {
      return undefined;
    }
  }
  return data;
}

function deriveHrefFromData(data?: NotificationData): string | undefined {
  if (!data) return undefined;

  if (typeof data.postId === "string" && data.postId) {
    return `/posts/${data.postId}`;
  }

  if (typeof data.groupId === "string" && data.groupId && typeof data.messageId === "string" && data.messageId) {
    return `/messages/group/${data.groupId}?message=${encodeURIComponent(data.messageId)}`;
  }

  if (typeof data.conversationId === "string" && data.conversationId) {
    return `/messages/${data.conversationId}`;
  }

  if (typeof data.eventId === "string" && data.eventId) {
    return `/events/${data.eventId}`;
  }

  if (typeof data.connectionId === "string" && data.connectionId) {
    return `/connections/requests/${data.connectionId}`;
  }

  if (typeof data.entityId === "string" && data.entityId) {
    if (String(data.entityType || "").toLowerCase() === "association") {
      return `/associations/${data.entityId}`;
    }
    return `/communities/${data.entityId}`;
  }

  return undefined;
}

function deriveHrefFromType(type: string): string | undefined {
  if (type.startsWith("profile.")) return "/profile";
  if (type.startsWith("connection.")) return "/connections";
  if (type.startsWith("message.") || type.startsWith("group.message.")) return "/messages";
  if (type.startsWith("event.")) return "/events";
  if (type.startsWith("membership.")) return "/communities";
  return undefined;
}

function isSafeInternalLink(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.toLowerCase().startsWith("/javascript:");
}

export function adaptNotificationRoute(route: string): string {
  let normalized = route.startsWith("/admin/") ? route.replace(/^\/admin/, "") : route;

  if (normalized.startsWith("/messages")) return normalized.replace(/^\/messages/, "/chats");
  if (normalized.startsWith("/posts")) return normalized.replace(/^\/posts/, "/moderation");
  if (normalized === "/profile") return "/users";
  if (normalized.startsWith("/connections")) return "/users";

  if (normalized.startsWith("/events")) return normalized;
  if (normalized.startsWith("/communities")) return normalized;
  if (normalized.startsWith("/associations")) return normalized;
  if (normalized.startsWith("/notifications")) return normalized;

  normalized = NOTIFICATION_FALLBACK_ROUTE;
  return normalized;
}

export function resolveNotificationHref(notification: NotificationItemRaw): string {
  const data = parseNotificationData(notification.data);
  const rawHref =
    (typeof notification.link === "string" && notification.link) ||
    (typeof notification.actionUrl === "string" && notification.actionUrl) ||
    deriveHrefFromData(data) ||
    deriveHrefFromType(notification.type) ||
    NOTIFICATION_FALLBACK_ROUTE;

  if (!rawHref || !isSafeInternalLink(rawHref)) return NOTIFICATION_FALLBACK_ROUTE;
  return adaptNotificationRoute(rawHref);
}

export function normalizeNotification(notification: NotificationItemRaw): AdminNotification {
  const data = parseNotificationData(notification.data);

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    text: notification.message || notification.body || "",
    isRead: Boolean(notification.read ?? notification.isRead),
    href: resolveNotificationHref(notification),
    imageUrl: notification.imageUrl ?? undefined,
    data,
    createdAt: notification.createdAt,
    readAt: notification.readAt ?? undefined,
  };
}

export function dedupeNotifications(items: AdminNotification[]): AdminNotification[] {
  const map = new Map<string, AdminNotification>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}
