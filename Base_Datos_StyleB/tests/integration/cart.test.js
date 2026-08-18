import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import {
  createAdmin,
  createUser,
  createProduct,
  createCart,
  authHeader,
} from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

describe("GET /api/cart", () => {
  it("IT-CART-01 — admin → 200 con user y products.product poblados", async () => {
    const admin = await createAdmin();
    const owner = await createUser();
    const product = await createProduct();
    await createCart({
      user: owner._id,
      products: [{ product: product._id, quantity: 2 }],
    });

    const res = await request(app).get("/api/cart").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].user).toMatchObject({ _id: owner._id.toString() });
    expect(res.body[0].products[0].product).toMatchObject({ _id: product._id.toString() });
  });

  it("IT-CART-02 — customer → 403", async () => {
    const customer = await createUser();

    const res = await request(app).get("/api/cart").set(authHeader(customer));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/cart/user/:id", () => {
  it("IT-CART-03 — autenticado → 200", async () => {
    const owner = await createUser();
    const product = await createProduct();
    await createCart({
      user: owner._id,
      products: [{ product: product._id, quantity: 1 }],
    });

    const res = await request(app)
      .get(`/api/cart/user/${owner._id}`)
      .set(authHeader(owner));

    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(owner._id.toString());
  });

  it("IT-CART-04 — sin carrito → 404", async () => {
    const user = await createUser();

    const res = await request(app)
      .get(`/api/cart/user/${user._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "No cart found for this user" });
  });

  // IT-CART-12: getCartByUser no compara el dueño del carrito con req.user. Un
  // customer puede leer el carrito de OTRO usuario pasando su id. Correcto: 403.
  it.fails(
    "🔒 IT-CART-12 — un customer NO debería poder leer el carrito de otro usuario",
    async () => {
      const victima = await createUser();
      const product = await createProduct();
      await createCart({
        user: victima._id,
        products: [{ product: product._id, quantity: 1 }],
      });
      const atacante = await createUser();

      const res = await request(app)
        .get(`/api/cart/user/${victima._id}`)
        .set(authHeader(atacante));

      expect(res.status).toBe(403);
    },
  );
});

describe("POST /api/cart", () => {
  it("IT-CART-05 — payload válido → 201 con poblados", async () => {
    const user = await createUser();
    const product = await createProduct();

    const res = await request(app)
      .post("/api/cart")
      .set(authHeader(user))
      .send({
        user: user._id.toString(),
        products: [{ product: product._id.toString(), quantity: 3 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.products[0].product).toMatchObject({ _id: product._id.toString() });
  });

  it("IT-CART-06 — quantity < 1 → 422 (validador)", async () => {
    const user = await createUser();
    const product = await createProduct();

    const res = await request(app)
      .post("/api/cart")
      .set(authHeader(user))
      .send({
        user: user._id.toString(),
        products: [{ product: product._id.toString(), quantity: 0 }],
      });

    expect(res.status).toBe(422);
  });

  // IT-CART-10 (K09): POST sin products supera el validador (products es opcional)
  // y el controller responde 404. Lo correcto sería 400. Hoy falla a propósito.
  it.fails("🔒 IT-CART-10 — POST sin products debería ser 400 (hoy 404)", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/cart")
      .set(authHeader(user))
      .send({ user: user._id.toString() });

    expect(res.status).toBe(400);
  });
});

describe("PUT / DELETE /api/cart/:id", () => {
  it("IT-CART-07 — PUT → 200 actualizado", async () => {
    const user = await createUser();
    const product = await createProduct();
    const cart = await createCart({
      user: user._id,
      products: [{ product: product._id, quantity: 1 }],
    });

    const res = await request(app)
      .put(`/api/cart/${cart._id}`)
      .set(authHeader(user))
      .send({
        user: user._id.toString(),
        products: [{ product: product._id.toString(), quantity: 5 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.products[0].quantity).toBe(5);
  });

  it("IT-CART-08 — PUT inexistente → 404", async () => {
    const user = await createUser();
    const product = await createProduct();

    const res = await request(app)
      .put(`/api/cart/${id()}`)
      .set(authHeader(user))
      .send({
        user: user._id.toString(),
        products: [{ product: product._id.toString(), quantity: 1 }],
      });

    expect(res.status).toBe(404);
  });

  it("IT-CART-09 — DELETE → 204", async () => {
    const user = await createUser();
    const cart = await createCart({ user: user._id });

    const res = await request(app)
      .delete(`/api/cart/${cart._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(204);
  });

  // IT-CART-11 (K09): deleteCart responde 400 (no 404) cuando el id no existe.
  it.fails("🔒 IT-CART-11 — DELETE inexistente debería ser 404 (hoy 400)", async () => {
    const user = await createUser();

    const res = await request(app)
      .delete(`/api/cart/${id()}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
  });
});
