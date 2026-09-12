"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Link as LinkIcon } from "lucide-react";

import { Button, Card, Field } from "@/components/ui";
import { FormHeader } from "@/components/FormHeader";
import { ProductImagePicker } from "@/components/ProductImagePicker";
import { Screen } from "@/components/Screen";

import { addItemToList, createItem } from "@/lib/api";
import { auth, uploadImageFileToStorage } from "@/lib/firebase";
import { useWishbox } from "@/store/wishbox-store";

function createImageFileName(file: File): string {
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const safeExtension = /^[a-z0-9]+$/.test(extension)
    ? extension
    : "jpg";

  return `${crypto.randomUUID()}.${safeExtension}`;
}

function formatCurrencyBR(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const cents = Number(digits) / 100;

  return cents.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyBR(value: string): number {
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".");

  return Number(normalized) || 0;
}

export default function AddProductPage() {
  const router = useRouter();

  const {
    editableLists,
    dispatch,
    authReady,
    backendUser,
  } = useWishbox();

  const [listId, setListId] = useState(editableLists[0]?.id ?? "");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [detail, setDetail] = useState("");
  const [link, setLink] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth?.currentUser || !listId) {
      setMessage(
        "Escolha uma lista e entre novamente para salvar o produto.",
      );
      return;
    }

    if (!name.trim()) {
      setMessage("Informe o nome do produto.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const token = await auth.currentUser.getIdToken();

      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadImageFileToStorage(
          imageFile,
          createImageFileName(imageFile),
        );
      }

      const priceValue = parseCurrencyBR(price);

      const created = await createItem(token, {
        title: name.trim(),

        description:
          [
            detail.trim(),
            store.trim() ? `Loja: ${store.trim()}` : "",
          ]
            .filter(Boolean)
            .join("\n") || undefined,

        externalUrl: link.trim() || undefined,

        imageExternalUrl: imageUrl,

        priceAmount:
          priceValue > 0 ? priceValue.toFixed(2) : undefined,

        priceCurrency: priceValue > 0 ? "BRL" : undefined,

        status: "ACTIVE",
        priority: "MEDIUM",
      });

      await addItemToList(token, {
        listId,
        itemId: created.id,
      });

      dispatch({
        type: "product/create",
        product: {
          id: created.id,
          listId,
          name: name.trim(),
          store: store.trim(),
          detail: detail.trim(),
          price: priceValue,
          link: link.trim(),
          note: "",
          emoji: "🎁",
          image: imageUrl,
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

      router.push(`/list/${listId}`);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);

      setMessage(
        "Não foi possível adicionar o produto agora. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col gap-4">
        <FormHeader />

        <div className="mt-1 space-y-1">
          <h1 className="text-xl font-bold text-foreground">
            Adicionar produto
          </h1>

          <p className="text-sm leading-5 text-muted">
            Cadastre algo que você gostaria de ganhar.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Card className="space-y-3">
            <ProductImagePicker
              value={imageFile}
              onChange={setImageFile}
              onError={setMessage}
            />

            {/* <Field
              placeholder="https://.../imagem.jpg"
              value=""
              readOnly
              aria-label="URL da imagem"
              className="hidden"
            /> */}
          </Card>

          <Card className="space-y-3">
            <Field
              label="Nome do produto"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Fone de ouvido"
              required
            />

            <Field
              label="Preço (R$)"
              value={price}
              onChange={(event) => {
                setPrice(formatCurrencyBR(event.target.value));
              }}
              inputMode="numeric"
              placeholder="0,00"
            />

            <Field
              label="Loja"
              value={store}
              onChange={(event) => setStore(event.target.value)}
              placeholder="Ex.: Loja Tech"
            />

            <Field
              label="Detalhe"
              multiline
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Tamanho, cor, modelo..."
            />

            <Field
              label="Link do produto"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://loja.com/produto"
              icon={<LinkIcon size={18} className="text-muted" />}
            />

            <Field
              label="Adicionar à lista"
              as="select"
              value={listId}
              onChange={(event) => setListId(event.target.value)}
            >
              <option value="">Selecione uma lista</option>

              {editableLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Field>
          </Card>

          {message ? (
            <p className="rounded-lg bg-tint-rose px-4 py-3 text-sm text-danger">
              {message}
            </p>
          ) : null}

          <Button
            title="Adicionar produto"
            type="submit"
            loading={busy}
            disabled={busy}
            className="w-full"
          />
        </form>
      </main>
    </Screen>
  );
}