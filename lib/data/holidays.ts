import type { Holiday } from "./types";

export const holidays: Holiday[] = [
  { id: "h-namorados", name: "Dia dos Namorados", emoji: "💘", month: 6, day: 12 },
  { id: "h-maes", name: "Dia das Mães", emoji: "💐", month: 5, day: 10 },
  { id: "h-pais", name: "Dia dos Pais", emoji: "🧢", month: 8, day: 9 },
  { id: "h-criancas", name: "Dia das Crianças", emoji: "🧸", month: 10, day: 12 },
  { id: "h-natal", name: "Natal", emoji: "🎄", month: 12, day: 25 },
  { id: "h-ano-novo", name: "Ano Novo", emoji: "🎆", month: 1, day: 1 },
];

export function nextOccurrence(month: number, day: number, from = new Date()) {
  const base = new Date(from.getFullYear(), month - 1, day);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (base < today) base.setFullYear(base.getFullYear() + 1);
  return base;
}

export function daysUntil(date: Date, from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export const formatDayMonth = (date: Date) =>
  date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
