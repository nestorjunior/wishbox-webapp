"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Ellipsis, Heart, MessageCircle, PauseCircle, Send, Share2, Trash2 } from "lucide-react";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { formatRelativeTime } from "@/lib/data/utils";
import { brl, tints } from "@/lib/theme";
import { auth } from "@/lib/firebase";
import {
  ApiError,
  createItemComment,
  createNotification,
  deleteItem,
  likeItem,
  unlikeItem,
  updateItem,
} from "@/lib/api";
import { useWishbox } from "@/store/wishbox-store";

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const { productById, listById, userById, dispatch, me, backendUser } = useWishbox();
  const { showToast } = useToast();
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const product = productById(String(productId));

  if (!product) {
    return (
      <Screen>
        <FormHeader />
        <EmptyState emoji="🤔" title="Produto não encontrado" />
      </Screen>
    );
  }

  const list = listById(product.listId);
  const listOwner = list ? userById(list.ownerId) : undefined;
  const isOwner = Boolean(backendUser && list?.ownerId === backendUser.id);
  const reservedByMe = Boolean(backendUser && product.reservedBy === backendUser.id);

  const withApiError = (title: string, error: unknown) => {
    const message =
      error instanceof ApiError
        ? `${title}: ${error.message} (status ${error.status})`
        : `${title}: não foi possível completar a operação agora.`;
    showToast({ text: message, tone: "warning" });
  };

  const notifyOwner = async (type: "like" | "comment", content: string) => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || !backendUser || !list || list.ownerId === backendUser.id) return;
    try {
      const token = await firebaseUser.getIdToken();
      await createNotification(token, {
        recipientId: list.ownerId,
        actorId: backendUser.id,
        type,
        entityType: "item",
        entityId: product.id,
        content,
      });
    } catch {
      // Interações continuam disponíveis mesmo se a notificação falhar.
    }
  };

  const toggleLike = async () => {
    if (busy || !backendUser) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }

    const isLiking = !product.liked;
    try {
      setBusy(true);
      const token = await firebaseUser.getIdToken();
      if (isLiking) await likeItem(token, product.id);
      else await unlikeItem(token, product.id);
      dispatch({ type: "product/like", id: product.id });
      if (isLiking) await notifyOwner("like", `Curtiu seu produto: ${product.name}`);
    } catch (error) {
      if (isLiking && error instanceof ApiError && error.status === 409) {
        dispatch({ type: "product/like", id: product.id });
        return;
      }
      withApiError("Não foi possível atualizar a curtida", error);
    } finally {
      setBusy(false);
    }
  };

  const reserve = () => {
    if (!backendUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }
    if (product.reservedBy && product.reservedBy !== backendUser.id) {
      showToast({ text: "Esse presente já foi reservado por outra pessoa", tone: "warning" });
      return;
    }
    dispatch({ type: "product/reserve", id: product.id });
    showToast({ text: "Presente reservado" });
  };

  const unreserve = () => {
    dispatch({ type: "product/unreserve", id: product.id });
    showToast({ text: "Reserva desfeita" });
  };

  const sendComment = async () => {
    const text = comment.trim();
    if (!text || !backendUser || busy) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }

    try {
      setBusy(true);
      const token = await firebaseUser.getIdToken();
      const created = await createItemComment(token, product.id, { content: text });
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
    } catch (error) {
      withApiError("Não foi possível enviar o comentário", error);
    } finally {
      setBusy(false);
    }
  };

  const togglePause = async () => {
    if (saving) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }
    try {
      setSaving(true);
      const nextPaused = !product.paused;
      const token = await firebaseUser.getIdToken();
      await updateItem(token, product.id, { status: nextPaused ? "ARCHIVED" : "ACTIVE" });
      dispatch({ type: "product/update", id: product.id, patch: { paused: nextPaused } });
      showToast({ text: nextPaused ? "Produto pausado" : "Produto retomado" });
      setMenuOpen(false);
    } catch (error) {
      withApiError("Erro ao editar produto", error);
    } finally {
      setSaving(false);
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
    } finally {
      setMenuOpen(false);
    }
  };

  const removeProduct = async () => {
    if (saving) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }
    try {
      setSaving(true);
      const token = await firebaseUser.getIdToken();
      await deleteItem(token, product.id);
      dispatch({ type: "product/delete", id: product.id });
      router.back();
    } catch (error) {
      withApiError("Erro ao excluir produto", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <FormHeader />

      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div
            className="flex size-full items-center justify-center"
            style={{ backgroundColor: tints[product.tint] ?? tints.lilac }}
          >
            <span className="text-6xl">{product.emoji}</span>
          </div>
        )}
        {isOwner ? (
          <button
            type="button"
            aria-label="Opções do produto"
            onClick={() => setMenuOpen((open) => !open)}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-card"
          >
            <Ellipsis size={19} className="text-foreground" />
          </button>
        ) : null}
      </div>

      {isOwner && menuOpen ? (
        <div className="flex gap-2">
          <Button
            title={product.paused ? "Retomar" : "Pausar"}
            icon={<PauseCircle size={16} />}
            variant="outline"
            loading={saving}
            onClick={() => void togglePause()}
          />
          <Button
            title="Excluir"
            icon={<Trash2 size={16} />}
            variant="danger"
            loading={saving}
            onClick={() => void removeProduct()}
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Avatar
          photo={isOwner ? me?.photo : listOwner?.photo}
          emoji={isOwner ? (me?.emoji ?? "👤") : (listOwner?.emoji ?? "🎁")}
          tint={isOwner ? me?.tint : listOwner?.tint}
          size={36}
        />
        <p className="text-xs text-muted">{list?.name}</p>
      </div>

      <p className="text-xs font-semibold text-primary">{product.store || "Produto"}</p>
      <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
      <p className="text-2xl font-extrabold text-primary">{brl(product.price)}</p>
      {product.detail ? (
        <p className="text-sm leading-6 text-muted">{product.detail}</p>
      ) : null}

      <div className="flex gap-2">
        <Button
          title={product.liked ? "Curtido" : "Curtir"}
          icon={<Heart size={16} fill={product.liked ? "currentColor" : "none"} />}
          variant={product.liked ? "primary" : "outline"}
          loading={busy}
          onClick={() => void toggleLike()}
        />
        <Button
          title="Compartilhar"
          icon={<Share2 size={16} />}
          variant="outline"
          onClick={() => void shareProduct()}
        />
      </div>

      {!isOwner ? (
        reservedByMe ? (
          <Button title="Cancelar reserva" variant="outline" onClick={unreserve} className="w-full" />
        ) : (
          <Button
            title={product.reservedBy ? "Já reservado" : "Reservar presente"}
            disabled={Boolean(product.reservedBy)}
            onClick={reserve}
            className="w-full"
          />
        )
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MessageCircle size={16} /> Comentários ({product.comments.length})
        </h2>
        {product.comments.map((item) => {
          const author = userById(item.userId);
          return (
            <div key={item.id} className="flex gap-2.5">
              <Avatar photo={author?.photo} emoji={author?.emoji} tint={author?.tint} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">{author?.name ?? "Alguém"}</p>
                <p className="text-sm text-foreground">{item.text}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-2">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Escreva um comentário"
            className="h-11 flex-1 rounded-md border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            aria-label="Enviar comentário"
            disabled={busy || !comment.trim()}
            onClick={() => void sendComment()}
            className="flex size-11 items-center justify-center rounded-md bg-primary text-white disabled:opacity-60"
          >
            <Send size={18} />
          </button>
        </div>
      </section>
    </Screen>
  );
}
