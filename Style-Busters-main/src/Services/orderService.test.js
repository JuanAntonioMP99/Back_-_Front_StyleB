import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import apiClient from "./apiClient";
import { buildOrderPayload, createOrder, getOrderById } from "./orderService";

describe("orderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildOrderPayload", () => {
    const items = [
      { product: { _id: "p1", price: 100 }, quantity: 2 },
      { product: { _id: "p2", price: 50 }, quantity: 1 },
    ];

    it("mapea items del carrito al contrato de POST /orders", () => {
      const payload = buildOrderPayload({
        userId: "u1",
        items,
        paymentMethodId: "pm1",
        shippingCost: 0,
      });
      expect(payload).toEqual({
        user: "u1",
        paymentMethod: "pm1",
        shippingCost: 0,
        totalPrice: 250,
        products: [
          { productId: "p1", quantity: 2, price: 100 },
          { productId: "p2", quantity: 1, price: 50 },
        ],
      });
    });

    it("suma el shippingCost al totalPrice", () => {
      const payload = buildOrderPayload({
        userId: "u1",
        items,
        paymentMethodId: "pm1",
        shippingCost: 15,
      });
      expect(payload.totalPrice).toBe(265);
      expect(payload.shippingCost).toBe(15);
    });
  });

  describe("createOrder", () => {
    it("POST /orders y devuelve la orden creada", async () => {
      apiClient.post.mockResolvedValue({ data: { _id: "o1", status: "pending" } });
      const order = await createOrder({ user: "u1", products: [] });
      expect(apiClient.post).toHaveBeenCalledWith("/orders", {
        user: "u1",
        products: [],
      });
      expect(order).toEqual({ _id: "o1", status: "pending" });
    });
  });

  describe("getOrderById", () => {
    it("GET /orders/:id", async () => {
      apiClient.get.mockResolvedValue({ data: { _id: "o1" } });
      const order = await getOrderById("o1");
      expect(apiClient.get).toHaveBeenCalledWith("/orders/o1");
      expect(order).toEqual({ _id: "o1" });
    });
  });
});
