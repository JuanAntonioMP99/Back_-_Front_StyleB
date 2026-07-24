import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import { createUser, createAdmin, authHeader } from "../helpers/factories.js";

// Los unitarios prueban authMiddleware e isAdmin de forma AISLADA. Este archivo
// prueba algo distinto que ningún unitario puede ver: que esos middlewares están
// realmente CABLEADOS a cada ruta. Un router al que se le olvide el middleware
// pasaría todos los unitarios igual.

const id = () => new mongoose.Types.ObjectId().toString();

// Se usan ObjectIds válidos en los paths: con un id inválido, las rutas que
// colocan la validación antes del auth responderían 422 y enmascararían el 401.
const ADMIN_ONLY = [
  ["GET", "/api/cart"],
  ["GET", `/api/cart/${id()}`],
  ["POST", "/api/categories"],
  ["PUT", `/api/categories/${id()}`],
  ["DELETE", `/api/categories/${id()}`],
  ["GET", "/api/orders"],
  ["GET", "/api/payment-methods"],
  ["GET", `/api/payment-methods/user/${id()}`],
  ["GET", `/api/payment-methods/${id()}`],
  ["GET", "/api/users"],
  ["POST", "/api/users"],
  ["PUT", `/api/users/${id()}`],
  ["DELETE", `/api/users/${id()}`],
  ["GET", "/api/wishlist"],
];

const AUTH_ONLY = [
  ["GET", `/api/cart/user/${id()}`],
  ["POST", "/api/cart"],
  ["PUT", `/api/cart/${id()}`],
  ["DELETE", `/api/cart/${id()}`],
  ["GET", `/api/orders/${id()}`],
  ["POST", "/api/orders"],
  ["PUT", `/api/orders/${id()}`],
  ["POST", "/api/payment-methods"],
  ["PUT", `/api/payment-methods/${id()}`],
  ["DELETE", `/api/payment-methods/${id()}`],
  ["GET", `/api/users/${id()}`],
  ["POST", "/api/wishlist"],
  ["DELETE", `/api/wishlist/${id()}/product`],
  ["DELETE", `/api/wishlist/${id()}`],
];

const send = (method, path, headers = {}) =>
  request(app)[method.toLowerCase()](path).set(headers);

describe("Autorización — rutas que exigen auth + admin", () => {
  it.each(ADMIN_ONLY)("%s %s responde 401 sin token", async (method, path) => {
    const res = await send(method, path);

    expect(res.status).toBe(401);
  });

  it.each(ADMIN_ONLY)(
    "%s %s responde 403 con token de customer",
    async (method, path) => {
      const customer = await createUser();

      const res = await send(method, path, authHeader(customer));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Admin access required" });
    },
  );

  it.each(ADMIN_ONLY)(
    "%s %s NO responde 401/403 con token de admin",
    async (method, path) => {
      const admin = await createAdmin();

      const res = await send(method, path, authHeader(admin));

      // No se afirma el status exacto (puede ser 200/404/422 según el caso):
      // lo que se fija es que el admin supera la barrera de autorización.
      expect([401, 403]).not.toContain(res.status);
    },
  );
});

describe("Autorización — rutas que exigen solo auth", () => {
  it.each(AUTH_ONLY)("%s %s responde 401 sin token", async (method, path) => {
    const res = await send(method, path);

    expect(res.status).toBe(401);
  });

  it.each(AUTH_ONLY)(
    "%s %s NO responde 401 con token de customer válido",
    async (method, path) => {
      const customer = await createUser();

      const res = await send(method, path, authHeader(customer));

      expect(res.status).not.toBe(401);
    },
  );
});

describe("Autorización — calidad del rechazo", () => {
  let customer;

  beforeEach(async () => {
    customer = await createUser();
  });

  it("rechaza un token con firma inválida", async () => {
    const res = await request(app)
      .get("/api/users")
      .set({ Authorization: "Bearer token.falsificado.aqui" });

    expect(res.status).toBe(401);
  });

  it("rechaza un header sin el esquema Bearer", async () => {
    const res = await request(app)
      .get("/api/users")
      .set({ Authorization: "token-suelto-sin-bearer" });

    expect(res.status).toBe(401);
  });

  it("el 403 a un customer no revela datos del recurso", async () => {
    const res = await send("GET", "/api/users", authHeader(customer));

    expect(res.status).toBe(403);
    expect(Array.isArray(res.body)).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain("password");
  });
});
