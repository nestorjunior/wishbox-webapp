export const ADD_PRODUCT_DRAFT_KEY = "wishbox:add-product-draft";

export type AddProductDraft = {
  name: string;
  price: string;
  store: string;
  detail: string;
  image: string;
};

export function saveAddProductDraft(draft: AddProductDraft): void {
  try {
    window.sessionStorage.setItem(ADD_PRODUCT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Continue the navigation even when storage is unavailable (for example,
    // when the browser blocks storage in a private context).
  }
}

export function consumeAddProductDraft(): AddProductDraft | null {
  let serializedDraft: string | null;

  try {
    serializedDraft = window.sessionStorage.getItem(ADD_PRODUCT_DRAFT_KEY);
  } catch {
    return null;
  }

  if (!serializedDraft) {
    return null;
  }

  try {
    window.sessionStorage.removeItem(ADD_PRODUCT_DRAFT_KEY);
  } catch {
    // The draft can still be restored even if the browser prevents cleanup.
  }

  try {
    const draft = JSON.parse(serializedDraft) as Partial<AddProductDraft>;

    if (
      typeof draft.name !== "string" ||
      typeof draft.price !== "string" ||
      typeof draft.store !== "string" ||
      typeof draft.detail !== "string" ||
      typeof draft.image !== "string"
    ) {
      return null;
    }

    return draft as AddProductDraft;
  } catch {
    return null;
  }
}
