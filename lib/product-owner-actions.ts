export type ProductOwnerActionDependencies = {
  deleteProduct: (itemId: string) => Promise<void>;
  updateProductStatus: (itemId: string, status: "ACTIVE" | "ARCHIVED") => Promise<void>;
  cloneProduct: (sourceListId: string, itemId: string, targetListId: string) => Promise<void>;
  refresh: () => Promise<void>;
  removeLocalProduct: (itemId: string) => void;
};

export async function deleteOwnedProduct(itemId: string, dependencies: ProductOwnerActionDependencies) {
  await dependencies.deleteProduct(itemId);
  dependencies.removeLocalProduct(itemId);
  await dependencies.refresh();
}

export async function setOwnedProductPaused(itemId: string, paused: boolean, dependencies: ProductOwnerActionDependencies) {
  await dependencies.updateProductStatus(itemId, paused ? "ARCHIVED" : "ACTIVE");
  await dependencies.refresh();
}

export async function cloneOwnedProduct(sourceListId: string, itemId: string, targetListId: string, dependencies: ProductOwnerActionDependencies) {
  await dependencies.cloneProduct(sourceListId, itemId, targetListId);
}
