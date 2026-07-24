import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import apiClient from "./apiClient";
import {
  clearCart,
  createCart,
  getCartByUser,
  replaceCart,
} from "./cartService";

describe("cartService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCartByUser -> GET /cart/user/:id", async () => {
    apiClient.get.mockResolvedValue({ data: { _id: "c1", products: [] } });
    const data = await getCartByUser("u1");
    expect(apiClient.get).toHaveBeenCalledWith("/cart/user/u1");
    expect(data).toEqual({ _id: "c1", products: [] });
  });

  it("createCart -> POST /cart con {user, products}", async () => {
    const products = [{ product: "p1", quantity: 2 }];
    apiClient.post.mockResolvedValue({ data: { _id: "c1" } });
    const data = await createCart("u1", products);
    expect(apiClient.post).toHaveBeenCalledWith("/cart", {
      user: "u1",
      products,
    });
    expect(data).toEqual({ _id: "c1" });
  });

  it("replaceCart -> PUT /cart/:id con {user, products}", async () => {
    const products = [{ product: "p1", quantity: 3 }];
    apiClient.put.mockResolvedValue({ data: { _id: "c1" } });
    await replaceCart("c1", "u1", products);
    expect(apiClient.put).toHaveBeenCalledWith("/cart/c1", {
      user: "u1",
      products,
    });
  });

  it("clearCart -> DELETE /cart/:id", async () => {
    apiClient.delete.mockResolvedValue({ data: {} });
    await clearCart("c1");
    expect(apiClient.delete).toHaveBeenCalledWith("/cart/c1");
  });
});
