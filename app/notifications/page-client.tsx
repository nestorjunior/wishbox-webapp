"use client";

import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { Avatar, Button, Card, EmptyState } from "@/components/ui";
import { useWishbox } from "@/store/wishbox-store";

export default function NotificationsPage() {
  const { state, userById, readAllNotifications, readNotification, acceptListInvite, declineListInvite } =
    useWishbox();
  const unreadCount = state.notifications.filter((notification) => !notification.read).length;

  if (state.notifications.length === 0) {
    return (
      <Screen>
        <FormHeader />
        <EmptyState emoji="🔔" title="Sem novidades" description="Suas notificações aparecem aqui." />
      </Screen>
    );
  }

  return (
    <Screen>
      <FormHeader />
      <Button
        title={unreadCount > 0 ? `Marcar todas como lidas (${unreadCount})` : "Tudo lido"}
        variant="outline"
        disabled={unreadCount === 0}
        onClick={() => void readAllNotifications()}
      />
      {state.notifications.map((notification) => {
        const author = notification.userId ? userById(notification.userId) : undefined;
        const isListInvite = notification.type === "share" && Boolean(notification.listId);

        return (
          <button
            key={notification.id}
            type="button"
            onClick={() => !notification.read && void readNotification(notification.id)}
            className="w-full text-left"
          >
            <Card
              className={notification.read ? "flex flex-col gap-3 opacity-65" : "flex flex-col gap-3"}
            >
              <div className="flex items-center gap-3">
                <Avatar photo={author?.photo} emoji={author?.emoji ?? "🔔"} tint={author?.tint} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">{notification.text}</p>
                    {!notification.read ? (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{notification.time}</p>
                </div>
              </div>

              {isListInvite ? (
                <div className="flex gap-2">
                  <Button
                    title="Aceitar"
                    className="flex-1"
                    onClick={() =>
                      void acceptListInvite(
                        notification.id,
                        notification.listId!,
                        notification.role ?? "view",
                      )
                    }
                  />
                  <Button
                    title="Recusar"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      void declineListInvite(
                        notification.id,
                        notification.listId!,
                        notification.role ?? "view",
                      )
                    }
                  />
                </div>
              ) : null}
            </Card>
          </button>
        );
      })}
    </Screen>
  );
}
