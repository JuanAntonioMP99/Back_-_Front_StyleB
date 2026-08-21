import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Address from "../../src/models/Address.js";
import { createUser, createAddress, authHeader } from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

function validAddress(overrides = {}) {
  return {
    address: "Calle 1",
    city: "Aguascalientes",
    state: "Aguascalientes",
    postalCode: "20000",
    country: "México",
    phone: "4491234567",
    ...overrides,
  };
}

// K04: import ESM sin extensión + rutas nunca montadas. Este archivo cubre el
// dominio completo ahora que addressRoutes.js está montado bajo /api/addresses.

describe("GET /api/addresses", () => {
  it("IT-ADDR-01 — devuelve solo las direcciones del usuario autenticado", async () => {
    const user = await createUser();
    const otro = await createUser();
    await createAddress({ user: user._id });
    await createAddress({ user: otro._id });

    const res = await request(app)
      .get("/api/addresses")
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.addresses).toHaveLength(1);
    expect(res.body.addresses[0].user).toBe(user._id.toString());
  });

  it("IT-ADDR-02 — 401 sin token", async () => {
    const res = await request(app).get("/api/addresses");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/addresses/:addressId", () => {
  it("IT-ADDR-03 — dueño → 200", async () => {
    const user = await createUser();
    const address = await createAddress({ user: user._id });

    const res = await request(app)
      .get(`/api/addresses/${address._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(address._id.toString());
  });

  it("IT-ADDR-04 — dirección de otro usuario → 404 (no revela existencia)", async () => {
    const user = await createUser();
    const otro = await createUser();
    const address = await createAddress({ user: otro._id });

    const res = await request(app)
      .get(`/api/addresses/${address._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
  });

  it("IT-ADDR-14 — 401 sin token", async () => {
    const address = await createAddress();

    const res = await request(app).get(`/api/addresses/${address._id}`);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/addresses", () => {
  it("IT-ADDR-05 — válida → 201 y queda ligada al usuario autenticado", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/addresses")
      .set(authHeader(user))
      .send(validAddress());

    expect(res.status).toBe(201);
    expect(res.body.user).toBe(user._id.toString());
  });

  it("IT-ADDR-06 — ignora un `user` distinto en el body (no se puede crear a nombre de otro)", async () => {
    const user = await createUser();
    const otro = await createUser();

    const res = await request(app)
      .post("/api/addresses")
      .set(authHeader(user))
      .send(validAddress({ user: otro._id.toString() }));

    expect(res.status).toBe(201);
    expect(res.body.user).toBe(user._id.toString());
  });

  it("IT-ADDR-07 — faltan campos requeridos → 422", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/addresses")
      .set(authHeader(user))
      .send({ address: "Calle 1" });

    expect(res.status).toBe(422);
  });

  it("IT-ADDR-08 — isDefault:true desmarca las demás del usuario", async () => {
    const user = await createUser();
    const first = await createAddress({ user: user._id, isDefault: true });

    const res = await request(app)
      .post("/api/addresses")
      .set(authHeader(user))
      .send(validAddress({ isDefault: true }));

    expect(res.status).toBe(201);
    expect((await Address.findById(first._id)).isDefault).toBe(false);
  });

  it("IT-ADDR-15 — 401 sin token", async () => {
    const res = await request(app).post("/api/addresses").send(validAddress());

    expect(res.status).toBe(401);
  });
});

describe("PUT /api/addresses/:addressId", () => {
  it("IT-ADDR-09 — dueño → 200 y actualiza los campos", async () => {
    const user = await createUser();
    const address = await createAddress({ user: user._id });

    const res = await request(app)
      .put(`/api/addresses/${address._id}`)
      .set(authHeader(user))
      .send(validAddress({ city: "Guadalajara" }));

    expect(res.status).toBe(200);
    expect(res.body.city).toBe("Guadalajara");
  });

  it("IT-ADDR-10 — dirección de otro usuario → 404", async () => {
    const user = await createUser();
    const otro = await createUser();
    const address = await createAddress({ user: otro._id });

    const res = await request(app)
      .put(`/api/addresses/${address._id}`)
      .set(authHeader(user))
      .send(validAddress());

    expect(res.status).toBe(404);
  });

  it("IT-ADDR-16 — 401 sin token", async () => {
    const address = await createAddress();

    const res = await request(app)
      .put(`/api/addresses/${address._id}`)
      .send(validAddress());

    expect(res.status).toBe(401);
  });

  it("IT-ADDR-18 — isDefault:true desmarca las demás direcciones del mismo usuario", async () => {
    const user = await createUser();
    const first = await createAddress({ user: user._id, isDefault: true });
    const second = await createAddress({ user: user._id, isDefault: false });

    const res = await request(app)
      .put(`/api/addresses/${second._id}`)
      .set(authHeader(user))
      .send(validAddress({ isDefault: true }));

    expect(res.status).toBe(200);
    expect(res.body.isDefault).toBe(true);
    expect((await Address.findById(first._id)).isDefault).toBe(false);
    expect((await Address.findById(second._id)).isDefault).toBe(true);
  });
});

describe("DELETE /api/addresses/:addressId", () => {
  it("IT-ADDR-11 — dueño → 200 y la elimina", async () => {
    const user = await createUser();
    const address = await createAddress({ user: user._id });

    const res = await request(app)
      .delete(`/api/addresses/${address._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(await Address.findById(address._id)).toBeNull();
  });

  it("IT-ADDR-12 — dirección de otro usuario → 404, no se borra", async () => {
    const user = await createUser();
    const otro = await createUser();
    const address = await createAddress({ user: otro._id });

    const res = await request(app)
      .delete(`/api/addresses/${address._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
    expect(await Address.findById(address._id)).not.toBeNull();
  });

  it("IT-ADDR-13 — inexistente → 404", async () => {
    const user = await createUser();

    const res = await request(app)
      .delete(`/api/addresses/${id()}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
  });

  it("IT-ADDR-17 — 401 sin token", async () => {
    const address = await createAddress();

    const res = await request(app).delete(`/api/addresses/${address._id}`);

    expect(res.status).toBe(401);
  });
});
