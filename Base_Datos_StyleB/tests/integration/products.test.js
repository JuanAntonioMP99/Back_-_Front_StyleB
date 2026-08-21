import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import {
  createProduct,
  createCategory,
  createAdmin,
  authHeader,
} from "../helpers/factories.js";

// Integración de /api/products y /api/products/search.
// Asserts sobre el comportamiento REAL del controller (status + forma del body).
// Los casos de autorización de escritura (K08) viven en security.test.js.

const id = () => new mongoose.Types.ObjectId().toString();

describe("GET /api/products", () => {
  it("IT-PROD-01 — devuelve 200 con array y la categoría poblada", async () => {
    const category = await createCategory({ name: "Camisas" });
    await createProduct({ name: "Camisa azul", category: category._id });
    await createProduct({ name: "Sin categoría" });

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    const conCategoria = res.body.find((p) => p.name === "Camisa azul");
    expect(conCategoria.category).toMatchObject({ name: "Camisas" });
  });

  it("devuelve 200 con array vacío cuando no hay productos", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/products/:id", () => {
  it("IT-PROD-02 — id existente → 200 con el producto", async () => {
    const product = await createProduct({ name: "Gorra" });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Gorra", price: 100 });
  });

  it("IT-PROD-03 — id inexistente → 404 { message }", async () => {
    const res = await request(app).get(`/api/products/${id()}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Product not found" });
  });

  it("IT-PROD-04 — id no-ObjectId → 422 con errores de validación", async () => {
    const res = await request(app).get("/api/products/no-es-objectid");

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe("POST /api/products", () => {
  it("IT-PROD-05 — payload válido → 201 con la categoría poblada", async () => {
    const admin = await createAdmin();
    const category = await createCategory({ name: "Pantalones" });

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "Jeans",
        description: "Denim clásico",
        price: 49.9,
        stock: 5,
        category: category._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Jeans", price: 49.9 });
    expect(res.body.category).toMatchObject({ name: "Pantalones" });
  });

  it("IT-PROD-06 — sin name ni price → 422", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        description: "Falta lo obligatorio",
      });

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("name");
    expect(fields).toContain("price");
  });

  it("IT-PROD-07 — price negativo → 422", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "Precio inválido",
        price: -10,
      });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("price");
  });

  it("IT-PROD-10 — CA-4: images con URLs válidas → 201 y persiste el array", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "Camisa con galería",
        description: "Producto con varias fotos",
        price: 25,
        images: ["https://a.test/1.jpg", "https://a.test/2.jpg"],
      });

    expect(res.status).toBe(201);
    expect(res.body.images).toEqual(["https://a.test/1.jpg", "https://a.test/2.jpg"]);
  });

  it("IT-PROD-11 — CA-4: sin images en el body → 201 con images: []", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "Camisa sin galería",
        description: "Producto sin fotos adicionales",
        price: 25,
      });

    expect(res.status).toBe(201);
    expect(res.body.images).toEqual([]);
  });

  it("IT-PROD-12 — CA-3: images no-array → 422", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "Images inválido",
        price: 25,
        images: "no-es-array",
      });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("images");
  });

  it("IT-PROD-13 — CA-3: elemento de images con URL inválida → 422", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "URL inválida en galería",
        price: 25,
        images: ["no-es-una-url"],
      });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("images[0]");
  });

  it("IT-PROD-14 — CA-3: images excede el límite de 10 elementos → 422", async () => {
    const admin = await createAdmin();
    const elevenUrls = Array.from({ length: 11 }, (_, i) => `https://a.test/${i}.jpg`);

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "Demasiadas imágenes",
        price: 25,
        images: elevenUrls,
      });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("images");
  });

  it("CA-6: imageURL no-URL → 422 con path imageURL", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/products")
      .set(authHeader(admin))
      .send({
        name: "imageURL inválido",
        price: 25,
        imageURL: "no-es-una-url",
      });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("imageURL");
  });
});

describe("PUT /api/products/:id", () => {
  it("IT-PROD-08 — actualiza campos y devuelve 200", async () => {
    const admin = await createAdmin();
    const product = await createProduct({ name: "Viejo", price: 100 });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader(admin))
      .send({ name: "Nuevo", price: 200 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Nuevo", price: 200 });
  });

  it("id inexistente → 404", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .put(`/api/products/${id()}`)
      .set(authHeader(admin))
      .send({ price: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Product not found" });
  });

  it("stock negativo → 422", async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader(admin))
      .send({ stock: -3 });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("stock");
  });

  it("IT-PROD-15 — CA-5: images en el body → 200 y actualiza el array", async () => {
    const admin = await createAdmin();
    const product = await createProduct({ images: ["https://a.test/old.jpg"] });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader(admin))
      .send({ images: ["https://a.test/new1.jpg", "https://a.test/new2.jpg"] });

    expect(res.status).toBe(200);
    expect(res.body.images).toEqual(["https://a.test/new1.jpg", "https://a.test/new2.jpg"]);
  });

  it("IT-PROD-16 — CA-5: sin images en el body conserva el images original", async () => {
    const admin = await createAdmin();
    const product = await createProduct({
      images: ["https://a.test/keep1.jpg", "https://a.test/keep2.jpg"],
    });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader(admin))
      .send({ name: "Solo cambia el nombre" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Solo cambia el nombre");
    expect(res.body.images).toEqual(["https://a.test/keep1.jpg", "https://a.test/keep2.jpg"]);
  });

  it("CA-7: imageURL no-URL → 422 con path imageURL", async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader(admin))
      .send({ imageURL: "no-es-una-url" });

    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.path);
    expect(fields).toContain("imageURL");
  });
});

describe("DELETE /api/products/:id", () => {
  it("IT-PROD-09 — existente → 204 sin body", async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const stored = await mongoose.connection
      .collection("products")
      .findOne({ _id: product._id });
    expect(stored).toBeNull();
  });

  it("id inexistente → 404", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .delete(`/api/products/${id()}`)
      .set(authHeader(admin));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Product not found" });
  });
});

describe("GET /api/products/search", () => {
  it("IT-SRCH-01 — ?q filtra por name o description, case-insensitive", async () => {
    await createProduct({ name: "Sudadera Roja", description: "algodón" });
    await createProduct({ name: "Bufanda", description: "lana ROJA suave" });
    await createProduct({ name: "Calcetines", description: "sin match" });

    const res = await request(app).get("/api/products/search").query({ q: "roja" });

    expect(res.status).toBe(200);
    const names = res.body.products.map((p) => p.name).sort();
    expect(names).toEqual(["Bufanda", "Sudadera Roja"]);
  });

  it("IT-SRCH-02 — ?minPrice/?maxPrice acotan por rango", async () => {
    await createProduct({ name: "Barato", price: 10 });
    await createProduct({ name: "Medio", price: 50 });
    await createProduct({ name: "Caro", price: 200 });

    const res = await request(app)
      .get("/api/products/search")
      .query({ minPrice: 20, maxPrice: 100 });

    expect(res.status).toBe(200);
    expect(res.body.products.map((p) => p.name)).toEqual(["Medio"]);
  });

  it("IT-SRCH-03 — ?inStock=true / =false filtran por stock", async () => {
    await createProduct({ name: "Con stock", stock: 5 });
    await createProduct({ name: "Agotado", stock: 0 });

    const conStock = await request(app)
      .get("/api/products/search")
      .query({ inStock: "true" });
    const agotados = await request(app)
      .get("/api/products/search")
      .query({ inStock: "false" });

    expect(conStock.body.products.map((p) => p.name)).toEqual(["Con stock"]);
    expect(agotados.body.products.map((p) => p.name)).toEqual(["Agotado"]);
  });

  it("IT-SRCH-04 — ?category filtra por categoría", async () => {
    const cat = await createCategory({ name: "Accesorios" });
    await createProduct({ name: "Cinturón", category: cat._id });
    await createProduct({ name: "Otro" });

    const res = await request(app)
      .get("/api/products/search")
      .query({ category: cat._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.products.map((p) => p.name)).toEqual(["Cinturón"]);
  });

  it("IT-SRCH-05 — ?sort=price&order=desc ordena descendente", async () => {
    await createProduct({ name: "A", price: 10 });
    await createProduct({ name: "B", price: 30 });
    await createProduct({ name: "C", price: 20 });

    const res = await request(app)
      .get("/api/products/search")
      .query({ sort: "price", order: "desc" });

    expect(res.body.products.map((p) => p.price)).toEqual([30, 20, 10]);
  });

  it("IT-SRCH-06 — paginación: page/limit + hasNext/hasPrev/totalPages", async () => {
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await createProduct({ name: `P${i}`, price: i });
    }

    const res = await request(app)
      .get("/api/products/search")
      .query({ page: 2, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({
      currentPage: 2,
      totalPages: 3,
      totalResults: 5,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("IT-SRCH-07 — sin resultados → 200 con products:[] y totalResults:0", async () => {
    const res = await request(app)
      .get("/api/products/search")
      .query({ q: "no-existe-nada" });

    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.pagination.totalResults).toBe(0);
  });

  it("IT-SRCH-08 — q se interpreta como regex sin escapar (comportamiento actual)", async () => {
    // Estado REAL: `q` se pasa directo a $regex, así que metacaracteres como
    // `.*` actúan como comodín y hacen match de TODO (over-match). Se documenta
    // el comportamiento actual, no el deseado (escapar la entrada sería un cambio
    // de código no pedido).
    await createProduct({ name: "Uno" });
    await createProduct({ name: "Dos" });

    const res = await request(app).get("/api/products/search").query({ q: ".*" });

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(2);
  });
});
