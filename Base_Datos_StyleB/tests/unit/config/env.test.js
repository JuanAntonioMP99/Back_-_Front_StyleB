import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// dotenv.config() leería el .env real del proyecto (gitignoreado y distinto en
// cada máquina), lo que haría el test dependiente del entorno local. Con el mock,
// process.env queda bajo control exclusivo del test.
vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));

const ENV_KEYS = ["NODE_ENV", "PORT", "CORS_ALLOWED_ORIGINS"];
let originalEnv;

// env.js se evalúa en tiempo de import: para probar cada combinación hay que
// resetear el registro de módulos y volver a importarlo.
async function loadEnv() {
  vi.resetModules();
  const module = await import("../../../src/config/env.js");
  return module.default;
}

beforeEach(() => {
  originalEnv = { ...process.env };
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, originalEnv);
});

describe("config/env", () => {
  it("sin CORS_ALLOWED_ORIGINS usa el default de desarrollo", async () => {
    const env = await loadEnv();

    expect(env.corsAllowedOrigins).toEqual(["http://localhost:3000"]);
  });

  it("parsea la lista separada por comas limpiando espacios y comas colgantes", async () => {
    process.env.CORS_ALLOWED_ORIGINS =
      " http://localhost:3000 , https://styleb.app ,, ";

    const env = await loadEnv();

    expect(env.corsAllowedOrigins).toEqual([
      "http://localhost:3000",
      "https://styleb.app",
    ]);
  });

  it("lanza en producción si CORS_ALLOWED_ORIGINS no está configurado", async () => {
    process.env.NODE_ENV = "production";

    await expect(loadEnv()).rejects.toThrow(
      "Falta configurar CORS_ALLOWED_ORIGINS en producción",
    );
  });

  it("lanza en producción si CORS_ALLOWED_ORIGINS queda vacío tras el parseo", async () => {
    // Solo comas y espacios: el filter(Boolean) lo deja en []. No debe caer al
    // default de localhost en producción.
    process.env.NODE_ENV = "production";
    process.env.CORS_ALLOWED_ORIGINS = " , , ";

    await expect(loadEnv()).rejects.toThrow(
      "Falta configurar CORS_ALLOWED_ORIGINS en producción",
    );
  });

  it("en producción con origins válidos no lanza y los expone", async () => {
    process.env.NODE_ENV = "production";
    process.env.CORS_ALLOWED_ORIGINS = "https://styleb.app";

    const env = await loadEnv();

    expect(env.nodeEnv).toBe("production");
    expect(env.corsAllowedOrigins).toEqual(["https://styleb.app"]);
  });

  it("toma PORT del entorno y usa 3000 por defecto si no está definido", async () => {
    process.env.PORT = "4000";
    expect((await loadEnv()).port).toBe("4000");

    delete process.env.PORT;
    expect((await loadEnv()).port).toBe(3000);
  });

  it("nodeEnv es 'development' cuando NODE_ENV no está definido", async () => {
    const env = await loadEnv();

    expect(env.nodeEnv).toBe("development");
  });
});
