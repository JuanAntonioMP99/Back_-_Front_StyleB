import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import User from "../../src/models/User.js";
import {
  createUser,
  createAdmin,
  authHeader,
  PLAIN_PASSWORD,
} from "../helpers/factories.js";

const id = () => new mongoose.Types.ObjectId().toString();

describe("Escalada de privilegios en el registro", () => {
  it("un registro normal (sin adminSecret) crea un customer", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.com", password: PLAIN_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("customer");
  });

  // K01: el rol se calcula con `adminSecret === process.env.ADMIN_SECRET`. Si
  // ADMIN_SECRET no está definido en el entorno, un registro SIN adminSecret
  // cumple `undefined === undefined` → todos los usuarios se crean admin.
  // Aquí se borra ADMIN_SECRET para reproducir el despliegue mal configurado.
  // El assert describe el comportamiento CORRECTO; hoy falla a propósito.
  it.fails(
    "🔒 K01 — sin ADMIN_SECRET en el entorno, un registro normal NO debe crear un admin",
    async () => {
      const original = process.env.ADMIN_SECRET;
      delete process.env.ADMIN_SECRET;

      try {
        const res = await request(app).post("/api/auth/register").send({
          name: "Mallory",
          email: "mallory@test.com",
          password: PLAIN_PASSWORD,
        });

        expect(res.status).toBe(201);
        expect(res.body.role).toBe("customer");

        const stored = await User.findOne({ email: "mallory@test.com" });
        expect(stored.role).toBe("customer");
      } finally {
        process.env.ADMIN_SECRET = original;
      }
    },
  );
});

describe("Escritura del catálogo de productos", () => {
  const newProduct = {
    name: "Producto pirata",
    description: "Insertado sin autenticación",
    price: 1,
  };

  it("cualquiera puede crear un producto sin token (comportamiento actual)", async () => {
    // Documenta el estado REAL de hoy: la escritura de catálogo está abierta.
    // Cuando se corrija K08 este test debe pasar a esperar 401 y el 🔒 de abajo
    // pasa a verde. Deja constancia del agujero de forma visible.
    const res = await request(app).post("/api/products").send(newProduct);

    expect(res.status).toBe(201);
  });

  // K08: POST/PUT/DELETE /products no exigen authMiddleware ni isAdmin.
  it.fails("🔒 K08 — POST /api/products sin token debería responder 401", async () => {
    const res = await request(app).post("/api/products").send(newProduct);

    expect(res.status).toBe(401);
  });

  it.fails("🔒 K08 — PUT /api/products/:id sin token debería responder 401", async () => {
    const res = await request(app).put(`/api/products/${id()}`).send({ price: 0 });

    expect(res.status).toBe(401);
  });

  it.fails(
    "🔒 K08 — DELETE /api/products/:id sin token debería responder 401",
    async () => {
      const res = await request(app).delete(`/api/products/${id()}`);

      expect(res.status).toBe(401);
    },
  );

  it.fails(
    "🔒 K08 — un customer autenticado no debería poder crear productos",
    async () => {
      const customer = await createUser();

      const res = await request(app)
        .post("/api/products")
        .set(authHeader(customer))
        .send(newProduct);

      expect(res.status).toBe(403);
    },
  );
});

describe("Fuga de contraseñas en las respuestas", () => {
  it("GET /api/users no expone el password de ningún usuario", async () => {
    const admin = await createAdmin();
    await createUser({ email: "otro@test.com" });

    const res = await request(app).get("/api/users").set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const user of res.body) {
      expect(user).not.toHaveProperty("password");
    }
    expect(JSON.stringify(res.body)).not.toContain("$2b$");
  });

  it("GET /api/users/:id no expone el password", async () => {
    const user = await createUser();

    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("password");
  });

  it("POST /api/users no devuelve el password y lo guarda hasheado", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/users")
      .set(authHeader(admin))
      .send({
        name: "Nuevo",
        email: "nuevo@test.com",
        password: PLAIN_PASSWORD,
        role: "customer",
      });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("password");

    const stored = await User.findOne({ email: "nuevo@test.com" });
    expect(stored.password).not.toBe(PLAIN_PASSWORD);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it("el login con contraseña incorrecta no revela si el email existe", async () => {
    await createUser({ email: "existe@test.com" });

    const existente = await request(app)
      .post("/api/auth/login")
      .send({ email: "existe@test.com", password: "WrongPassword" });
    const inexistente = await request(app)
      .post("/api/auth/login")
      .send({ email: "noexiste@test.com", password: "WrongPassword" });

    // Documenta el comportamiento REAL: hoy los mensajes difieren
    // ("Invalid Credentials" vs "User does not exist..."), lo que permite
    // enumerar cuentas. Se fija para que el cambio sea deliberado y visible.
    expect(existente.status).toBe(400);
    expect(inexistente.status).toBe(400);
    expect(existente.body.message).not.toBe(inexistente.body.message);
  });
});
