"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Send,
  Share2,
  X,
} from "lucide-react";
import { tints } from "@/lib/theme";
import type { GiftList } from "@/lib/data";
import { useToast } from "@/components/Toast";

function shareUrlFor(list: GiftList) {
  return `https://wishbox.app/list/${list.id}`;
}

function privacyLabel(privacy: GiftList["privacy"]) {
  return privacy === "public"
    ? "Lista pública"
    : privacy === "private"
      ? "Lista privada"
      : "Lista com convidados";
}

function shareMessage(list: GiftList) {
  return `Dá uma olhada na minha lista "${list.name}" no Wishbox: ${shareUrlFor(list)}`;
}

export function ShareListSheet({
  list,
  visible,
  onClose,
}: {
  list: GiftList;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = shareUrlFor(list);

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareMessage(list))}`,
      "_blank",
    );
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`Minha lista "${list.name}" no Wishbox`);
    const body = encodeURIComponent(shareMessage(list));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const openMore = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareMessage(list) });
      } else {
        await navigator.clipboard.writeText(shareMessage(list));
        showToast({ text: "Link copiado para a área de transferência." });
      }
    } catch {
      // usuário cancelou o compartilhamento nativo
    }
  };

  const openDirect = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // segue mesmo se copiar falhar — a navegação ainda ajuda
    }
    onClose();
    router.push(`/messages?text=${encodeURIComponent(shareMessage(list))}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast({
        text: "Não foi possível copiar. Copie o link manualmente.",
        tone: "warning",
      });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(20,20,28,0.4)]"
      />
      <div className="relative flex w-full flex-col gap-4.5 rounded-t-(--radius-xl) bg-(--color-card) px-5 pt-2.5 pb-7 shadow-[0_-6px_20px_-4px_rgba(27,27,51,0.15)]">
        <div className="mx-auto h-1 w-10 rounded-full bg-(--color-border)" />

        <div className="flex items-center justify-between">
          <p className="flex-1 text-[17px] font-bold text-(--foreground)">
            Compartilhar lista
          </p>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="size-7"
          >
            <X size={18} className="text-(--color-muted)" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex size-11 items-center justify-center rounded-(--radius-md)"
            style={{ backgroundColor: tints[list.tint] ?? tints.lilac }}
          >
            <span className="text-xl">{list.emoji}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-(--foreground)">{list.name}</p>
            <p className="text-xs text-(--color-muted)">
              {privacyLabel(list.privacy)}
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <ShareOption
            icon={<Send size={20} className="text-primary" />}
            iconBg="var(--color-primary-soft)"
            label="Direct"
            description="Enviar no Wishbox"
            onPress={() => void openDirect()}
          />
          <ShareOption
            icon={<MessageCircle size={20} color="#25D366" />}
            iconBg="#DFF7E6"
            label="WhatsApp"
            description="Abrir conversa"
            onPress={openWhatsApp}
          />
          <ShareOption
            icon={<Mail size={20} color="#3B82F6" />}
            iconBg="#DCEAFE"
            label="E-mail"
            description="Enviar por e-mail"
            onPress={openEmail}
          />
          <ShareOption
            icon={<Share2 size={20} color="#F59E0B" />}
            iconBg="#FDECC8"
            label="Mais"
            description="Outros apps"
            onPress={() => void openMore()}
          />
        </div>

        <div className="flex items-center gap-2.5 rounded-(--radius-full,999px) border border-(--color-border) bg-(--background) py-1.5 pr-1.5 pl-4">
          <p className="flex-1 truncate text-xs text-(--color-muted)">{url}</p>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex items-center gap-1.5 rounded-(--radius-full,999px) bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareOption({
  icon,
  iconBg,
  label,
  description,
  onPress,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-[74px] flex-col items-center gap-1.5"
      onClick={onPress}
    >
      <div
        className="flex size-13 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <span className="text-xs font-bold text-(--foreground)">{label}</span>
      <span className="truncate text-[11px] text-(--color-muted)">
        {description}
      </span>
    </button>
  );
}
