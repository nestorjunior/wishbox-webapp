"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  CirclePause,
  EllipsisVertical,
  Gift,
  Globe,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Share2,
  Users,
} from "lucide-react";
import { FormHeader } from "@/components/FormHeader";
import { BottomNav } from "@/components/BottomNav";
import { Screen } from "@/components/Screen";
import { ProductCard } from "@/components/Cards";
import { ListActionsSheet } from "@/components/ListActionsSheet";
import { ListMembersSheet } from "@/components/ListMembersSheet";
import { CloneProductSheet } from "@/components/CloneProductSheet";
import { ShareListSheet } from "@/components/ShareListSheet";
import { Avatar, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";
import {
  ApiError,
  cloneListItem,
  createConversation,
  deleteItem,
  fetchConversations,
  fetchListMembers,
  updateItem,
} from "@/lib/api";
import type { GiftList, ListPrivacy, Product } from "@/lib/data";
import { useListActions } from "@/hooks/use-list-actions";
import {
  cloneOwnedProduct,
  deleteOwnedProduct,
  setOwnedProductPaused,
  type ProductOwnerActionDependencies,
} from "@/lib/product-owner-actions";
import { auth } from "@/lib/firebase";
import { tints } from "@/lib/theme";
import { isListEditor, isListOwner, useWishbox } from "@/store/wishbox-store";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const {
    listById,
    productsOf,
    userById,
    backendUser,
    editableLists,
    dispatch,
    refreshSession,
    reserveProduct,
    cancelProductReservation,
  } = useWishbox();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [cloneProduct, setCloneProduct] = useState<Product | null>(null);
  const [cloneTargetId, setCloneTargetId] = useState<string | null>(null);
  const [productActionBusy, setProductActionBusy] = useState(false);

  const list = listById(String(listId));

  if (!list) {
    return (
      <Screen>
        <FormHeader />
        <EmptyState emoji="🤔" title="Lista não encontrada" />
      </Screen>
    );
  }

  const owner = userById(list.ownerId);
  const products = productsOf(list.id);
  const canEdit = isListEditor(list, backendUser);
  const canInvite = isListOwner(list, backendUser);
  const isOwnList = isListOwner(list, backendUser);
  const listMembers = (list.members ?? []).filter(
    (member) => member.userId !== list.ownerId,
  );
  const cloneTargets = editableLists.filter((candidate) => candidate.id !== list.id && !candidate.paused);

  const actionDependencies = async (): Promise<ProductOwnerActionDependencies> => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) throw new Error("Sessão expirada. Faça login novamente.");
    const token = await firebaseUser.getIdToken();
    return {
      deleteProduct: (itemId) => deleteItem(token, itemId),
      updateProductStatus: async (itemId, status) => { await updateItem(token, itemId, { status }); },
      cloneProduct: async (sourceListId, itemId, targetListId) => { await cloneListItem(token, sourceListId, itemId, [targetListId]); },
      refresh: refreshSession,
      removeLocalProduct: (itemId) => dispatch({ type: "product/delete", id: itemId }),
    };
  };

  const runProductAction = async (action: (dependencies: ProductOwnerActionDependencies) => Promise<void>, success: string) => {
    if (productActionBusy) return false;
    try {
      setProductActionBusy(true);
      await action(await actionDependencies());
      showToast({ text: success });
      return true;
    } catch (error) {
      showToast({ text: error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Não foi possível atualizar o produto.", tone: "warning" });
      return false;
    } finally {
      setProductActionBusy(false);
    }
  };

  const runVisitorAction = async (
    action: () => Promise<void>,
    success: string,
  ) => {
    if (productActionBusy) return;
    try {
      setProductActionBusy(true);
      await action();
      showToast({ text: success });
    } catch (error) {
      showToast({
        text:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Não foi possível concluir a ação.",
        tone: "warning",
      });
    } finally {
      setProductActionBusy(false);
    }
  };

  const openCloneSheet = (product: Product) => {
    setCloneTargetId(null);
    setCloneProduct(product);
  };

  const submitClone = () => {
    if (!cloneProduct || !cloneTargetId) return;
    const targetList = cloneTargets.find((candidate) => candidate.id === cloneTargetId);
    void runProductAction(
      (dependencies) => cloneOwnedProduct(cloneProduct.listId, cloneProduct.id, cloneTargetId, dependencies),
      `Produto adicionado à lista ${targetList?.name ?? "selecionada"}.`,
    ).then((succeeded) => {
      if (succeeded) setCloneProduct(null);
      else setCloneTargetId(null);
    });
  };

  const openGroupChat = async () => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || !backendUser || openingChat) return;

    try {
      setOpeningChat(true);
      const token = await firebaseUser.getIdToken();
      // The store can still contain the list snapshot loaded before a member was
      // invited. Resolve recipients from the membership endpoint so a list chat
      // is never accidentally created with only one of the invited people.
      const [inbox, members] = await Promise.all([
        fetchConversations(token, { pageSize: 100 }),
        fetchListMembers(token, list.id),
      ]);
      const recipientIds = Array.from(
        new Set([list.ownerId, ...members.map(({ userId }) => userId)]),
      ).filter((userId) => userId !== backendUser.id);

      if (recipientIds.length === 0) {
        showToast({
          text: "Convide pelo menos uma pessoa antes de abrir o chat.",
          tone: "warning",
        });
        return;
      }

      const expectedParticipantIds = new Set([
        backendUser.id,
        ...recipientIds,
      ]);
      const existing = inbox.data.find(
        (conversation) =>
          conversation.type === "group" &&
          conversation.name === list.name &&
          conversation.participants.length === expectedParticipantIds.size &&
          conversation.participants.every((participant) =>
            expectedParticipantIds.has(participant.id),
          ),
      );
      const conversation =
        existing ??
        (await createConversation(token, {
          recipientIds,
          name: list.name,
        }));

      if (conversation.type !== "group") {
        throw new ApiError(
          "O servidor não criou a conversa em grupo da lista. Tente novamente mais tarde.",
          502,
        );
      }

      router.push(`/messages?conversationId=${conversation.id}`);
    } catch (error) {
      showToast({
        text:
          error instanceof ApiError
            ? error.message
            : "Não foi possível abrir o chat da lista agora.",
        tone: "warning",
      });
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <Screen contentClassName="sm:max-w-[960px] sm:pt-7">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Voltar" onClick={() => router.back()} className="flex size-9 items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">{list.name}</h1>
            <p className="text-[11px] text-muted">
              {isOwnList
                ? "Sua lista"
                : owner
                  ? `de ${owner.name}`
                  : "Lista compartilhada"}
            </p>
          </div>
        </div>
        {isOwnList ? (
          <div className="relative">
            <button
              type="button"
              aria-label="Opções da lista"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex size-9 items-center justify-center"
            >
              <EllipsisVertical size={20} className="text-foreground" />
            </button>
            <ListActionsSheet
              list={list}
              visible={menuOpen}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        ) : (
          <div className="relative">
            <button type="button" aria-label="Opções da lista" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex size-9 items-center justify-center">
              <EllipsisVertical size={20} className="text-foreground" />
            </button>
            {menuOpen ? (
              <div className="absolute top-full right-0 z-40 mt-1 w-36 rounded-xl border border-border bg-card p-1 shadow-menu">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShareOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-background"
                >
                  <Share2 size={16} /> Compartilhar
                </button>
              </div>
            ) : null}
          </div>
        )}
      </header>

      {list.paused ? (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-muted">
          <CirclePause size={17} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Lista pausada</p>
            <p className="mt-0.5 text-xs">Ninguém consegue reservar itens enquanto a lista estiver pausada. Retome pelo menu.</p>
          </div>
        </div>
      ) : null}

      <section className={`flex items-center gap-4 py-1 sm:mx-5 sm:mt-0.5 sm:gap-4 ${list.paused ? "opacity-50 grayscale" : ""}`}>
          <div
            className="flex size-[116px] shrink-0 items-center justify-center rounded-xl sm:size-[150px]"
            style={{ backgroundColor: tints[list.tint] ?? tints.lilac }}
          >
            <span className="text-5xl sm:text-6xl">{list.emoji}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-(--foreground)">
              {list.name}
            </p>
            {!isOwnList && owner ? (
              <Link
                href={`/profile/${owner.username}`}
                className="mt-2 flex w-fit items-center gap-2 text-xs font-semibold text-primary"
              >
                <Avatar
                  photo={owner.photo}
                  emoji={owner.emoji}
                  tint={owner.tint}
                  size={26}
                />
                Lista de {owner.name}
              </Link>
            ) : (
              <div className="mt-2 flex items-center gap-2">
              <ListPrivacySelector list={list} />

              {list.privacy === "guests" ? (
                <div className="flex items-center rounded-full bg-card p-1">
                  <div className="flex -space-x-2 px-1">
                    {listMembers.slice(0, 3).map((member) => {
                      const user = userById(member.userId);
                      return (
                        <span key={member.userId} className="rounded-full ring-2 ring-card">
                          <Avatar photo={user?.photo} emoji={user?.emoji ?? "👤"} tint={user?.tint} size={24} />
                        </span>
                      );
                    })}
                  </div>
                  {listMembers.length > 0 ? <span className="px-1 text-xs font-semibold">{listMembers.length}</span> : null}
                  {canInvite ? (
                    <button type="button" aria-label="Adicionar convidados" onClick={() => setMembersOpen(true)} className="flex size-7 items-center justify-center rounded-full bg-background text-muted">
                      <Plus size={16} />
                    </button>
                  ) : null}
                  <button type="button" aria-label="Abrir chat da lista" disabled={openingChat} onClick={() => void openGroupChat()} className="ml-1 flex size-7 items-center justify-center rounded-full bg-background text-muted disabled:opacity-50">
                    {openingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={16} />}
                  </button>
                </div>
              ) : null}
              </div>
            )}
            {list.description ? <p className="mt-3 text-sm leading-5 text-muted">{list.description}</p> : null}
          </div>
      </section>

      <div className="mt-2 flex items-center justify-between sm:mx-5 sm:mt-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><Gift size={16} className="text-primary" />Lista de presentes</h2>
        <span className="text-xs text-muted">{products.length} {products.length === 1 ? "item" : "itens"}</span>
      </div>

      {products.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="Nenhum produto ainda"
          description={
            canEdit
              ? "Adicione produtos para começar sua lista."
              : "Essa lista ainda não tem produtos."
          }
        />
      ) : (
        <div className={`grid grid-cols-2 gap-3 sm:mx-5 sm:grid-cols-[repeat(auto-fill,218px)] sm:gap-4 ${list.paused ? "pointer-events-none opacity-50 grayscale" : ""}`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              ownerPhoto={owner?.photo}
              onPress={() => router.push(`/product/${product.id}`)}
              showActions
              onReserve={
                !isOwnList
                  ? () => {
                      if (
                        product.reservedBy &&
                        product.reservedBy !== backendUser?.id
                      ) {
                        showToast({
                          text: "Esse presente já foi reservado por outra pessoa.",
                          tone: "warning",
                        });
                        return;
                      }
                      void runVisitorAction(
                        () => reserveProduct(product.id),
                        "Presente reservado.",
                      );
                    }
                  : undefined
              }
              onUnreserve={
                !isOwnList
                  ? () =>
                      void runVisitorAction(
                        () => cancelProductReservation(product.id),
                        "Reserva cancelada.",
                      )
                  : undefined
              }
              onEdit={isOwnList ? () =>
                  router.push(
                    `/add-product?productId=${product.id}&listId=${list.id}`,
                  ) : undefined
              }
              onCopy={() => openCloneSheet(product)}
              onTogglePause={isOwnList ? () => void runProductAction(
                (dependencies) => setOwnedProductPaused(product.id, !product.paused, dependencies),
                product.paused ? "Produto retomado." : "Produto pausado.",
              ) : undefined}
              onDelete={isOwnList ? () => void runProductAction(
                (dependencies) => deleteOwnedProduct(product.id, dependencies),
                "Produto excluído.",
              ) : undefined}
              isReservedByMe={Boolean(
                backendUser && product.reservedBy === backendUser.id,
              )}
            />
          ))}
        </div>
      )}

      {canEdit && !list.paused ? (
        <button type="button" aria-label="Adicionar produto" onClick={() => router.push(`/add-product?listId=${list.id}`)} className="fixed right-5 bottom-20 z-30 flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-lg sm:hidden">
          <Plus size={22} />
        </button>
      ) : null}

      {canInvite ? <ListMembersSheet
          list={list}
          visible={membersOpen}
          onClose={() => setMembersOpen(false)}
        /> : null}

      <CloneProductSheet
        product={cloneProduct}
        lists={cloneTargets}
        selectedListId={cloneTargetId}
        visible={Boolean(cloneProduct)}
        loading={productActionBusy}
        onClose={() => setCloneProduct(null)}
        onSelect={setCloneTargetId}
        onSubmit={submitClone}
      />

      <ShareListSheet
        list={list}
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <BottomNav />
    </Screen>
  );
}

const privacyOptions = [
  { value: "public", label: "Pública", icon: Globe },
  { value: "private", label: "Privada", icon: Lock },
  { value: "guests", label: "Convidados", icon: Users },
] as const;

function ListPrivacySelector({ list }: { list: GiftList }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { saving, setPrivacy } = useListActions(list);
  const selected = privacyOptions.find((option) => option.value === list.privacy) ?? privacyOptions[0];
  const SelectedIcon = selected.icon;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={saving}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-50"
      >
        <SelectedIcon size={15} />
        {selected.label}
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div role="menu" className="absolute top-full left-0 z-40 mt-1 min-w-32 rounded-xl border border-border bg-card p-1 shadow-menu">
          {privacyOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={list.privacy === value}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-background"
              onClick={() => {
                setOpen(false);
                if (value !== list.privacy) void setPrivacy(value as ListPrivacy);
              }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
