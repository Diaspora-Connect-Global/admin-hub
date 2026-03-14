export interface NotificationData {
  postId?: string;
  groupId?: string;
  messageId?: string;
  conversationId?: string;
  eventId?: string;
  connectionId?: string;
  entityId?: string;
  entityType?: string;
  [key: string]: unknown;
}

export interface NotificationItemRaw {
  id: string;
  userId?: string;
  recipientId?: string;
  type: string;
  title: string;
  message?: string | null;
  body?: string | null;
  data?: NotificationData | string | null;
  read?: boolean | null;
  isRead?: boolean | null;
  actionUrl?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  text: string;
  isRead: boolean;
  href?: string;
  imageUrl?: string;
  data?: NotificationData;
  createdAt: string;
  readAt?: string;
}

export interface NotificationsWithMeta {
  notifications: NotificationItemRaw[];
  total: number;
  limit: number;
  offset: number;
  unreadCount: number;
}

export interface NotificationMutationResult {
  success: boolean;
  message: string;
}
