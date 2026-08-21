import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient.js", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import apiClient from "./apiClient.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getProductsByCategoryAndChildren,
  updateCategory,
} from "./categoryService";

describe("categoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllCategories -> GET /categories y devuelve response.data", async () => {
    apiClient.get.mockResolvedValue({ data: [{ _id: "c1" }] });
    const data = await getAllCategories();
    expect(apiClient.get).toHaveBeenCalledWith("/categories");
    expect(data).toEqual([{ _id: "c1" }]);
  });

  it("getCategoryById -> GET /categories/:id", async () => {
    apiClient.get.mockResolvedValue({ data: { _id: "abc" } });
    const data = await getCategoryById("abc");
    expect(apiClient.get).toHaveBeenCalledWith("/categories/abc");
    expect(data).toEqual({ _id: "abc" });
  });

  it("getProductsByCategoryAndChildren -> GET con page/limit por defecto", async () => {
    apiClient.get.mockResolvedValue({ data: { products: [] } });
    await getProductsByCategoryAndChildren("c1");
    expect(apiClient.get).toHaveBeenCalledWith("/categories/c1/products", {
      params: { page: 1, limit: 10 },
    });
  });

  it("getProductsByCategoryAndChildren -> respeta page/limit provistos", async () => {
    apiClient.get.mockResolvedValue({ data: {} });
    await getProductsByCategoryAndChildren("c1", { page: 3, limit: 25 });
    expect(apiClient.get).toHaveBeenCalledWith("/categories/c1/products", {
      params: { page: 3, limit: 25 },
    });
  });

  it("createCategory -> POST /categories con el body", async () => {
    const body = { name: "Ropa" };
    apiClient.post.mockResolvedValue({ data: { _id: "c1", ...body } });
    const data = await createCategory(body);
    expect(apiClient.post).toHaveBeenCalledWith("/categories", body);
    expect(data).toEqual({ _id: "c1", name: "Ropa" });
  });

  it("updateCategory -> PUT /categories/:id con el body", async () => {
    const body = { name: "Nueva" };
    apiClient.put.mockResolvedValue({ data: { _id: "c1", ...body } });
    await updateCategory("c1", body);
    expect(apiClient.put).toHaveBeenCalledWith("/categories/c1", body);
  });

  it("deleteCategory -> DELETE /categories/:id", async () => {
    apiClient.delete.mockResolvedValue({ data: {} });
    await deleteCategory("c1");
    expect(apiClient.delete).toHaveBeenCalledWith("/categories/c1");
  });
});
