import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "../test/mswServer";
import { login } from "./authService";
import { getAllProducts, getProductById, searchProducts } from "./productService";
import { getCartByUser, createCart } from "./cartService";
import { createOrder, getOrderById } from "./orderService";

// Pruebas de CONTRATO dirigidas por el consumidor (Fase 8): fijan la FORMA que el
// frontend espera de cada respuesta de la API. Los handlers MSW (src/test/handlers.js)
// modelan la forma REAL del backend, verificada a su vez por los tests de integración
// del backend (supertest). Si el backend cambia el contrato, aquí y allá saltan.
// No se añade dependencia de esquemas (Zod/JSON Schema): validaciones locales bastan
// para el tamaño del contrato actual. Tabla y riesgos en docs/testing/contracts.md.

const isStr = (v) => typeof v === "string" && v.length > 0;
const isNum = (v) => typeof v === "number" && !Number.isNaN(v);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe("Contrato API ↔ frontend", () => {
  it("POST /auth/login → { token, refreshToken }", async () => {
    const res = await login({ email: "ada@mail.com", password: "secret123" });
    expect(isStr(res.token)).toBe(true);
    expect(isStr(res.refreshToken)).toBe(true);
  });

  it("GET /products → array de { _id, name, price }", async () => {
    const products = await getAllProducts();
    expect(Array.isArray(products)).toBe(true);
    for (const p of products) {
      expect(isStr(p._id)).toBe(true);
      expect(isStr(p.name)).toBe(true);
      expect(isNum(p.price)).toBe(true);
    }
  });

  it("GET /products/:id → { _id, name, price }", async () => {
    const p = await getProductById("p1");
    expect(isStr(p._id)).toBe(true);
    expect(isStr(p.name)).toBe(true);
    expect(isNum(p.price)).toBe(true);
  });

  it("GET /products/search → { products, pagination:{...} }", async () => {
    const data = await searchProducts({ q: "camisa" });
    expect(Array.isArray(data.products)).toBe(true);
    for (const key of [
      "currentPage",
      "totalPages",
      "totalResults",
      "hasNext",
      "hasPrev",
    ]) {
      expect(data.pagination).toHaveProperty(key);
    }
  });

  it("GET /cart/user/:id → { _id, products:[{ product, quantity }] }", async () => {
    const cart = await getCartByUser("u1");
    expect(isStr(cart._id)).toBe(true);
    expect(Array.isArray(cart.products)).toBe(true);
    expect(cart.products[0]).toHaveProperty("product");
    expect(isNum(cart.products[0].quantity)).toBe(true);
  });

  it("POST /cart → { _id, products }", async () => {
    const cart = await createCart("u1", [{ product: "p1", quantity: 1 }]);
    expect(isStr(cart._id)).toBe(true);
    expect(Array.isArray(cart.products)).toBe(true);
  });

  it("POST /orders → { _id, status, paymentStatus, totalPrice }", async () => {
    const order = await createOrder({
      user: "u1",
      products: [{ productId: "p1", quantity: 1, price: 100 }],
      paymentMethod: "pm1",
      totalPrice: 100,
    });
    expect(isStr(order._id)).toBe(true);
    expect(order.status).toBe("pending");
    expect(order.paymentStatus).toBe("pending");
    expect(isNum(order.totalPrice)).toBe(true);
  });

  it("GET /orders/:id → { _id, status }", async () => {
    const order = await getOrderById("order1");
    expect(isStr(order._id)).toBe(true);
    expect(isStr(order.status)).toBe(true);
  });
});
