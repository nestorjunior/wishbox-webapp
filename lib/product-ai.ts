export type ProductGuess = {
  name: string;
  store: string;
  detail: string;
  price: number;
};

function getErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  for (const key of ["message", "error", "detail"]) {
    const message = getErrorMessage(record[key]);
    if (message) return message;
  }

  return undefined;
}

function isProductGuess(value: unknown): value is ProductGuess {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.store === "string" &&
    typeof record.detail === "string" &&
    typeof record.price === "number"
  );
}

function parseResponseBody(text: string): unknown {
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text.trim();
  }
}

function limitMessage(value: string) {
  return value.length > 240 ? `${value.slice(0, 240)}...` : value;
}

/**
 * Chama a API do backend (rota /api/product-ai) para deduzir nome, loja, detalhe e preço
 * a partir de uma foto ou link. Configure NEXT_PUBLIC_API_URL no .env.
 */
export async function guessProduct(
  input: { image?: string; url?: string },
  token: string,
): Promise<ProductGuess> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base)
    throw new Error(
      "Configure NEXT_PUBLIC_API_URL para usar o preenchimento automático.",
    );
  const res = await fetch(`${base}/api/product-ai`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const bodyText = await res.text();
  const json = parseResponseBody(bodyText);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "Não encontramos essa página de produto. Verifique se o link está completo e tente novamente.",
      );
    }
    const message =
      getErrorMessage(json) ?? `Erro ao preencher produto (${res.status}).`;
    throw new Error(message);
  }

  if (!json || typeof json !== "object") {
    throw new Error("A resposta da IA está vazia ou inválida.");
  }

  if (!isProductGuess(json)) {
    const responseMessage =
      typeof json === "string" ? limitMessage(json) : undefined;
    throw new Error(
      responseMessage ?? "A IA retornou dados incompletos para este produto.",
    );
  }

  return json;
}
