"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ellipsis,
  Heart,
  Lock,
  MessageCircle,
  PauseCircle,
  Send,
  Share2,
  Users,
  X,
} from "lucide-react";
import { brl, tints } from "@/lib/theme";
import type { GiftList, Product } from "@/lib/data";
import { Avatar, Field } from "@/components/ui";
import { ListActionsSheet } from "@/components/ListActionsSheet";
import {
  ProductActionsSheet,
  ReportProductSheet,
} from "@/components/ProductActionsSheet";
import { useWishbox } from "@/store/wishbox-store";
import { useToast } from "@/components/Toast";
import { auth } from "@/lib/firebase";
import {
  ApiError,
  createItemComment,
  createNotification,
  fetchItemComments,
  likeItem,
  unlikeItem,
} from "@/lib/api";

function PrivacyBadge({ privacy }: { privacy: GiftList["privacy"] }) {
  if (privacy === "public") return null;
  return (
    <span className="flex items-center gap-1 rounded-(--radius-full,999px) border border-(--color-border) bg-(--background) px-2 py-0.5 text-[10px] font-semibold text-(--color-muted)">
      {privacy === "private" ? <Lock size={11} /> : <Users size={11} />}
      {privacy === "private" ? "Privada" : "Convidados"}
    </span>
  );
}

export function ListCard({
  list,
  count,
  editable = false,
}: {
  list: GiftList;
  count: number;
  editable?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div
        className={`relative flex h-[114px] flex-col items-center rounded-[14px] border border-border bg-card p-3 shadow-[0_5px_14px_-4px_rgba(27,27,51,0.06)] ${
          list.paused ? "opacity-50" : ""
        }`}
      >
        <Link
          href={`/list/${list.id}`}
          className="absolute inset-0"
          aria-label={`${list.name}, ${count} ${
            count === 1 ? "item" : "itens"
          }`}
        />

        <div className="z-10 flex min-h-[18px] w-full items-start justify-between">
          <div className="flex flex-wrap items-center gap-1">
            <PrivacyBadge privacy={list.privacy} />

            {list.paused ? (
              <span className="flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                <PauseCircle size={10} />
                Pausada
              </span>
            ) : null}
          </div>

          {editable ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setMenuOpen(true);
              }}
              aria-label={`Ações da lista ${list.name}`}
              className="z-10 flex size-5 items-center justify-center rounded-full bg-background"
            >
              <Ellipsis size={15} className="text-muted" />
            </button>
          ) : null}
        </div>

        <div
          className="mt-1 flex size-[48px] items-center justify-center rounded-[10px]"
          style={{
            backgroundColor: tints[list.tint] ?? tints.lilac,
          }}
        >
          <span className="text-[22px]">{list.emoji}</span>
        </div>

        <p className="mt-1.5 w-full truncate text-center text-[13px] font-bold text-foreground">
          {list.name}
        </p>
      </div>

      {editable ? (
        <ListActionsSheet
          list={list}
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </>
  );
}

export function ProductCard({
  product,
  ownerPhoto,
  onPress,
  showActions = false,
  onReserve,
  onUnreserve,
  onCopy,
  onReport,
  onEdit,
  onTogglePause,
  onDelete,
  isReservedByMe = false,
}: {
  product: Product;
  ownerPhoto?: string;
  onPress?: () => void;
  showActions?: boolean;
  onReserve?: () => void;
  onUnreserve?: () => void;
  onCopy?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
  onTogglePause?: () => void;
  onDelete?: () => void;
  isReservedByMe?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { backendUser, dispatch, listById, me } = useWishbox();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [savingInteraction, setSavingInteraction] = useState(false);

  const notifyOwner = async (type: "like" | "comment", content: string) => {
    const ownerId = listById(product.listId)?.ownerId;
    const firebaseUser = auth?.currentUser;
    if (!ownerId || ownerId === backendUser?.id || !firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      await createNotification(token, {
        recipientId: ownerId,
        actorId: backendUser?.id,
        type,
        entityType: "item",
        entityId: product.id,
        content,
      });
    } catch {
      // Interactions remain available when notification delivery is unavailable.
    }
  };

  const loadComments = async () => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetchItemComments(token, product.id);
      dispatch({
        type: "product/update",
        id: product.id,
        patch: {
          comments: response.data.map((item) => ({
            id: item.id,
            userId: item.userId,
            text: item.content,
            likes: 0,
            liked: false,
            createdAt: item.createdAt,
            parentId: item.parentId,
          })),
        },
      });
    } catch {
      showToast({
        text: "Não foi possível carregar os comentários.",
        tone: "warning",
      });
    }
  };

  const handleLike = async () => {
    if (savingInteraction || !backendUser) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({
        text: "Sessão expirada. Faça login novamente.",
        tone: "warning",
      });
      return;
    }

    const isLiking = !product.liked;
    try {
      setSavingInteraction(true);
      const token = await firebaseUser.getIdToken();
      if (isLiking) await likeItem(token, product.id);
      else await unlikeItem(token, product.id);

      dispatch({ type: "product/like", id: product.id });
      if (isLiking)
        await notifyOwner("like", `Curtiu seu produto: ${product.name}`);
    } catch (error) {
      if (isLiking && error instanceof ApiError && error.status === 409) {
        dispatch({ type: "product/like", id: product.id });
        return;
      }
      showToast({
        text: "Não foi possível atualizar a curtida.",
        tone: "warning",
      });
    } finally {
      setSavingInteraction(false);
    }
  };

  const submitComment = async () => {
    const text = comment.trim();
    if (!text || !backendUser || savingInteraction) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({
        text: "Sessão expirada. Faça login novamente.",
        tone: "warning",
      });
      return;
    }

    try {
      setSavingInteraction(true);
      const token = await firebaseUser.getIdToken();
      const created = await createItemComment(token, product.id, {
        content: text,
      });
      dispatch({
        type: "product/comment",
        id: product.id,
        comment: {
          id: created.id,
          userId: created.userId,
          text: created.content,
          likes: 0,
          liked: false,
          createdAt: created.createdAt,
          parentId: created.parentId,
        },
      });
      setComment("");
      await notifyOwner("comment", `Comentou no seu produto: ${product.name}`);
    } catch {
      showToast({
        text: "Não foi possível enviar o comentário.",
        tone: "warning",
      });
    } finally {
      setSavingInteraction(false);
    }
  };

  const shareProduct = async () => {
    const message = `Confira ${product.name} no Wishbox: wishbox.app/product/${product.id}`;
    try {
      if (navigator.share) await navigator.share({ text: message });
      else {
        await navigator.clipboard.writeText(message);
        showToast({ text: "Link copiado para a área de transferência." });
      }
    } catch {
      // usuário cancelou o compartilhamento nativo
    }
  };

  return (
    <>
      <div
        className={`relative flex flex-col overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-card) shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)] ${
          product.paused ? "opacity-50" : ""
        }`}
      >
        <button
          type="button"
          onClick={onPress ?? (() => router.push(`/product/${product.id}`))}
          className="absolute inset-0 z-0"
          aria-label={product.name}
        />

        <div className="relative aspect-square w-full">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              className="bg-(--color-border) object-cover"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ backgroundColor: tints[product.tint] }}
            >
              <span className="text-3xl">{product.emoji}</span>
            </div>
          )}

          {product.reservedBy ? (
            <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-(--radius-full,999px) bg-black/70 px-2 py-1 text-[11px] font-bold text-white">
              <Lock size={11} />
              Reservado
            </span>
          ) : null}

          {product.paused ? (
            <span
              className={`absolute z-10 flex items-center gap-1 rounded-(--radius-full,999px) bg-black/70 px-2 py-1 text-[11px] font-bold text-white ${
                product.reservedBy ? "top-9" : "top-2"
              } left-2`}
            >
              <PauseCircle size={11} />
              Pausado
            </span>
          ) : null}

          {showActions ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(true);
              }}
              className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-(--background)"
            >
              <Ellipsis size={18} className="text-(--foreground)" />
            </button>
          ) : null}
        </div>

        <div className="relative z-10 flex flex-col gap-1 p-3">
          <p className="truncate text-xs text-(--color-muted)">
            {product.store}
          </p>
          <p className="line-clamp-2 text-sm font-bold text-(--foreground)">
            {product.name}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">
              {brl(product.price)}
            </span>
            {ownerPhoto ? <Avatar photo={ownerPhoto} size={20} /> : null}
          </div>

          <div className="mt-1 flex items-center gap-4 border-t border-(--color-border) pt-2">
            <button
              type="button"
              aria-label="Curtir produto"
              onClick={(event) => {
                event.stopPropagation();
                void handleLike();
              }}
              className="flex items-center gap-1"
            >
              <Heart
                size={18}
                className={
                  product.liked ? "text-primary" : "text-(--color-muted)"
                }
                fill={product.liked ? "var(--color-primary)" : "transparent"}
              />
              <span className="text-xs text-(--color-muted)">
                {product.likes}
              </span>
            </button>

            <button
              type="button"
              aria-label="Ver comentários"
              onClick={(event) => {
                event.stopPropagation();
                setCommentsOpen(true);
                void loadComments();
              }}
              className="flex items-center gap-1"
            >
              <MessageCircle size={18} className="text-(--color-muted)" />
              <span className="text-xs text-(--color-muted)">
                {product.comments.length}
              </span>
            </button>

            <button
              type="button"
              aria-label="Compartilhar produto"
              onClick={(event) => {
                event.stopPropagation();
                void shareProduct();
              }}
            >
              <Share2 size={18} className="text-(--color-muted)" />
            </button>
          </div>
        </div>
      </div>

      {showActions ? (
        <>
          <ProductActionsSheet
            product={product}
            visible={menuOpen}
            onClose={() => setMenuOpen(false)}
            onReserve={() => onReserve?.()}
            onUnreserve={() => onUnreserve?.()}
            onCopy={() => onCopy?.()}
            onReport={() => {
              setMenuOpen(false);
              setReportOpen(true);
              onReport?.();
            }}
            onEdit={onEdit}
            onTogglePause={onTogglePause}
            onDelete={onDelete}
            isReservedByMe={isReservedByMe}
          />

          <ReportProductSheet
            product={product}
            visible={reportOpen}
            onClose={() => setReportOpen(false)}
            onSubmit={({ reason, detail }) => {
              showToast({
                text: `Denúncia registrada com o motivo: ${reason}.${detail ? ` Detalhes: ${detail}` : ""}`,
              });
            }}
          />
        </>
      ) : null}

      {commentsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end">
          <button
            type="button"
            aria-label="Fechar comentários"
            onClick={() => setCommentsOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative flex max-h-[80vh] w-full flex-col rounded-t-(--radius-xl) bg-(--color-card) px-5 pt-2.5 pb-5 shadow-[0_-6px_20px_-4px_rgba(27,27,51,0.15)]">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-(--color-border)" />
            <button
              type="button"
              aria-label="Fechar comentários"
              onClick={() => setCommentsOpen(false)}
              className="absolute top-3 right-4"
            >
              <X size={20} className="text-(--color-muted)" />
            </button>
            <p className="mb-3 text-center text-sm font-bold text-(--foreground)">
              {product.comments.length}{" "}
              {product.comments.length === 1 ? "comentário" : "comentários"}
            </p>
            <div className="mb-3 flex items-center gap-3">
              {product.image ? (
                <Image
                  src={product.image}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="rounded-(--radius-sm) object-cover"
                />
              ) : null}
              <div className="flex-1">
                <p className="line-clamp-2 text-sm font-bold text-(--foreground)">
                  {product.name}
                </p>
                <p className="text-xs text-primary">{product.store}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto">
              {product.comments.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <Avatar emoji="👤" size={32} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-(--foreground)">
                      {item.userId === backendUser?.id
                        ? (me?.name ?? "Você")
                        : "Usuário"}
                    </p>
                    <p className="text-sm text-(--foreground)">{item.text}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Curtir comentário"
                    onClick={() =>
                      dispatch({
                        type: "product/comment-like",
                        productId: product.id,
                        commentId: item.id,
                      })
                    }
                    className="flex items-center gap-1"
                  >
                    <Heart
                      size={18}
                      className={
                        item.liked ? "text-primary" : "text-(--color-muted)"
                      }
                      fill={item.liked ? "var(--color-primary)" : "transparent"}
                    />
                    {item.likes > 0 ? (
                      <span className="text-xs text-(--color-muted)">
                        {item.likes}
                      </span>
                    ) : null}
                  </button>
                </div>
              ))}
              {product.comments.length === 0 ? (
                <p className="text-sm text-(--color-muted)">
                  Ainda não há comentários. Seja a primeira pessoa a comentar.
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-2.5 border-t border-(--color-border) pt-3">
              <Avatar
                photo={me?.photo}
                emoji={me?.emoji ?? "👤"}
                tint={me?.tint ?? "lilac"}
                size={34}
              />
              <Field
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1"
              />
              <button
                type="button"
                aria-label="Enviar comentário"
                onClick={() => void submitComment()}
                disabled={savingInteraction}
                className="flex size-11 items-center justify-center rounded-full bg-primary disabled:opacity-60"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
