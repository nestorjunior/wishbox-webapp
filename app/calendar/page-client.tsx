"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { Avatar, EmptyState } from "@/components/ui";
import { backendUserToLocalUser } from "@/lib/backend-user";
import { auth } from "@/lib/firebase";
import { ApiError, fetchUpcomingCalendarEvents, type BackendCalendarEvent } from "@/lib/api";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function formatDate(value: string) {
  return parseDate(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export default function CalendarPage() {
  const [events, setEvents] = useState<BackendCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser) {
        if (active) {
          setError("Sessão indisponível para carregar o calendário.");
          setLoading(false);
        }
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetchUpcomingCalendarEvents(token, 366);
        if (active) setEvents(response.data);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Não foi possível carregar o calendário.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, BackendCalendarEvent[]>();
    events.forEach((event) => map.set(event.date, [...(map.get(event.date) ?? []), event]));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <Screen header>
      <FormHeader />

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : error ? (
        <EmptyState emoji="⚠️" title="Não foi possível carregar" description={error} />
      ) : eventsByDate.length === 0 ? (
        <EmptyState emoji="📅" title="Nenhuma data por vir" />
      ) : (
        <div className="flex flex-col gap-4">
          {eventsByDate.map(([date, dayEvents]) => (
            <section key={date} className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted">
                <CalendarDays size={14} /> {formatDate(date)}
              </p>
              {dayEvents.map((event, index) => {
                const user = event.user ? backendUserToLocalUser(event.user) : undefined;
                return (
                  <div
                    key={`${date}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]"
                  >
                    {user ? (
                      <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} />
                    ) : (
                      <span className="text-2xl">🎉</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{event.label}</p>
                      <p className="text-xs text-muted">
                        {event.daysUntil === 0 ? "Hoje" : `Em ${event.daysUntil} dias`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </Screen>
  );
}
