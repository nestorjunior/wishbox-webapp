"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail, MessageCircle, Send, Share2, X } from "lucide-react";
import type { GiftList, Product } from "@/lib/data";
import { tints } from "@/lib/theme";
import { useToast } from "@/components/Toast";

function shareUrlFor(product: Product) {
  return `https://wishbox.app/product/${product.id}`;
}

function shareMessage(product: Product) {
  return `Confira ${product.name} no Wishbox: ${shareUrlFor(product)}`;
}

export function ShareProductSheet({
  product,
  list,
  visible,
  onClose,
}: {
  product: Product;
  list?: GiftList;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = shareUrlFor(product);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast({ text: "Não foi possível copiar. Copie o link manualmente.", tone: "warning" });
    }
  };

  const openDirect = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // A conversa ainda pode ser aberta quando a área de transferência falha.
    }
    onClose();
    router.push(`/messages?text=${encodeURIComponent(shareMessage(product))}`);
  };

  const openMore = async () => {
    try {
      if (navigator.share) await navigator.share({ text: shareMessage(product) });
      else await copyLink();
    } catch {
      // O usuário cancelou o compartilhamento nativo.
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-[rgba(20,20,28,0.4)]" />
      <div className="relative flex w-full flex-col gap-4.5 rounded-t-(--radius-xl) bg-(--color-card) px-5 pt-2.5 pb-7 shadow-sheet">
        <div className="mx-auto h-1 w-10 rounded-full bg-(--color-border)" />
        <div className="flex items-center justify-between">
          <p className="flex-1 text-[17px] font-bold text-(--foreground)">Compartilhar produto</p>
          <button type="button" aria-label="Fechar" onClick={onClose} className="size-7">
            <X size={18} className="text-(--color-muted)" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {product.image ? (
            <Image src={product.image} alt="" width={44} height={44} unoptimized className="size-11 rounded-(--radius-md) object-cover" />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-(--radius-md)" style={{ backgroundColor: tints[product.tint] ?? tints.lilac }}>
              <span className="text-xl">{product.emoji}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-(--foreground)">{product.name}</p>
            <p className="truncate text-xs text-(--color-muted)">{product.store}{list ? ` · ${list.name}` : ""}</p>
          </div>
        </div>

        <div className="flex justify-between">
          <ShareOption icon={<Send size={20} className="text-primary" />} iconBg="var(--color-primary-soft)" label="Direct" description="Enviar no Wishbox" onPress={() => void openDirect()} />
          <ShareOption icon={<MessageCircle size={20} color="#25D366" />} iconBg="#DFF7E6" label="WhatsApp" description="Abrir conversa" onPress={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(product))}`, "_blank")} />
          <ShareOption icon={<Mail size={20} color="#3B82F6" />} iconBg="#DCEAFE" label="E-mail" description="Enviar por e-mail" onPress={() => { window.location.href = `mailto:?subject=${encodeURIComponent(`${product.name} no Wishbox`)}&body=${encodeURIComponent(shareMessage(product))}`; }} />
          <ShareOption icon={<Share2 size={20} color="#F59E0B" />} iconBg="#FDECC8" label="Mais" description="Outros apps" onPress={() => void openMore()} />
        </div>

        <div className="flex items-center gap-2.5 rounded-full border border-(--color-border) bg-(--background) py-1.5 pr-1.5 pl-4">
          <p className="flex-1 truncate text-xs text-(--color-muted)">{url}</p>
          <button type="button" onClick={() => void copyLink()} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white">
            {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareOption({ icon, iconBg, label, description, onPress }: { icon: ReactNode; iconBg: string; label: string; description: string; onPress: () => void }) {
  return (
    <button type="button" className="flex w-[74px] flex-col items-center gap-1.5" onClick={onPress}>
      <div className="flex size-13 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>{icon}</div>
      <span className="text-xs font-bold text-(--foreground)">{label}</span>
      <span className="truncate text-[11px] text-(--color-muted)">{description}</span>
    </button>
  );
}
