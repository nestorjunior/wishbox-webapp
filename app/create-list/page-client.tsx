"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Globe, Lock, Users } from "lucide-react";
import Link from "next/link";
import { Button, Card, Field } from "@/components/ui";
import { BottomNav } from "@/components/BottomNav";
import { FormHeader } from "@/components/FormHeader";
import { ListMembersSheet } from "@/components/ListMembersSheet";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { auth } from "@/lib/firebase";
import { ApiError, createList, updateList } from "@/lib/api";
import type { GiftList } from "@/lib/data";
import { isListEditor, useWishbox } from "@/store/wishbox-store";

type Privacy = "public" | "private" | "guests";

const templates = [
  ["🎂", "Aniversário", "Presentes para comemorar", "bg-tint-rose"],
  ["🎄", "Natal", "Ideias para o fim do ano", "bg-tint-mint"],
  ["💍", "Casamento", "Presentes para a nova vida", "bg-tint-lilac"],
  ["🍼", "Chá de bebê", "Itens para a chegada do bebê", "bg-tint-sky"],
  ["🏡", "Casa nova", "Tudo para o novo lar", "bg-tint-cream"],
  ["🎓", "Formatura", "Presentes para celebrar essa conquista", "bg-tint-lilac"],
  ["🧳", "Viagem", "O que levar na próxima viagem", "bg-tint-mint"],
  ["💻", "Tecnologia", "Desejos e novidades", "bg-tint-sky"],
  ["📚", "Livros", "Próximas leituras", "bg-tint-peach"],
  ["🎮", "Games", "Jogos e acessórios", "bg-tint-lilac"],
] as const;

const listIcons = ["🎁", "🎂", "🎄", "🎓", "🧳", "🏡", "🍼", "💍", "💻", "📚", "🎮", "🌟"] as const;

type Template = (typeof templates)[number];

export default function CreateListPage() {
  const searchParams = useSearchParams();
  const { authReady, listById } = useWishbox();
  const listId = searchParams.get("listId")?.trim() ?? "";
  const returnToAddProduct = searchParams.get("returnTo") === "add-product";
  const editingList = listId ? listById(listId) : undefined;

  if (listId && !authReady) {
    return (
      <Screen>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
          <FormHeader />
          <p className="text-sm text-muted">Carregando lista…</p>
        </main>
      </Screen>
    );
  }

  if (listId && !editingList) {
    return (
      <Screen>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
          <FormHeader />
          <p className="rounded-md bg-tint-rose px-4 py-3 text-sm text-danger">
            Lista não encontrada ou indisponível.
          </p>
        </main>
      </Screen>
    );
  }

  return (
    <ListForm
      key={editingList?.id ?? "create"}
      editingList={editingList}
      returnToAddProduct={returnToAddProduct}
    />
  );
}

function ListForm({
  editingList,
  returnToAddProduct,
}: {
  editingList?: GiftList;
  returnToAddProduct: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { authReady, backendUser, dispatch } = useWishbox();
  const isEditing = Boolean(editingList);
  const initialTemplate =
    templates.find((item) => item[1] === editingList?.category) ?? templates[0];
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [emoji, setEmoji] = useState(editingList?.emoji ?? initialTemplate[0]);
  const [name, setName] = useState(editingList?.name ?? initialTemplate[1]);
  const [description, setDescription] = useState(
    editingList?.description ?? initialTemplate[2],
  );
  const [privacy, setPrivacy] = useState<Privacy>(editingList?.privacy ?? "public");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdGuestList, setCreatedGuestList] = useState<GiftList>();

  const canEdit = !editingList || isListEditor(editingList, backendUser);
  const privacyOptions = useMemo(
    () =>
      isEditing && editingList?.listType === "collaborative"
        ? ([
            ["public", "Pública", "Qualquer pessoa pode ver e reservar", Globe],
            [
              "guests",
              "Convidados",
              "Apenas pessoas escolhidas podem acessar",
              Users,
            ],
          ] as const)
        : ([
            ["public", "Pública", "Qualquer pessoa pode ver e reservar", Globe],
            ["private", "Privada", "Apenas pessoas adicionadas podem ver", Lock],
            ...(!isEditing
              ? ([
                  [
                    "guests",
                    "Convidados",
                    "Apenas pessoas escolhidas podem acessar",
                    Users,
                  ],
                ] as const)
              : []),
          ] as const),
    [editingList?.listType, isEditing],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.currentUser || !backendUser) {
      setMessage(`Faça login novamente para ${isEditing ? "editar" : "criar"} a lista.`);
      return;
    }
    if (editingList && !canEdit) {
      setMessage(
        "Você não tem permissão para editar esta lista.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const token = await auth.currentUser.getIdToken();
      const normalizedName = name.trim() || template[1];
      const normalizedDescription = description.trim();

      if (editingList) {
        const updated = await updateList(token, editingList.id, {
          name: normalizedName,
          description: normalizedDescription,
          private: privacy !== "public",
          listType: privacy === "guests" ? "collaborative" : "standard",
        });
        dispatch({
          type: "list/update",
          id: editingList.id,
          patch: {
            name: updated.name,
            description: updated.description ?? "",
            listType: updated.listType ?? editingList.listType,
            privacy: updated.private
              ? (updated.listType ?? editingList.listType) === "collaborative"
                ? "guests"
                : "private"
              : "public",
          },
        });
        showToast({ text: "Lista atualizada com sucesso!" });
        router.push(`/list/${editingList.id}`);
      } else {
        const created = await createList(token, {
          name: normalizedName,
          description: normalizedDescription || undefined,
          private: privacy !== "public",
          listType: privacy === "guests" ? "collaborative" : "standard",
        });
        const newList: GiftList = {
          id: created.id,
          ownerId: created.ownerId || backendUser.id,
          listType: created.listType ?? (privacy === "guests" ? "collaborative" : "standard"),
          name: created.name,
          description: created.description ?? normalizedDescription,
          emoji,
          tint: template[3].replace("bg-tint-", "") as GiftList["tint"],
          privacy,
          paused: false,
          category: template[1],
          members: [
            {
              userId: created.ownerId || backendUser.id,
              role: "owner",
            },
          ],
        };
        dispatch({
          type: "list/create",
          list: newList,
        });

        if (privacy !== "guests") {
          showToast({ text: "Lista criada com sucesso!" });
        }
        router.replace(
          returnToAddProduct
            ? `/add-product?listId=${encodeURIComponent(created.id)}&submitAfterListCreation=true`
            : privacy === "guests"
              ? `/list/${created.id}`
              : "/",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : `Não foi possível ${isEditing ? "editar" : "criar"} a lista agora. Tente novamente.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background px-4 pt-4 pb-24">
      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-6">
        <div className="-mx-4 -mt-4 flex h-[62px] items-center border-b border-border px-7">
          <Link
            href={
              isEditing && editingList
                ? `/list/${editingList.id}`
                : returnToAddProduct
                  ? "/add-product"
                  : "/"
            }
            aria-label="Voltar"
            className="flex size-9 items-center justify-center text-foreground transition-opacity hover:opacity-70"
          >
            <ChevronLeft size={20} />
          </Link>
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col gap-7">
          {!isEditing ? <section className="space-y-3">
            <h1 className="text-[13px] font-bold text-foreground">Modelos prontos</h1>
            <div className="flex flex-wrap gap-2">
              {templates.map((item) => (
                <button
                  type="button"
                  key={item[1]}
                  onClick={() => {
                    setTemplate(item);
                    setEmoji(item[0]);
                    setName(item[1]);
                    setDescription(item[2]);
                  }}
                  className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all ${item[3]} ${template[1] === item[1] ? "border-primary ring-2 ring-primary/10" : "border-transparent"}`}
                >
                  <span>{item[0]}</span>
                  <span className="text-foreground">{item[1]}</span>
                </button>
              ))}
            </div>
          </section> : null}

          <Card className="space-y-5 p-5 sm:p-6">
            <Field
              label="Nome da lista"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Meu aniversário"
              maxLength={120}
              required
            />
            <Field
              label="Descrição"
              multiline
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Conte para as pessoas o que essa lista significa"
              maxLength={2000}
            />

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-foreground">Ícone</h2>
              <div className="flex flex-wrap gap-2">
                {listIcons.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setEmoji(item)}
                    aria-label={`Usar ícone ${item}`}
                    aria-pressed={emoji === item}
                    className={`flex size-12 items-center justify-center rounded-md border text-xl transition-colors ${emoji === item ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-transparent bg-background"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-foreground">Privacidade</h2>
              {privacyOptions.map(([value, title, detail, Icon]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPrivacy(value)}
                  className={`flex w-full items-center gap-3 rounded-md border px-4 py-3.5 text-left transition-colors ${privacy === value ? "border-primary bg-primary-soft" : "border-border bg-card"}`}
                >
                  <Icon size={19} className={privacy === value ? "text-primary" : "text-muted"} />
                  <span>
                    <strong className="block text-sm text-foreground">{title}</strong>
                    <small className="text-xs text-muted">{detail}</small>
                  </span>
                </button>
              ))}
            </section>

            {message ? (
              <p className="rounded-md bg-tint-rose px-4 py-3 text-sm text-danger">{message}</p>
            ) : null}
            {isEditing && editingList && !canEdit ? (
              <p className="rounded-md bg-tint-rose px-4 py-3 text-sm text-danger">Você não tem permissão para editar esta lista.</p>
            ) : null}
          </Card>

          <div className="sticky bottom-[72px] z-30 -mx-0.5 bg-background/95 py-1 backdrop-blur-sm">
            <Button
              title={isEditing ? "Salvar alterações" : "Criar lista"}
              type="submit"
              size="lg"
              loading={busy}
              disabled={busy || !authReady || !name.trim() || (isEditing && !canEdit)}
              className="w-full rounded-md"
            />
          </div>
        </form>
      </main>
      <BottomNav />
      {createdGuestList ? (
        <ListMembersSheet
          list={createdGuestList}
          visible
          onClose={() => {
            router.replace(
              returnToAddProduct
                ? `/add-product?listId=${encodeURIComponent(createdGuestList.id)}&submitAfterListCreation=true`
                : `/list/${createdGuestList.id}`,
            );
          }}
        />
      ) : null}
    </div>
  );
}
