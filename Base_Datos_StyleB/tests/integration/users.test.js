import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import User from "../../src/models/User.js";
import {
  createAdmin,
  createUser,
  authHeader,
  PLAIN_PASSWORD,
} from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

describe("GET /api/users/:id", () => {
  it("IT-USER-05 — id inválido → 422 (validate corre antes que auth)", async () => {
    const res = await request(app).get("/api/users/no-objectid");

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

describe("POST /api/users", () => {
  it("IT-USER-06 — admin → 201 sin password", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/users")
      .set(authHeader(admin))
      .send({
        name: "Nueva",
        email: "nueva@test.com",
        password: PLAIN_PASSWORD,
        role: "customer",
      });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("password");
  });

  it("IT-USER-07 — email duplicado → 409", async () => {
    const admin = await createAdmin();
    await createUser({ email: "dup@test.com" });

    const res = await request(app)
      .post("/api/users")
      .set(authHeader(admin))
      .send({ name: "Otro", email: "dup@test.com", password: PLAIN_PASSWORD });

    expect(res.status).toBe(409);
  });

  it("IT-USER-08 — password < 6 → 422", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/users")
      .set(authHeader(admin))
      .send({ name: "Corto", email: "corto@test.com", password: "123" });

    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.path)).toContain("password");
  });

  it("IT-USER-09 — role fuera del enum → 422", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/users")
      .set(authHeader(admin))
      .send({
        name: "Rol",
        email: "rol@test.com",
        password: PLAIN_PASSWORD,
        role: "superuser",
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.map((e) => e.path)).toContain("role");
  });
});

describe("PUT /api/users/:id", () => {
  it("IT-USER-10 — con password → re-hashea (no la guarda en claro)", async () => {
    const admin = await createAdmin();
    const target = await createUser({ email: "target@test.com" });

    const res = await request(app)
      .put(`/api/users/${target._id}`)
      .set(authHeader(admin))
      .send({ name: "Actualizado", password: "NuevaPass123" });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("password");

    const stored = await User.findById(target._id);
    expect(stored.password).not.toBe("NuevaPass123");
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  // IT-USER-11: updateUser SIEMPRE hace bcrypt.hash(password); si el body no trae
  // password, hashea `undefined` → bcrypt lanza → 500. El comportamiento correcto
  // es no romper (y conservar la contraseña actual). Hoy falla a propósito.
  it.fails(
    "🔒 IT-USER-11 — PUT sin password NO debería romper ni borrar la contraseña",
    async () => {
      const admin = await createAdmin();
      const target = await createUser({ email: "keep@test.com" });
      const before = (await User.findById(target._id)).password;

      const res = await request(app)
        .put(`/api/users/${target._id}`)
        .set(authHeader(admin))
        .send({ name: "Solo nombre" });

      expect(res.status).toBe(200);
      const after = (await User.findById(target._id)).password;
      expect(after).toBe(before);
    },
  );
});

describe("DELETE /api/users/:id", () => {
  it("IT-USER-12 — admin → 204", async () => {
    const admin = await createAdmin();
    const target = await createUser();

    const res = await request(app)
      .delete(`/api/users/${target._id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(204);
  });

  it("id inexistente → 404", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .delete(`/api/users/${id()}`)
      .set(authHeader(admin));

    expect(res.status).toBe(404);
  });
});
