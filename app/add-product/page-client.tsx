"use client";

import {
  type FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { FormHeader } from "@/components/FormHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProductImagePicker } from "@/components/ProductImagePicker";
import { ProductListDialog } from "@/components/ProductListDialog";
import { Screen } from "@/components/Screen";
import { Button, Card, Field } from "@/components/ui";
import { ApiError, addItemToList, createItem, updateItem } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { isSupportedItemImageContentType } from "@/lib/item-image-upload";
import {
  consumeAddProductDraft,
  saveAddProductDraft,
} from "@/lib/add-product-draft";
import { useWishbox } from "@/store/wishbox-store";
import { useToast } from "@/components/Toast";

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
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialListIdParam = searchParams.get("listId");
  const editingProductId = searchParams.get("productId");
  const shouldSubmitAfterListCreation =
    searchParams.get("submitAfterListCreation") === "true";

  const {
    editableLists,
    dispatch,
    authReady,
    productById,
    productsOf,
  } = useWishbox();

  const editingProduct = editingProductId
    ? productById(editingProductId)
    : undefined;
  const isEditing = Boolean(editingProductId);

  const availableLists = editableLists;
  const hasAvailableLists = availableLists.length > 0;

  const [selectedListId, setSelectedListId] = useState("");
  const [listDialogOpen, setListDialogOpen] = useState(false);

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
  const [link] = useState(() => editingProduct?.link ?? "");
  const [image, setImage] = useState(() => editingProduct?.image ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const automaticSubmissionStarted = useRef(false);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const draft = consumeAddProductDraft();
    if (!draft) {
      return;
    }

    // The draft comes from sessionStorage after hydration and must repopulate
    // the controlled fields when returning from the list creation route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(draft.name);
    setPrice(draft.price);
    setStore(draft.store);
    setDetail(draft.detail);
    setImage(draft.image);
  }, [isEditing]);

  const handleCreateListFromProduct = () => {
    saveAddProductDraft({
      name,
      price,
      store,
      detail,
      image: image.startsWith("blob:") ? "" : image,
    });
    router.push("/create-list?returnTo=add-product");
  };

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const draft = consumeAddProductDraft();
    if (!draft) {
      return;
    }

    // The draft comes from sessionStorage after hydration and must repopulate
    // the controlled fields when returning from the list creation route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(draft.name);
    setPrice(draft.price);
    setStore(draft.store);
    setDetail(draft.detail);
    setImage(draft.image);
  }, [isEditing]);

  const handleCreateList = () => {
    saveAddProductDraft({
      name,
      price,
      store,
      detail,
      image: image.startsWith("blob:") ? "" : image,
    });
    router.push("/create-list?returnTo=add-product");
  };

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

  const canSubmit =
    authReady &&
    !busy &&
    Boolean(name.trim()) &&
    (isEditing || (hasAvailableLists && Boolean(effectiveListId)));

  useEffect(() => {
    const createdListIsAvailable = availableLists.some(
      (list) => list.id === initialListIdParam,
    );

    if (
      !shouldSubmitAfterListCreation ||
      automaticSubmissionStarted.current ||
      !authReady ||
      !name.trim() ||
      !initialListIdParam ||
      !createdListIsAvailable
    ) {
      return;
    }

    automaticSubmissionStarted.current = true;
    formRef.current?.requestSubmit();
  }, [
    authReady,
    availableLists,
    initialListIdParam,
    name,
    shouldSubmitAfterListCreation,
  ]);

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

    if (!isEditing && !effectiveListId) {
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

      const targetListId = effectiveListId;

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
          reservationId: undefined,
          paused: false,
          archived: false,
        },
      });

      showToast({ text: "Produto adicionado na lista" });
      router.replace("/");
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
      <main className="mx-auto flex w-full flex-1 flex-col gap-5">
        <header className="border-b border-border pb-3">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.back()}
            className="flex size-9 items-center justify-center text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
        </header>

        <form
          ref={formRef}
          id="product-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Card className="space-y-3">
            <ProductImagePicker
              value={image}
              onChange={setImage}
              onFileChange={setImageFile}
            />
          </Card>

          <Card className="space-y-5 px-5 py-5">
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
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Tamanho, cor, voltagem, modelo..."
              disabled={busy}
            />
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
            type={isEditing ? "submit" : "button"}
            onClick={isEditing ? undefined : () => setListDialogOpen(true)}
            title={!authReady ? "Carregando..." : isEditing ? "Salvar alterações" : "Adicionar produto"}
            loading={busy}
            disabled={!authReady || busy || !name.trim()}
            className="h-[46px] w-full"
          />
        </form>
      </main>

      {listDialogOpen ? (
        <ProductListDialog
          lists={availableLists}
          selectedListId={effectiveListId}
          busy={busy}
          canSubmit={canSubmit}
          message={message}
          itemCount={(listId) => productsOf(listId).length}
          onClose={() => setListDialogOpen(false)}
          onCreateList={handleCreateListFromProduct}
          onSelectList={setSelectedListId}
        />
      ) : null}

      <BottomNav />
    </Screen>
  );
}
