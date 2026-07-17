import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../server.js";
import User from "../../src/models/User.js";
import { createUser, PLAIN_PASSWORD } from "../helpers/factories.js";

describe("POST /api/auth/register", () => {
  it("registra un customer y devuelve 201 sin exponer la contraseña", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ana",
      email: "ana@test.com",
      password: PLAIN_PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Ana",
      email: "ana@test.com",
      role: "customer",
    });
    expect(res.body).not.toHaveProperty("password");
  });

  it("persiste la contraseña hasheada, nunca en claro", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.com", password: PLAIN_PASSWORD });

    const stored = await User.findOne({ email: "ana@test.com" });
    expect(stored.password).not.toBe(PLAIN_PASSWORD);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it("asigna rol admin cuando adminSecret coincide con ADMIN_SECRET", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Root",
      email: "root@test.com",
      password: PLAIN_PASSWORD,
      adminSecret: process.env.ADMIN_SECRET,
    });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("admin");
  });

  it("asigna rol customer cuando adminSecret es incorrecto", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Mallory",
      email: "mallory@test.com",
      password: PLAIN_PASSWORD,
      adminSecret: "secreto-incorrecto",
    });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("customer");
  });

  it("rechaza con 400 un email ya registrado", async () => {
    await createUser({ email: "dup@test.com" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Dup", email: "dup@test.com", password: PLAIN_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "User already exist" });
  });
});

describe("POST /api/auth/login", () => {
  it("devuelve 200 con access y refresh token válidos", async () => {
    const user = await createUser({ email: "login@test.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: PLAIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("refreshToken");

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({
      userId: user._id.toString(),
      role: "customer",
    });
  });

  it("firma el refresh token con JWT_REFRESH_TOKEN, no con JWT_SECRET", async () => {
    await createUser({ email: "login@test.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: PLAIN_PASSWORD });

    const decoded = jwt.verify(
      res.body.refreshToken,
      process.env.JWT_REFRESH_TOKEN,
    );
    expect(decoded).toHaveProperty("userId");
  });

  it("devuelve 400 si el usuario no existe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nadie@test.com", password: PLAIN_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "User does not exist. You must sign in.",
    });
  });

  it("devuelve 400 con contraseña incorrecta y no filtra token", async () => {
    await createUser({ email: "login@test.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "WrongPassword" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid Credentials" });
    expect(res.body).not.toHaveProperty("token");
  });
});
