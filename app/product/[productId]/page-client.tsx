"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Ellipsis,
  ExternalLink,
  Heart,
  MessageCircle,
  Send,
  Gift,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { Avatar, Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { CloneProductSheet } from "@/components/CloneProductSheet";
import { ProductActionsSheet, ReportProductSheet } from "@/components/ProductActionsSheet";
import { formatRelativeTime } from "@/lib/data/utils";
import { brl, tints } from "@/lib/theme";
import { auth } from "@/lib/firebase";
import {
  ApiError,
  createItemComment,
  createNotification,
  deleteItem,
  fetchItemComments,
  likeItem,
  unlikeItem,
  updateItem,
  cloneListItem,
} from "@/lib/api";
import { useWishbox } from "@/store/wishbox-store";

export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const {
    productById,
    listById,
    userById,
    dispatch,
    me,
    backendUser,
    reserveProduct,
    cancelProductReservation,
    refreshSession,
    editableLists,
  } = useWishbox();
  const { showToast } = useToast();
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneTargetId, setCloneTargetId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const product = productById(String(productId));

  useEffect(() => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || !productId) return;

    let active = true;
    const loadComments = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetchItemComments(token, String(productId));
        if (!active) return;
        dispatch({
          type: "product/update",
          id: String(productId),
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
        // A tela continua funcional mesmo se o histórico não puder ser carregado.
      }
    };

    void loadComments();
    return () => {
      active = false;
    };
  }, [dispatch, productId]);

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
  const cloneTargets = editableLists.filter(
    (candidate) => candidate.id !== product.listId && !candidate.paused,
  );

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

  const reserve = async () => {
    if (!backendUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }
    if (product.reservedBy && product.reservedBy !== backendUser.id) {
      showToast({ text: "Esse presente já foi reservado por outra pessoa", tone: "warning" });
      return;
    }
    try {
      setBusy(true);
      await reserveProduct(product.id);
      showToast({ text: "Presente reservado" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        showToast({
          text: "Esse presente acabou de ser reservado por outra pessoa.",
          tone: "warning",
        });
        await refreshSession();
      } else {
        withApiError("Não foi possível reservar o presente", error);
      }
    } finally {
      setBusy(false);
    }
  };

  const unreserve = async () => {
    try {
      setBusy(true);
      await cancelProductReservation(product.id);
      showToast({ text: "Reserva desfeita" });
      return true;
    } catch (error) {
      withApiError("Não foi possível cancelar a reserva", error);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitProductCopy = async () => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || !cloneTargetId || busy) return;
    try {
      setBusy(true);
      const token = await firebaseUser.getIdToken();
      await cloneListItem(token, product.listId, product.id, [cloneTargetId]);
      const targetList = cloneTargets.find((candidate) => candidate.id === cloneTargetId);
      setCloneOpen(false);
      setCloneTargetId(null);
      showToast({ text: `Produto adicionado à lista ${targetList?.name ?? "selecionada"}.` });
    } catch (error) {
      withApiError("Não foi possível copiar o produto", error);
    } finally {
      setBusy(false);
    }
  };

  const copyProduct = async () => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || !cloneTargetId || busy) return;
    try {
      setBusy(true);
      const token = await firebaseUser.getIdToken();
      await cloneListItem(token, product.listId, product.id, [cloneTargetId]);
      await refreshSession();
      setCloneOpen(false);
      setCloneTargetId(null);
      showToast({ text: "Produto copiado para sua lista." });
    } catch (error) {
      withApiError("Não foi possível copiar o produto", error);
    } finally {
      setBusy(false);
    }
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
    <Screen contentClassName="sm:max-w-[960px] sm:gap-5 sm:px-6 sm:pt-5">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-foreground">{list?.name}</h1>
            <p className="truncate text-[11px] text-muted">{list?.category}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Opções do produto"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
        >
          <Ellipsis size={20} />
        </button>
      </header>

      <main className="grid gap-5 sm:grid-cols-[minmax(0,446px)_1fr] sm:items-start sm:gap-6">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ backgroundColor: tints[product.tint] ?? tints.lilac }}
            >
              <span className="text-6xl">{product.emoji}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:pt-0">
          <div className="mb-3 flex items-center gap-2">
            <Avatar
              photo={isOwner ? me?.photo : listOwner?.photo}
              emoji={isOwner ? (me?.emoji ?? "👤") : (listOwner?.emoji ?? "🎁")}
              tint={isOwner ? me?.tint : listOwner?.tint}
              size={36}
            />
            <p className="text-xs text-muted">
              {isOwner ? "Sua lista" : listOwner?.name}
            </p>
          </div>

          <p className="text-xs font-semibold uppercase text-primary">
            {product.store || "Produto"}
          </p>
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          {product.detail ? (
            <p className="text-sm leading-6 text-muted">{product.detail}</p>
          ) : null}
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            {brl(product.price)}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              title={String(product.likes)}
              icon={<Heart size={16} fill={product.liked ? "currentColor" : "none"} />}
              variant={product.liked ? "primary" : "outline"}
              loading={busy}
              onClick={() => void toggleLike()}
            />
            {product.link ? (
              <a
                href={product.link}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground transition-opacity hover:opacity-90"
              >
                <ExternalLink size={16} /> Ver na loja
              </a>
            ) : null}
          </div>

          {!isOwner ? (
            reservedByMe ? (
              <Button
                title="Cancelar reserva"
                variant="outline"
                loading={busy}
                disabled={busy}
                onClick={() => setCancelConfirmOpen(true)}
                className="w-full"
              />
            ) : (
              <Button
                title={product.reservedBy ? "Já reservado" : "Reservar presente"}
                icon={<Gift size={17} />}
                loading={busy}
                disabled={busy || Boolean(product.reservedBy)}
                onClick={() => void reserve()}
                className="w-full"
              />
            )
          ) : null}
        </div>
      </main>

      <ProductActionsSheet
        product={product}
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onReserve={() => void reserve()}
        onUnreserve={() => void unreserve()}
        onCopy={() => {
          setCloneTargetId(null);
          setCloneOpen(true);
        }}
        onReport={() => setReportOpen(true)}
        onEdit={isOwner ? () => router.push(`/add-product?productId=${product.id}&listId=${product.listId}`) : undefined}
        onTogglePause={isOwner ? () => void togglePause() : undefined}
        onDelete={isOwner ? () => void removeProduct() : undefined}
        isReservedByMe={reservedByMe}
        reservationUnavailable={Boolean(product.reservedBy && !reservedByMe)}
        loading={busy || saving}
      />

      <CloneProductSheet
        product={cloneOpen ? product : null}
        lists={cloneTargets}
        selectedListId={cloneTargetId}
        visible={cloneOpen}
        loading={busy}
        onClose={() => setCloneOpen(false)}
        onSelect={setCloneTargetId}
        onSubmit={() => void submitProductCopy()}
      />

      <ReportProductSheet
        product={product}
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={({ reason }) => showToast({ text: `Denúncia registrada: ${reason}.` })}
      />

      <ConfirmDialog
        visible={cancelConfirmOpen}
        title="Cancelar reserva?"
        description="O presente volta a ficar disponível para outras pessoas reservarem."
        confirmLabel="Cancelar reserva"
        loading={busy}
        onConfirm={() => {
          void unreserve().then((cancelled) => {
            if (cancelled) setCancelConfirmOpen(false);
          });
        }}
        onCancel={() => setCancelConfirmOpen(false)}
      />

      <section className="mt-2 flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MessageCircle size={19} className="text-primary" />
          Comentários
          <span className="text-xs font-normal text-muted">({product.comments.length})</span>
        </h2>
        {product.comments.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-6 text-center text-xs text-muted shadow-card-compact">
            Ainda não há comentários. Seja a primeira pessoa a comentar.
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card px-4 shadow-card-compact">
            {product.comments.map((item) => {
              const author = item.userId === backendUser?.id ? me : userById(item.userId);
              return (
                <div key={item.id} className="flex gap-3 py-4">
                  <Avatar photo={author?.photo} emoji={author?.emoji} tint={author?.tint} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-sm font-bold text-foreground">
                        {author?.name ?? "Usuário"}
                      </p>
                      <p className="shrink-0 text-[11px] text-muted">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{item.text}</p>
                    <button
                      type="button"
                      aria-label="Curtir comentário"
                      onClick={() => dispatch({
                        type: "product/comment-like",
                        productId: product.id,
                        commentId: item.id,
                      })}
                      className="mt-4 flex items-center gap-1.5 text-xs text-primary"
                    >
                      <Heart size={15} fill={item.liked ? "currentColor" : "none"} />
                      {item.likes > 0 ? item.likes : null}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Escreva um comentário..."
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
      <BottomNav />
    </Screen>
  );
}
