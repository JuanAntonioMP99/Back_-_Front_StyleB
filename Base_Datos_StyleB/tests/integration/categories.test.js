import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import { createAdmin, createUser, createCategory, authHeader } from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

describe("GET /api/categories", () => {
  it("IT-CAT-01 — 200 con parentCategory poblada", async () => {
    const parent = await createCategory({ name: "Ropa" });
    await createCategory({ name: "Camisetas", parentCategory: parent._id });

    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    const child = res.body.find((c) => c.name === "Camisetas");
    expect(child.parentCategory).toMatchObject({ name: "Ropa" });
  });

  it("IT-CAT-02 — GET /:id inexistente → 404", async () => {
    const res = await request(app).get(`/api/categories/${id()}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Category not found" });
  });

  it("GET /:id con id inválido → 422", async () => {
    const res = await request(app).get("/api/categories/xxx");

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

describe("POST /api/categories", () => {
  it("IT-CAT-03 — admin → 201", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/categories")
      .set(authHeader(admin))
      .send({ name: "Zapatos", description: "Calzado" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Zapatos" });
  });

  it("IT-CAT-04 — sin token → 401", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "X", description: "Y" });

    expect(res.status).toBe(401);
  });

  it("IT-CAT-05 — customer → 403", async () => {
    const customer = await createUser();

    const res = await request(app)
      .post("/api/categories")
      .set(authHeader(customer))
      .send({ name: "X", description: "Y" });

    expect(res.status).toBe(403);
  });

  it("IT-CAT-06 — nombre duplicado → 409", async () => {
    const admin = await createAdmin();
    await createCategory({ name: "Única" });

    const res = await request(app)
      .post("/api/categories")
      .set(authHeader(admin))
      .send({ name: "Única", description: "Repetida" });

    expect(res.status).toBe(409);
  });
});

describe("PUT / DELETE /api/categories/:id", () => {
  it("IT-CAT-07 — PUT admin → 200 actualizado", async () => {
    const admin = await createAdmin();
    const category = await createCategory({ name: "Antigua" });

    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set(authHeader(admin))
      .send({ name: "Renombrada", description: "desc" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renombrada");
  });

  it("IT-CAT-08 — DELETE admin → 204", async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("IT-CAT-09 — DELETE customer → 403", async () => {
    const customer = await createUser();
    const category = await createCategory();

    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set(authHeader(customer));

    expect(res.status).toBe(403);
  });
});
