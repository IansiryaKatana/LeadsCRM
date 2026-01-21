import { useState } from "react";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      setOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "followup_reminder":
      case "followup_overdue":
        return "📞";
      case "new_lead_assigned":
        return "🎯";
      case "lead_converted":
        return "✅";
      case "lead_status_changed":
        return "📊";
      case "exception_requested":
        return "⚠️";
      case "exception_approved":
        return "✓";
      case "exception_rejected":
        return "✗";
      default:
        return "🔔";
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="font-display">Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {unreadNotifications.length > 0 && (
                <div>
                  <div className="px-6 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    Unread
                  </div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onMarkRead={() => markRead.mutate(notification.id)}
                      onDelete={() => deleteNotification.mutate(notification.id)}
                    />
                  ))}
                </div>
              )}

              {readNotifications.length > 0 && (
                <div>
                  <div className="px-6 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    Read
                  </div>
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onMarkRead={() => markRead.mutate(notification.id)}
                      onDelete={() => deleteNotification.mutate(notification.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  onDelete,
}: {
  notification: any;
  onClick: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const content = notification.link ? (
    <Link to={notification.link} onClick={onClick} className="block">
      <NotificationContent notification={notification} />
    </Link>
  ) : (
    <div onClick={onClick}>
      <NotificationContent notification={notification} />
    </div>
  );

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/50 transition-colors relative group",
        !notification.read && "bg-primary/5"
      )}
    >
      {content}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function NotificationContent({ notification }: { notification: any }) {
  return (
    <div className="pr-12">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-1">{getNotificationIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "followup_reminder":
    case "followup_overdue":
      return "📞";
    case "new_lead_assigned":
      return "🎯";
    case "lead_converted":
      return "✅";
    case "lead_status_changed":
      return "📊";
    case "exception_requested":
      return "⚠️";
    case "exception_approved":
      return "✓";
    case "exception_rejected":
      return "✗";
    default:
      return "🔔";
  }
}

