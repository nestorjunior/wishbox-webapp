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
import type { GiftList } from "@/lib/data";

/**
 * Ações compartilhadas de uma lista (editar, pausar, compartilhar, excluir).
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

  const togglePause = () => {
    dispatch({
      type: "list/update",
      id: list.id,
      patch: { paused: !list.paused },
    });
  };

  const togglePrivacy = async () => {
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
      const updated = await updateList(token, list.id, {
        private: list.privacy === "public",
      });

      dispatch({
        type: "list/update",
        id: list.id,
        patch: {
          privacy: updated.private
            ? updated.listType === "collaborative"
              ? "guests"
              : "private"
            : "public",
        },
      });
    } catch (error) {
      withApiError("Erro ao editar lista", error);
    } finally {
      setSaving(false);
    }
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
    togglePause,
    togglePrivacy,
    remove,
    confirmOpen,
    requestRemove,
    cancelRemove,
  };
}
