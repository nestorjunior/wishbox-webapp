import type { User } from "./types";

export function formatBirthday(user: Pick<User, "birthday" | "showBirthYear">) {
  const [y, m, d] = user.birthday.split("-");
  if (!y || !m || !d) return user.birthday;
  return user.showBirthYear === false ? `${d}/${m}` : `${d}/${m}/${y}`;
}

export const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function formatRelativeTime(value: string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSeconds < 60) return "agora mesmo";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `há ${diffDays} d`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const productPhotoKeywords: Record<string, string> = {
  'MacBook Air M2 13"': "macbook,laptop",
  "Relógio Masculino": "wristwatch,watch",
  "Fone Bose QuietComfort": "headphones",
  "Beca de Formatura": "graduation,gown",
  "Câmera Instantânea": "instant,camera",
  "Tênis de Corrida": "running,sneakers",
  "Cafeteira Expresso": "espresso,coffeemachine",
  "Mala de Cabine": "suitcase,luggage",
  "Kit Organizadores": "travel,organizer",
  "Panetone Artesanal": "panettone,cake",
  "Jogo de Panelas": "cookware,pans",
  "Luminária de Chão": "floor,lamp",
  "Poltrona Leo Ebanizado": "armchair,velvet",
  "Kindle Paperwhite": "ereader,kindle",
  "Perfume Importado": "perfume,bottle",
  "Mochila de Viagem": "backpack,travel",
  "Máquina de Waffle": "waffle,maker",
  "Livro de Receitas": "cookbook,book",
  "Vaso de Cerâmica": "ceramic,vase",
  "Tapete Felpudo": "rug,carpet",
};

const hashOf = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) % 99991;
  return h;
};

export function productPhoto(product: { id: string; name: string; image?: string }) {
  if (product.image) return product.image;
  const keyword = productPhotoKeywords[product.name] ?? "gift,present";
  return `https://loremflickr.com/600/600/${keyword}?lock=${hashOf(product.name || product.id)}`;
}
