import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/mswServer";
import { API } from "../test/handlers";
import {
  getCartByUser,
  createCart,
  replaceCart,
  clearCart,
} from "./cartService";
import { buildOrderPayload, createOrder, getOrderById } from "./orderService";

// Integración del flujo de compra a nivel de servicio: cartService/orderService
// sobre el apiClient real contra red MSW. Cubre "agregar al carrito", "actualizar",
// "crear orden" y "error al crear la orden". No requiere backend en ejecución.

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe("cartService + apiClient (MSW)", () => {
  it("createCart → 201 con el carrito creado", async () => {
    const cart = await createCart("u1", [{ product: "p1", quantity: 2 }]);

    expect(cart._id).toBe("cart1");
    expect(cart.products[0]).toMatchObject({ quantity: 2 });
  });

  it("replaceCart → carrito actualizado", async () => {
    const cart = await replaceCart("cart1", "u1", [
      { product: "p1", quantity: 3 },
    ]);

    expect(cart._id).toBe("cart1");
    expect(cart.products[0].quantity).toBe(3);
  });

  it("clearCart → resuelve (204 sin body)", async () => {
    await expect(clearCart("cart1")).resolves.toBeUndefined();
  });

  it("getCartByUser inexistente → rechazo NOT_FOUND", async () => {
    await expect(getCartByUser("nocart")).rejects.toMatchObject({
      kind: "NOT_FOUND",
      status: 404,
    });
  });
});

describe("orderService + apiClient (MSW)", () => {
  const items = [
    { product: { _id: "p1", price: 100 }, quantity: 2 },
    { product: { _id: "p2", price: 50 }, quantity: 1 },
  ];

  it("createOrder con payload construido → 201, status pending", async () => {
    const payload = buildOrderPayload({
      userId: "u1",
      items,
      paymentMethodId: "pm1",
      shippingCost: 0,
    });

    const order = await createOrder(payload);

    expect(order._id).toBe("order1");
    expect(order.status).toBe("pending");
    expect(order.totalPrice).toBe(250);
  });

  it("getOrderById → devuelve la orden", async () => {
    const order = await getOrderById("order1");

    expect(order).toMatchObject({ _id: "order1", status: "pending" });
  });

  it("error 422 al crear la orden → rechazo VALIDATION", async () => {
    server.use(
      http.post(`${API}/orders`, () =>
        HttpResponse.json({ errors: [{ path: "totalPrice" }] }, { status: 422 }),
      ),
    );

    await expect(createOrder({ user: "u1", products: [] })).rejects.toMatchObject(
      { kind: "VALIDATION", status: 422 },
    );
  });
});
