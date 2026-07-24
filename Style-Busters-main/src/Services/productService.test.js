import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient.js", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import apiClient from "./apiClient.js";
import {
  getAllProducts,
  getProductById,
  searchProducts,
} from "./productService";

describe("productService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllProducts -> GET /products y devuelve response.data", async () => {
    apiClient.get.mockResolvedValue({ data: { products: [{ _id: "1" }] } });
    const data = await getAllProducts();
    expect(apiClient.get).toHaveBeenCalledWith("/products");
    expect(data).toEqual({ products: [{ _id: "1" }] });
  });

  it("getProductById -> GET /products/:id", async () => {
    apiClient.get.mockResolvedValue({ data: { _id: "abc" } });
    const data = await getProductById("abc");
    expect(apiClient.get).toHaveBeenCalledWith("/products/abc");
    expect(data).toEqual({ _id: "abc" });
  });

  it("searchProducts -> GET /products/search sólo con filtros definidos", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    await searchProducts({ q: "zapato", minPrice: 10, inStock: true });
    expect(apiClient.get).toHaveBeenCalledWith("/products/search", {
      params: { q: "zapato", minPrice: 10, inStock: true },
    });
  });

  it("searchProducts ignora minPrice NaN", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    await searchProducts({ q: "x", minPrice: Number.NaN });
    expect(apiClient.get).toHaveBeenCalledWith("/products/search", {
      params: { q: "x" },
    });
  });
});
