export type ItemImageContentType =
  | "image/png"
  | "image/jpeg"
  | "image/jpg"
  | "image/gif";

const supportedImageContentTypes: readonly ItemImageContentType[] = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
];

export function isSupportedItemImageContentType(
  contentType: string | null | undefined,
): contentType is ItemImageContentType {
  return supportedImageContentTypes.includes(
    contentType as ItemImageContentType,
  );
}

export async function uploadItemImageToSignedUrl(
  uri: string,
  uploadUrl: string,
  contentType: ItemImageContentType,
): Promise<void> {
  const sourceResponse = await fetch(uri);
  if (!sourceResponse.ok) {
    throw new Error("Não foi possível carregar a imagem selecionada.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: await sourceResponse.blob(),
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Não foi possível enviar a imagem (${uploadResponse.status}).`,
    );
  }
}
