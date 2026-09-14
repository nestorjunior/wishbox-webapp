"use client";

import {
  type FormEvent,
  Suspense,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  Link as LinkIcon,
  Lock,
  Users,
} from "lucide-react";

import { FormHeader } from "@/components/FormHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProductImagePicker } from "@/components/ProductImagePicker";
import { Screen } from "@/components/Screen";
import { Button, Card, Field } from "@/components/ui";
import {
  ApiError,
  addItemToList,
  createItem,
  createList,
  updateItem,
} from "@/lib/api";
import type { ListPrivacy } from "@/lib/data";
import { auth } from "@/lib/firebase";
import { isSupportedItemImageContentType } from "@/lib/item-image-upload";
import { useWishbox } from "@/store/wishbox-store";

const listTemplates = [
  { emoji: "🎁", name: "Aniversário", desc: "Presentes para comemorar" },
  { emoji: "🏡", name: "Casa nova", desc: "Tudo para o novo lar" },
  { emoji: "🎄", name: "Natal", desc: "Ideias para o fim de ano" },
  { emoji: "🧳", name: "Viagem", desc: "O que levar na próxima viagem" },
  { emoji: "💻", name: "Tecnologia", desc: "Desejos e novidades" },
  { emoji: "✨", name: "Desejos gerais", desc: "Coisas que gostaria de ganhar" },
] as const;

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;

  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(value: string): number {
  return (
    Number(
      value
        .replace(/\./g, "")
        .replace(",", "."),
    ) || 0
  );
}

function buildProductDescription(
  detail: string,
  store: string,
): string | undefined {
  const parts = [
    detail.trim(),
    store.trim()
      ? `Loja: ${store.trim()}`
      : "",
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join("\n")
    : undefined;
}

export default function AddProductPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted">Carregando...</p>
          </div>
          <BottomNav />
        </Screen>
      }
    >
      <AddProductContent />
    </Suspense>
  );
}

function AddProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialListIdParam = searchParams.get("listId");
  const editingProductId = searchParams.get("productId");

  const {
    editableLists,
    backendUser,
    dispatch,
    authReady,
    productById,
  } = useWishbox();

  const editingProduct = editingProductId
    ? productById(editingProductId)
    : undefined;
  const isEditing = Boolean(editingProductId);

  const availableLists = editableLists;
  const hasAvailableLists = availableLists.length > 0;

  const [listMode, setListMode] = useState<"existing" | "new" | null>(null);
  const [selectedListId, setSelectedListId] = useState("");

  // New list form state
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListEmoji, setNewListEmoji] = useState("🎁");
  const [newListPrivacy, setNewListPrivacy] = useState<ListPrivacy>("public");

  // Product form state (pre-filled from the product being edited, if any)
  const [name, setName] = useState(() => editingProduct?.name ?? "");
  const [price, setPrice] = useState(() =>
    editingProduct && editingProduct.price > 0
      ? editingProduct.price.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "",
  );
  const [store, setStore] = useState(() => editingProduct?.store ?? "");
  const [detail, setDetail] = useState(() => editingProduct?.detail ?? "");
  const [link, setLink] = useState(() => editingProduct?.link ?? "");
  const [image, setImage] = useState(() => editingProduct?.image ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Derived instead of synced via effect: falls back to the query param list,
  // then the first available list, unless the user picked something else.
  const effectiveListId = useMemo(() => {
    if (
      selectedListId &&
      availableLists.some((list) => list.id === selectedListId)
    ) {
      return selectedListId;
    }

    if (
      initialListIdParam &&
      availableLists.some((list) => list.id === initialListIdParam)
    ) {
      return initialListIdParam;
    }

    return availableLists[0]?.id ?? "";
  }, [availableLists, selectedListId, initialListIdParam]);

  // Derived instead of synced via effect: defaults to "new" once lists have
  // loaded and there is none available, unless the user explicitly toggled it.
  const effectiveListMode = listMode ?? (hasAvailableLists ? "existing" : "new");

  const selectedList = useMemo(
    () => availableLists.find((list) => list.id === effectiveListId),
    [availableLists, effectiveListId],
  );

  const isListValid =
    effectiveListMode === "existing"
      ? hasAvailableLists && Boolean(effectiveListId)
      : Boolean(newListName.trim());

  const canSubmit =
    authReady &&
    !busy &&
    Boolean(name.trim()) &&
    (isEditing || isListValid);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    setMessage("");

    const currentUser = auth?.currentUser;

    if (!currentUser) {
      setMessage("Sessão indisponível. Entre novamente.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("Informe o nome do produto.");
      return;
    }

    if (!isEditing && effectiveListMode === "new" && !newListName.trim()) {
      setMessage("Informe o nome da nova lista.");
      return;
    }

    if (!isEditing && effectiveListMode === "existing" && !effectiveListId) {
      setMessage("Selecione uma lista.");
      return;
    }

    setBusy(true);

    try {
      const token = await currentUser.getIdToken();

      const numericPrice = parseCurrency(price);
      const trimmedStore = store.trim();
      const trimmedDetail = detail.trim();
      const trimmedLink = link.trim();
      const trimmedImage = image.trim();

      const externalImageUrl =
        trimmedImage && !trimmedImage.startsWith("blob:")
          ? trimmedImage
          : undefined;

      if (imageFile && !isSupportedItemImageContentType(imageFile.type)) {
        setMessage("Formato de imagem não suportado. Escolha PNG, JPEG ou GIF.");
        setBusy(false);
        return;
      }

      const uploadProductImage = async (itemId: string) => {
        if (!imageFile || !isSupportedItemImageContentType(imageFile.type)) {
          return externalImageUrl;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("itemId", itemId);
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/product-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Não foi possível enviar a imagem do produto.");
        }

        const uploadResult = (await uploadResponse.json()) as {
          imageUrl?: string | null;
        };

        return uploadResult.imageUrl ?? undefined;
      };

      if (isEditing && editingProduct) {
        await updateItem(token, editingProduct.id, {
          title: trimmedName,
          description: buildProductDescription(trimmedDetail, trimmedStore),
          externalUrl: trimmedLink || undefined,
          priceAmount: numericPrice > 0 ? numericPrice.toFixed(2) : undefined,
          priceCurrency: numericPrice > 0 ? "BRL" : undefined,
          priority: "MEDIUM",
          imageExternalUrl: externalImageUrl,
        });

        const finalImageUrl = await uploadProductImage(editingProduct.id);

        dispatch({
          type: "product/update",
          id: editingProduct.id,
          patch: {
            name: trimmedName,
            store: trimmedStore,
            detail: trimmedDetail,
            price: numericPrice,
            link: trimmedLink,
            image: finalImageUrl,
          },
        });

        router.push(`/product/${editingProduct.id}`);
        return;
      }

      let targetListId = effectiveListId;

      // 1. Criar nova lista se o usuário escolheu essa opção
      if (effectiveListMode === "new") {
        const trimmedNewListName = newListName.trim();
        const trimmedNewListDesc = newListDescription.trim();

        const createdList = await createList(token, {
          name: trimmedNewListName,
          description: trimmedNewListDesc || undefined,
          private: newListPrivacy !== "public",
          listType: newListPrivacy === "guests" ? "collaborative" : "standard",
        });

        targetListId = createdList.id;

        const finalOwnerId = backendUser?.id || currentUser.uid;

        dispatch({
          type: "list/create",
          list: {
            id: createdList.id,
            ownerId: finalOwnerId,
            name: createdList.name,
            description: createdList.description ?? trimmedNewListDesc,
            emoji: newListEmoji || "🎁",
            tint: "lilac",
            privacy: newListPrivacy,
            paused: false,
            category: createdList.name,
            members: [],
          },
        });
      }

      // 2. Criar o item no backend
      const createdItem = await createItem(token, {
        title: trimmedName,
        description: buildProductDescription(trimmedDetail, trimmedStore),
        externalUrl: trimmedLink || undefined,
        imageExternalUrl: externalImageUrl,
        priceAmount: numericPrice > 0 ? numericPrice.toFixed(2) : undefined,
        priceCurrency: numericPrice > 0 ? "BRL" : undefined,
        status: "ACTIVE",
        priority: "MEDIUM",
      });

      // 3. Enviar imagem se houver arquivo
      const finalImageUrl = await uploadProductImage(createdItem.id);

      // 4. Vincular item à lista no backend
      await addItemToList(token, {
        listId: targetListId,
        itemId: createdItem.id,
      });

      // 5. Atualizar store local
      dispatch({
        type: "product/create",
        product: {
          id: createdItem.id,
          listId: targetListId,
          name: trimmedName,
          store: trimmedStore,
          detail: trimmedDetail,
          price: numericPrice,
          link: trimmedLink,
          note: "",
          emoji: "🎁",
          image: finalImageUrl,
          tint: "lilac",
          priority: "media",
          quantity: 1,
          likes: 0,
          liked: false,
          comments: [],
          reservedBy: null,
          paused: false,
          archived: false,
        },
      });

      router.push(`/list/${targetListId}`);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);

      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Não foi possível adicionar o produto agora. Tente novamente.";

      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  if (isEditing && !editingProduct) {
    return (
      <Screen>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
          <FormHeader />
          <p className="text-sm text-muted">Produto não encontrado.</p>
        </main>
        <BottomNav />
      </Screen>
    );
  }

  return (
    <Screen>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
        <FormHeader />

        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar produto" : "Adicionar produto"}
          </h1>

          <p className="text-sm leading-5 text-muted">
            {isEditing
              ? "Atualize as informações do produto."
              : "Cadastre algo que você gostaria de ganhar."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="space-y-3">
            <ProductImagePicker
              value={image}
              onChange={setImage}
              onFileChange={setImageFile}
            />
          </Card>

          <Card className="space-y-3.5">
            <Field
              label="Nome do produto"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Fone de ouvido sem fio"
              required
              disabled={busy}
            />

            <Field
              label="Preço (R$)"
              value={price}
              onChange={(event) =>
                setPrice(formatCurrencyInput(event.target.value))
              }
              inputMode="decimal"
              placeholder="0,00"
              disabled={busy}
            />

            <Field
              label="Loja"
              value={store}
              onChange={(event) => setStore(event.target.value)}
              placeholder="Ex.: Loja Tech"
              disabled={busy}
            />

            <Field
              label="Detalhe"
              multiline
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Tamanho, cor, voltagem, modelo..."
              disabled={busy}
            />

            <Field
              label="Link do produto"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://loja.com/produto"
              icon={<LinkIcon size={18} className="text-muted" />}
              disabled={busy}
            />

            {!isEditing && effectiveListMode === "existing" && hasAvailableLists ? (
              <div className="space-y-1.5">
                <Field
                  label="Adicionar à lista"
                  as="select"
                  value={effectiveListId}
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val === "__new__") {
                      setListMode("new");
                    } else {
                      setSelectedListId(val);
                    }
                  }}
                  disabled={!authReady || busy}
                >
                  {availableLists.map((list) => (
                    <option
                      key={list.id}
                      value={list.id}
                      className="bg-card text-foreground"
                    >
                      {list.emoji ? `${list.emoji} ` : ""}{list.name}
                    </option>
                  ))}
                  <option value="__new__" className="bg-card font-medium text-primary">
                    + Criar nova lista...
                  </option>
                </Field>

                {selectedList ? (
                  <p className="text-xs text-muted">
                    Produto será adicionado à lista{" "}
                    <span className="font-medium text-foreground">
                      {selectedList.name}
                    </span>
                    .
                  </p>
                ) : null}
              </div>
            ) : !isEditing ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-foreground">
                    Nova lista
                  </span>
                  {hasAvailableLists ? (
                    <button
                      type="button"
                      onClick={() => setListMode("existing")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Escolher lista existente
                    </button>
                  ) : null}
                </div>

                {!hasAvailableLists && authReady ? (
                  <p className="text-xs text-muted">
                    Você ainda não tem listas. Digite o nome para criá-la junto com o produto.
                  </p>
                ) : null}

                <Field
                  label="Nome da lista"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  placeholder="Ex.: Meu Aniversário, Casa Nova..."
                  required
                  disabled={busy}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">
                    Sugestões de lista
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {listTemplates.map((item) => (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => {
                          setNewListName(item.name);
                          setNewListDescription(item.desc);
                          setNewListEmoji(item.emoji);
                        }}
                        disabled={busy}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          newListName === item.name
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border bg-card text-muted hover:text-foreground"
                        }`}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <section className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">
                    Privacidade
                  </label>
                  {(
                    [
                      ["public", "Pública", Globe],
                      ["private", "Privada", Lock],
                      ["guests", "Convidados", Users],
                    ] as const
                  ).map(([value, title, Icon]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setNewListPrivacy(value)}
                      disabled={busy}
                      className={`flex w-full items-center gap-2.5 rounded-md border p-2.5 text-left text-sm ${
                        newListPrivacy === value
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          newListPrivacy === value
                            ? "text-primary"
                            : "text-muted"
                        }
                      />
                      {title}
                    </button>
                  ))}
                </section>
              </div>
            ) : null}
          </Card>

          {message ? (
            <p
              role="alert"
              className="rounded-md bg-tint-rose px-4 py-3 text-sm text-danger"
            >
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            title={
              !authReady
                ? "Carregando..."
                : isEditing
                  ? "Salvar alterações"
                  : effectiveListMode === "new"
                    ? "Criar lista e adicionar produto"
                    : "Adicionar produto"
            }
            loading={busy}
            disabled={!canSubmit}
            className="w-full"
          />
        </form>
      </main>

      <BottomNav />
    </Screen>
  );
}