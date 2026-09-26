import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cloneOwnedProduct,
  deleteOwnedProduct,
  setOwnedProductPaused,
  type ProductOwnerActionDependencies,
} from "../../lib/product-owner-actions";

function dependencies(events: string[]): ProductOwnerActionDependencies {
  return {
    deleteProduct: async (id) => { events.push(`DELETE ${id}`); },
    updateProductStatus: async (id, status) => { events.push(`PATCH ${id} ${status}`); },
    cloneProduct: async (source, id, target) => { events.push(`CLONE ${source} ${id} ${target}`); },
    refresh: async () => { events.push("REFRESH"); },
    removeLocalProduct: (id) => { events.push(`REMOVE ${id}`); },
  };
}

describe("product owner actions", () => {
  it("deletes in the API before removing local state and refreshing", async () => {
    const events: string[] = [];
    await deleteOwnedProduct("item-1", dependencies(events));
    assert.deepEqual(events, ["DELETE item-1", "REMOVE item-1", "REFRESH"]);
  });

  it("does not remove local state when deletion fails", async () => {
    const events: string[] = [];
    const deps = dependencies(events);
    deps.deleteProduct = async () => { throw new Error("API error"); };
    await assert.rejects(() => deleteOwnedProduct("item-1", deps), /API error/);
    assert.deepEqual(events, []);
  });

  it("maps pause and resume to the API statuses and refreshes", async () => {
    const events: string[] = [];
    const deps = dependencies(events);
    await setOwnedProductPaused("item-1", true, deps);
    await setOwnedProductPaused("item-1", false, deps);
    assert.deepEqual(events, ["PATCH item-1 ARCHIVED", "REFRESH", "PATCH item-1 ACTIVE", "REFRESH"]);
  });

  it("clones into the selected destination list without replacing the current catalog", async () => {
    const events: string[] = [];
    await cloneOwnedProduct("list-a", "item-1", "list-b", dependencies(events));
    assert.deepEqual(events, ["CLONE list-a item-1 list-b"]);
  });
});
