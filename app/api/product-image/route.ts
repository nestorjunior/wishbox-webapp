import { NextRequest, NextResponse } from "next/server";
import { requestItemImageUploadUrl, updateItem } from "@/lib/api";
import { isSupportedItemImageContentType } from "@/lib/item-image-upload";

// Proxies the storage upload server-side to avoid browser CORS restrictions on the signed URL.
export async function POST(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 401 });
  }

  const formData = await request.formData();
  const itemId = formData.get("itemId");
  const file = formData.get("file");

  if (typeof itemId !== "string" || !itemId) {
    return NextResponse.json({ error: "itemId ausente." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  }

  if (!isSupportedItemImageContentType(file.type)) {
    return NextResponse.json(
      { error: "Formato de imagem não suportado." },
      { status: 400 },
    );
  }

  try {
    const { uploadUrl, storagePath } = await requestItemImageUploadUrl(
      token,
      itemId,
      file.type,
    );

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: await file.arrayBuffer(),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Falha ao enviar imagem (${uploadResponse.status}).`);
    }

    const updatedItem = await updateItem(token, itemId, {
      imageStoragePath: storagePath,
    });

    return NextResponse.json({ imageUrl: updatedItem.imageUrl ?? null });
  } catch (error) {
    console.error("Erro ao enviar imagem do produto:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar a imagem." },
      { status: 500 },
    );
  }
}
