import type { Notification } from "@/lib/data/types";
import { formatRelativeTime } from "@/lib/data/utils";
import type { BackendNotification } from "@/lib/api";

function notificationText(
  notification: BackendNotification,
  actorName?: string,
  isFollowRequest = false
) {
  if (notification.content?.trim()) return notification.content;

  const name = actorName ?? "Alguém";

  switch (notification.type) {
    case "follow":
      return isFollowRequest
        ? `${name} está solicitando para te seguir`
        : `${name} começou a seguir você`;
    case "comment":
      return `${name} comentou em um item seu`;
    case "like":
      return `${name} curtiu um item seu`;
    case "reservation":
      return `${name} reservou um item seu`;
    case "message":
      return `${name} enviou uma mensagem`;
    case "share":
      return `${name} convidou você para uma lista`;
    case "calendar_reminder":
      return `Lembrete de calendário para hoje`;
    default:
      return "Você tem uma nova notificação";
  }
}

function notificationType(notification: BackendNotification): Notification["type"] {
  if (notification.type === "reservation") return "reservation";
  if (notification.type === "calendar_reminder") return "calendar_reminder";
  if (notification.type === "share") return "share";
  return notification.type;
}

export function backendNotificationToLocalNotification(
  notification: BackendNotification,
  actorName?: string,
  isFollowRequest = false
): Notification {
  return {
    id: notification.id,
    type: notificationType(notification),
    userId: notification.actorId,
    listId: notification.entityId,
    role: notification.role,
    text: notificationText(notification, actorName, isFollowRequest),
    time: formatRelativeTime(notification.createdAt),
    read: Boolean(notification.readAt),
  };
}
