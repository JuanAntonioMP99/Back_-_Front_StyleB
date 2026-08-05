import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import {
  createAdmin,
  createUser,
  createProduct,
  createPaymentMethod,
  createOrder,
  authHeader,
} from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

async function validOrderPayload(owner) {
  const product = await createProduct();
  const pm = await createPaymentMethod({ user: owner._id });
  return {
    user: owner._id.toString(),
    products: [{ productId: product._id.toString(), quantity: 1, price: 100 }],
    paymentMethod: pm._id.toString(),
    totalPrice: 100,
  };
}

describe("GET /api/orders", () => {
  it("IT-ORD-01 — admin → 200 con poblados", async () => {
    const admin = await createAdmin();
    await createOrder();

    const res = await request(app).get("/api/orders").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("IT-ORD-02 — customer → 403", async () => {
    const customer = await createUser();

    const res = await request(app).get("/api/orders").set(authHeader(customer));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/orders/:id", () => {
  it("IT-ORD-03 — autenticado → 200", async () => {
    const owner = await createUser();
    const order = await createOrder({ user: owner._id });

    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set(authHeader(owner));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(order._id.toString());
  });

  it("IT-ORD-04 — inexistente → 404", async () => {
    const user = await createUser();

    const res = await request(app)
      .get(`/api/orders/${id()}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Order not found" });
  });

  // IT-ORD-10: getOrderById no comprueba propietario. Un customer puede leer la
  // orden de otro usuario. Correcto: 403. Hoy falla a propósito.
  it.fails(
    "🔒 IT-ORD-10 — un customer NO debería poder leer la orden de otro usuario",
    async () => {
      const victima = await createUser();
      const order = await createOrder({ user: victima._id });
      const atacante = await createUser();

      const res = await request(app)
        .get(`/api/orders/${order._id}`)
        .set(authHeader(atacante));

      expect(res.status).toBe(403);
    },
  );
});

describe("POST /api/orders", () => {
  it("IT-ORD-05 — válido → 201 con status/paymentStatus por defecto", async () => {
    const owner = await createUser();
    const payload = await validOrderPayload(owner);

    const res = await request(app)
      .post("/api/orders")
      .set(authHeader(owner))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.paymentStatus).toBe("pending");
    expect(res.body.shippingCost).toBe(0);
  });

  it("IT-ORD-06 — sin paymentMethod ni totalPrice → 422", async () => {
    const owner = await createUser();
    const product = await createProduct();

    const res = await request(app)
      .post("/api/orders")
      .set(authHeader(owner))
      .send({
        user: owner._id.toString(),
        products: [{ productId: product._id.toString(), quantity: 1, price: 100 }],
      });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("paymentMethod");
    expect(fields).toContain("totalPrice");
  });

  // IT-ORD-11: createOrder guarda el totalPrice del body sin verificarlo contra
  // el precio real de los productos. Un cliente puede pagar 1 por productos de 100.
  // Correcto: el total persistido debería reflejar el precio real. Hoy falla.
  it.fails(
    "🔒 IT-ORD-11 — totalPrice del body NO debería aceptarse sin verificar",
    async () => {
      const owner = await createUser();
      const product = await createProduct({ price: 100 });

      const res = await request(app)
        .post("/api/orders")
        .set(authHeader(owner))
        .send({
          user: owner._id.toString(),
          products: [{ productId: product._id.toString(), quantity: 1, price: 100 }],
          paymentMethod: (await createPaymentMethod({ user: owner._id }))._id.toString(),
          totalPrice: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.totalPrice).toBe(100);
    },
  );
});

describe("PUT /api/orders/:id", () => {
  it("IT-ORD-07 — cambia status → 200", async () => {
    const owner = await createUser();
    const order = await createOrder({ user: owner._id });

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set(authHeader(owner))
      .send({ status: "shipped" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("shipped");
  });

  it("IT-ORD-08 — status fuera del enum → 422", async () => {
    const owner = await createUser();
    const order = await createOrder({ user: owner._id });

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set(authHeader(owner))
      .send({ status: "teleported" });

    expect(res.status).toBe(422);
  });

  // IT-ORD-09 (K09): updateOrderStatus responde 204 CON body cuando no encuentra
  // la orden (204 no debe llevar cuerpo). Correcto: 404. Hoy falla a propósito.
  it.fails("🔒 IT-ORD-09 — PUT inexistente debería ser 404 (hoy 204)", async () => {
    const user = await createUser();

    const res = await request(app)
      .put(`/api/orders/${id()}`)
      .set(authHeader(user))
      .send({ status: "shipped" });

    expect(res.status).toBe(404);
  });
});
