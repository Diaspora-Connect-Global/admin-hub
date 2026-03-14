import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Bell, CheckCheck, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationsWithMeta,
  useUnreadNotificationCount,
} from "@/hooks/admin/useNotifications";
import { dedupeNotifications, normalizeNotification } from "@/lib/notifications";
import type { AdminNotification } from "@/types/notifications";

const PAGE_SIZE = 20;

export function AdminNotificationBell() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: unreadData, refetch: refetchUnreadCount } = useUnreadNotificationCount(45000);
  const {
    data: notificationData,
    loading: listLoading,
    error: listError,
    refetch: refetchNotifications,
  } = useNotificationsWithMeta(PAGE_SIZE, offset, !isOpen);

  const [markNotificationAsRead, { loading: markOneLoading }] = useMarkNotificationAsRead();
  const [markAllNotificationsAsRead, { loading: markAllLoading }] = useMarkAllNotificationsAsRead();
  const [deleteNotification, { loading: deleteOneLoading }] = useDeleteNotification();
  const [deleteAllNotifications, { loading: deleteAllLoading }] = useDeleteAllNotifications();

  useEffect(() => {
    const count = unreadData?.getUnreadNotificationCount?.count;
    if (typeof count === "number") {
      setUnreadCount(count);
    }
  }, [unreadData]);

  useEffect(() => {
    const payload = notificationData?.getNotificationsWithMeta;
    if (!payload) return;

    const incoming = payload.notifications.map(normalizeNotification);

    setNotifications((previous) => {
      if (offset === 0) return dedupeNotifications(incoming);
      return dedupeNotifications([...previous, ...incoming]);
    });

    setTotal(payload.total ?? 0);
    setUnreadCount(payload.unreadCount ?? 0);
    setLastSyncedAt(new Date());
  }, [notificationData, offset]);

  useEffect(() => {
    if (isOpen) {
      setOffset(0);
    }
  }, [isOpen]);

  const hasNextPage = useMemo(
    () => offset + notifications.length < total,
    [notifications.length, offset, total]
  );

  const isMutating = markOneLoading || markAllLoading || deleteOneLoading || deleteAllLoading;

  async function refreshNow() {
    try {
      setOffset(0);
      await refetchNotifications({ limit: PAGE_SIZE, offset: 0 });
      await refetchUnreadCount();
      setLastSyncedAt(new Date());
    } catch {
      toast({
        title: "Refresh failed",
        description: "Could not refresh notifications. Showing cached data.",
        variant: "destructive",
      });
    }
  }

  async function onMarkSingleAsRead(notificationId: string) {
    const target = notifications.find((item) => item.id === notificationId);
    if (!target || target.isRead) return;

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              isRead: true,
              readAt: item.readAt ?? new Date().toISOString(),
            }
          : item
      )
    );
    setUnreadCount((previous) => Math.max(previous - 1, 0));

    try {
      await markNotificationAsRead({ variables: { notificationId } });
      await refetchUnreadCount();
    } catch {
      toast({
        title: "Sync warning",
        description: "Could not mark notification as read. Count will resync soon.",
      });
    }
  }

  async function onOpenNotification(notification: AdminNotification) {
    if (!notification.isRead) {
      void onMarkSingleAsRead(notification.id);
    }

    setIsOpen(false);
    navigate(notification.href || "/notifications");
  }

  async function onMarkAllAsRead() {
    const hadUnread = notifications.some((item) => !item.isRead);
    if (!hadUnread) return;

    const now = new Date().toISOString();
    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? now,
      }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
      await refetchUnreadCount();
    } catch {
      toast({
        title: "Sync warning",
        description: "Could not mark all as read. Count will resync soon.",
      });
    }
  }

  async function onDeleteSingle(notificationId: string) {
    const target = notifications.find((item) => item.id === notificationId);

    setNotifications((previous) => previous.filter((item) => item.id !== notificationId));
    setTotal((previous) => Math.max(previous - 1, 0));
    if (target && !target.isRead) {
      setUnreadCount((previous) => Math.max(previous - 1, 0));
    }

    try {
      await deleteNotification({ variables: { notificationId } });
      await refetchUnreadCount();
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete notification. Data will resync shortly.",
        variant: "destructive",
      });
    }
  }

  async function onDeleteAll() {
    if (!notifications.length) return;

    const confirmed = window.confirm("Delete all notifications? This action cannot be undone.");
    if (!confirmed) return;

    setNotifications([]);
    setTotal(0);
    setUnreadCount(0);

    try {
      await deleteAllNotifications();
      await refetchUnreadCount();
      setLastSyncedAt(new Date());
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not clear notifications. Data will resync shortly.",
        variant: "destructive",
      });
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ", no unread notifications"}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-[10px] font-semibold text-white flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[420px] p-0" align="end">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {lastSyncedAt
                ? `Last synced ${formatDistanceToNowStrict(lastSyncedAt, { addSuffix: true })}`
                : "Not synced yet"}
            </p>
          </div>
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </div>

        <Separator />

        <div className="px-2 py-2 flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={onMarkAllAsRead} disabled={isMutating || unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={onDeleteAll} disabled={isMutating || notifications.length === 0}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear all
          </Button>
          <Button variant="ghost" size="sm" className="h-8 ml-auto" onClick={refreshNow} disabled={listLoading}>
            {listLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh notifications</span>
          </Button>
        </div>

        <Separator />

        <ScrollArea className="h-[420px]">
          {listError ? (
            <div className="p-4 text-sm text-destructive">Unable to load notifications. Try refreshing.</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              <p>No notifications yet.</p>
              {lastSyncedAt && (
                <p className="mt-1 text-xs">Last checked {formatDistanceToNowStrict(lastSyncedAt, { addSuffix: true })}.</p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <div className="px-4 py-3 flex gap-3">
                    <button
                      type="button"
                      className="text-left flex-1 min-w-0"
                      onClick={() => onOpenNotification(notification)}
                    >
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${notification.isRead ? "font-normal text-muted-foreground" : "font-semibold"}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {notification.isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                      {notification.text && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.text}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2" aria-label={`Created ${new Date(notification.createdAt).toLocaleString()}`}>
                        {formatDistanceToNowStrict(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </button>
                    <div className="flex items-start gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onMarkSingleAsRead(notification.id)}
                          aria-label="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDeleteSingle(notification.id)}
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {hasNextPage && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setOffset((previous) => previous + PAGE_SIZE)}
                disabled={listLoading}
              >
                {listLoading ? "Loading..." : "Load more"}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
