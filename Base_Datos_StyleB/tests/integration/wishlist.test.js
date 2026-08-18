import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import WishList from "../../src/models/WishList.js";
import {
  createAdmin,
  createUser,
  createProduct,
  createWishlist,
  authHeader,
} from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

describe("GET /api/wishlist", () => {
  it("IT-WISH-01 — admin → 200", async () => {
    const admin = await createAdmin();
    await createWishlist();

    const res = await request(app).get("/api/wishlist").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("IT-WISH-02 — customer → 403", async () => {
    const customer = await createUser();

    const res = await request(app).get("/api/wishlist").set(authHeader(customer));

    expect(res.status).toBe(403);
  });

  it("IT-WISH-03 — /user/:id sin wishlist → 404", async () => {
    const user = await createUser();

    const res = await request(app)
      .get(`/api/wishlist/user/${user._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Wishlist not found" });
  });
});

describe("POST /api/wishlist", () => {
  it("IT-WISH-04 — crea la wishlist si no existe → 200", async () => {
    const user = await createUser();
    const product = await createProduct();

    const res = await request(app)
      .post("/api/wishlist")
      .set(authHeader(user))
      .send({ userId: user._id.toString(), productId: product._id.toString() });

    expect(res.status).toBe(200);

    const stored = await WishList.findOne({ user: user._id });
    expect(stored.products).toHaveLength(1);
    expect(stored.products[0].toString()).toBe(product._id.toString());
  });

  it("IT-WISH-05 — producto ya presente → 200 sin duplicar", async () => {
    const user = await createUser();
    const product = await createProduct();
    await createWishlist({ user: user._id, products: [product._id] });

    const res = await request(app)
      .post("/api/wishlist")
      .set(authHeader(user))
      .send({ userId: user._id.toString(), productId: product._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Product already in wishlist");

    const stored = await WishList.findOne({ user: user._id });
    expect(stored.products).toHaveLength(1);
  });

  // IT-WISH-08 (K06): WishList.products declara ref:"User"; al poblar un id de
  // Product no encuentra usuario → null. Correcto: poblar el Product real. Hoy falla.
  it.fails(
    "🔒 IT-WISH-08 — products debería poblar Product, no User (K06)",
    async () => {
      const user = await createUser();
      const product = await createProduct({ name: "Deseado" });

      const res = await request(app)
        .post("/api/wishlist")
        .set(authHeader(user))
        .send({ userId: user._id.toString(), productId: product._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.products[0]).toMatchObject({ name: "Deseado" });
    },
  );
});

describe("DELETE /api/wishlist", () => {
  it("IT-WISH-06 — /:id/product elimina solo ese producto → 200", async () => {
    const user = await createUser();
    const p1 = await createProduct();
    const p2 = await createProduct();
    const wishlist = await createWishlist({
      user: user._id,
      products: [p1._id, p2._id],
    });

    const res = await request(app)
      .delete(`/api/wishlist/${wishlist._id}/product`)
      .set(authHeader(user))
      .send({ productId: p1._id.toString() });

    expect(res.status).toBe(200);

    const stored = await WishList.findById(wishlist._id);
    expect(stored.products).toHaveLength(1);
    expect(stored.products[0].toString()).toBe(p2._id.toString());
  });

  it("IT-WISH-07 — /:id → 204", async () => {
    const user = await createUser();
    const wishlist = await createWishlist({ user: user._id });

    const res = await request(app)
      .delete(`/api/wishlist/${wishlist._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(204);
  });

  it("/:id inexistente → 404", async () => {
    const user = await createUser();

    const res = await request(app)
      .delete(`/api/wishlist/${id()}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
  });
});
