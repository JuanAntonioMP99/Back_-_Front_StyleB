import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../../server.js";
import Product from "../../src/models/Product.js";

// Para forzar el camino de error de los controllers (catch → next(error)) se
// stubea el modelo, NO se desconecta mongoose: desconectar toca la conexión
// global que comparten todos los archivos de test y hace el suite inestable
// (reconectar compite con operaciones en vuelo). Con el spy el fallo es
// determinista y queda contenido en este test.
function simulateDbFailure() {
  vi.spyOn(Product, "find").mockImplementation(() => {
    throw new Error("Fallo de BD simulado");
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Camino de error de la API (fallo de BD)", () => {
  it("responde 500 y no tumba el proceso cuando el acceso a la BD falla", async () => {
    simulateDbFailure();

    const res = await request(app).get("/api/products");

    // Lo único correcto del comportamiento actual: el error se traduce en un
    // 500 en vez de dejar la petición colgada o matar el servidor.
    expect(res.status).toBe(500);
  });

  // K21: app.use(errorHandler) está ANTES de app.use("/api", routes) en
  // server.js. Express solo enruta errores a un middleware de aridad 4
  // registrado DESPUÉS del código que falla, así que errorHandler nunca corre y
  // responde el handler por defecto de Express.
  // Los asserts describen el comportamiento CORRECTO; hoy fallan a propósito.
  // Al mover app.use(errorHandler) al final de server.js, quitar los `.fails`.
  it.fails(
    "🔒 K21 — debería responder el errorHandler con JSON { status, message }",
    async () => {
      simulateDbFailure();

      const res = await request(app).get("/api/products");

      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.body).toEqual({
        status: "error",
        message: "Internal Server Error",
      });
    },
  );

  it.fails(
    "🔒 K21 — no debería exponer stack trace ni rutas del servidor al cliente",
    async () => {
      simulateDbFailure();

      const res = await request(app).get("/api/products");

      expect(res.text).not.toMatch(/at .+\.js:\d+/);
      expect(res.text).not.toContain("node_modules");
      expect(res.text).not.toContain("Base_Datos_StyleB");
    },
  );
});
