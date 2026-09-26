"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useWishbox } from "@/store/wishbox-store";
import { useToast } from "@/components/Toast";
import {
  ApiError,
  deleteList as deleteBackendList,
  updateList,
} from "@/lib/api";
import type { GiftList, ListPrivacy } from "@/lib/data";

/**
 * Ações compartilhadas de uma lista (editar, compartilhar, excluir).
 *
 * Não adicione mutações somente no `dispatch` aqui: o estado da API é a
 * fonte de verdade e toda ação de negócio precisa concluir no backend antes
 * de atualizar o store.
 * Usado tanto na tela de detalhe da lista quanto no menu de ações do card.
 */
export function useListActions(
  list: GiftList,
  options?: { onDeleted?: () => void },
) {
  const router = useRouter();
  const { dispatch } = useWishbox();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function withApiError(title: string, error: unknown) {
    const message =
      error instanceof ApiError
        ? `${title}: ${error.message} (status ${error.status})`
        : `${title}: não foi possível completar a operação agora.`;
    showToast({ text: message, tone: "warning" });
  }

  const editList = () => {
    router.push(`/create-list?listId=${list.id}`);
  };

  const setPrivacy = async (privacy: ListPrivacy) => {
    if (saving) return;
    const requestedType = privacy === "guests" ? "collaborative" : "standard";
    if (privacy !== "public" && requestedType !== (list.listType ?? "standard")) {
      showToast({
        text: "O tipo da lista não pode ser alterado depois da criação. Crie uma nova lista para usar essa opção.",
        tone: "warning",
      });
      return;
    }
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({
        text: "Sessão expirada. Faça login novamente.",
        tone: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const token = await firebaseUser.getIdToken();
      const updated = await updateList(token, list.id, {
        private: privacy !== "public",
      });
      let resolvedPrivacy: ListPrivacy = "public";
      if (updated.private) {
        resolvedPrivacy =
          (updated.listType ?? list.listType) === "collaborative"
            ? "guests"
            : "private";
      }

      dispatch({
        type: "list/update",
        id: list.id,
        patch: {
          privacy: resolvedPrivacy,
        },
      });
      showToast({
        text:
          updated.private
            ? "Lista definida como privada."
            : "Lista definida como pública.",
      });
    } catch (error) {
      withApiError("Erro ao editar lista", error);
    } finally {
      setSaving(false);
    }
  };

  const togglePause = () => {
    showToast({
      text: "Pausar listas ainda não é suportado pelo servidor.",
      tone: "warning",
    });
  };

  const remove = async () => {
    if (saving) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      showToast({
        text: "Sessão expirada. Faça login novamente.",
        tone: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const token = await firebaseUser.getIdToken();
      await deleteBackendList(token, list.id);
      dispatch({ type: "list/delete", id: list.id });
      showToast({ text: "Lista excluída com sucesso!" });
      options?.onDeleted?.();
    } catch (error) {
      withApiError("Erro ao excluir lista", error);
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const requestRemove = () => setConfirmOpen(true);
  const cancelRemove = () => setConfirmOpen(false);

  return {
    saving,
    editList,
    setPrivacy,
    togglePause,
    remove,
    confirmOpen,
    requestRemove,
    cancelRemove,
  };
}
