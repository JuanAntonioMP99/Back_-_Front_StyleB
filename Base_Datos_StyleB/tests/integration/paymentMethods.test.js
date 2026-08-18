import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";
import {
  createAdmin,
  createUser,
  createPaymentMethod,
  authHeader,
} from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

function validCard(user, overrides = {}) {
  return {
    user: user._id.toString(),
    type: "credit_card",
    name: "Titular",
    numCard: "4111111111111111",
    dueDate: "12/30",
    cvv: "123",
    ...overrides,
  };
}

describe("GET /api/payment-methods", () => {
  it("IT-PAY-01 — admin → 200", async () => {
    const admin = await createAdmin();
    await createPaymentMethod();

    const res = await request(app)
      .get("/api/payment-methods")
      .set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("IT-PAY-02 — customer → 403", async () => {
    const customer = await createUser();

    const res = await request(app)
      .get("/api/payment-methods")
      .set(authHeader(customer));

    expect(res.status).toBe(403);
  });

  it("IT-PAY-03 — /user/:id como admin → 200 con isDefault primero", async () => {
    const admin = await createAdmin();
    const owner = await createUser();
    await createPaymentMethod({ user: owner._id, isDefault: false });
    await createPaymentMethod({ user: owner._id, isDefault: true });

    const res = await request(app)
      .get(`/api/payment-methods/user/${owner._id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.paymentMethods).toHaveLength(2);
    expect(res.body.paymentMethods[0].isDefault).toBe(true);
  });

  it("IT-PAY-04 — /:id inexistente → 404", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .get(`/api/payment-methods/${id()}`)
      .set(authHeader(admin));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Payment method not found" });
  });
});

describe("POST /api/payment-methods", () => {
  it("IT-PAY-05 — válido → 201", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/payment-methods")
      .set(authHeader(user))
      .send(validCard(user));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ type: "credit_card", name: "Titular" });
  });

  it("IT-PAY-06 — type fuera del enum → 422", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/payment-methods")
      .set(authHeader(user))
      .send(validCard(user, { type: "bitcoin" }));

    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.path)).toContain("type");
  });

  it("IT-PAY-07 — numCard duplicado → 409", async () => {
    const user = await createUser();
    await createPaymentMethod({ user: user._id, numCard: "4000000000000002" });

    const res = await request(app)
      .post("/api/payment-methods")
      .set(authHeader(user))
      .send(validCard(user, { numCard: "4000000000000002" }));

    expect(res.status).toBe(409);
  });

  it("IT-PAY-08 — isDefault:true desmarca los demás del usuario", async () => {
    const user = await createUser();
    const first = await createPaymentMethod({ user: user._id, isDefault: true, numCard: "4000000000000010" });

    const res = await request(app)
      .post("/api/payment-methods")
      .set(authHeader(user))
      .send(validCard(user, { numCard: "4000000000000028", isDefault: true }));

    expect(res.status).toBe(201);
    const reloadedFirst = await PaymentMethod.findById(first._id);
    expect(reloadedFirst.isDefault).toBe(false);
    expect(res.body.isDefault).toBe(true);
  });

  // IT-PAY-11 (K10): hoy la respuesta incluye cvv y numCard completos en claro.
  // Correcto: nunca devolver el cvv. Hoy falla a propósito.
  it.fails("🔒 IT-PAY-11 — la respuesta NO debería exponer el cvv (K10)", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/payment-methods")
      .set(authHeader(user))
      .send(validCard(user, { numCard: "4000000000000036" }));

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("cvv");
  });
});

describe("PUT /api/payment-methods/:id", () => {
  it("IT-PAY-09 — isDefault:true desmarca los demás, no a sí mismo", async () => {
    const user = await createUser();
    const a = await createPaymentMethod({ user: user._id, isDefault: true, numCard: "4000000000000044" });
    const b = await createPaymentMethod({ user: user._id, isDefault: false, numCard: "4000000000000051" });

    const res = await request(app)
      .put(`/api/payment-methods/${b._id}`)
      .set(authHeader(user))
      .send({ isDefault: true });

    expect(res.status).toBe(200);
    expect(res.body.isDefault).toBe(true);
    expect((await PaymentMethod.findById(a._id)).isDefault).toBe(false);
  });

  // IT-PAY-12: updatePaymentMethod no comprueba propietario. Un customer puede
  // modificar el método de pago de OTRO usuario. Correcto: 403. Hoy falla.
  it.fails(
    "🔒 IT-PAY-12 — un customer NO debería poder modificar el método de otro usuario",
    async () => {
      const victima = await createUser();
      const metodo = await createPaymentMethod({ user: victima._id, numCard: "4000000000000069" });
      const atacante = await createUser();

      const res = await request(app)
        .put(`/api/payment-methods/${metodo._id}`)
        .set(authHeader(atacante))
        .send({ name: "Secuestrada" });

      expect(res.status).toBe(403);
    },
  );
});

describe("DELETE /api/payment-methods/:id", () => {
  // IT-PAY-10 (K05): deletePaymentMethod referencia `addressId` (inexistente) y
  // lee req.params.paymentMethodId (la ruta usa :id) → ReferenceError → 500 siempre.
  // Correcto: 200 al borrar o 404 si no existe. Hoy falla a propósito.
  it.fails("🔒 IT-PAY-10 — DELETE debería responder 200/404, no 500 (K05)", async () => {
    const user = await createUser();
    const metodo = await createPaymentMethod({ user: user._id, numCard: "4000000000000077" });

    const res = await request(app)
      .delete(`/api/payment-methods/${metodo._id}`)
      .set(authHeader(user));

    expect([200, 404]).toContain(res.status);
  });
});
