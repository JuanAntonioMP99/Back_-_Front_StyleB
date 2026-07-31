import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// dotenv.config() leería el .env real del proyecto (gitignoreado y distinto en
// cada máquina), lo que haría el test dependiente del entorno local. Con el mock,
// process.env queda bajo control exclusivo del test.
vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));

const ENV_KEYS = [
  "NODE_ENV",
  "PORT",
  "CORS_ALLOWED_ORIGINS",
  "MONGODB_URI",
  "FRONTEND_URL",
];
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
    process.env.MONGODB_URI = "mongodb://prod-host:27017/StyleBusters";

    const env = await loadEnv();

    expect(env.nodeEnv).toBe("production");
    expect(env.corsAllowedOrigins).toEqual(["https://styleb.app"]);
  });

  it("lanza en producción si MONGODB_URI no está configurada", async () => {
    process.env.NODE_ENV = "production";
    process.env.CORS_ALLOWED_ORIGINS = "https://styleb.app";

    await expect(loadEnv()).rejects.toThrow(
      "Falta configurar MONGODB_URI en producción",
    );
  });

  it("en producción con MONGODB_URI definida no lanza y expone el valor", async () => {
    process.env.NODE_ENV = "production";
    process.env.CORS_ALLOWED_ORIGINS = "https://styleb.app";
    process.env.MONGODB_URI = "mongodb://prod-host:27017/StyleBusters";

    const env = await loadEnv();

    expect(env.mongodbUri).toBe("mongodb://prod-host:27017/StyleBusters");
  });

  it("en desarrollo/test sin MONGODB_URI usa el default localhost", async () => {
    const env = await loadEnv();

    expect(env.mongodbUri).toBe("mongodb://localhost:27017/StyleBusters");
  });

  it("sin FRONTEND_URL usa el default de desarrollo y lo deriva a corsAllowedOrigins", async () => {
    const env = await loadEnv();

    expect(env.frontendUrl).toBe("http://localhost:3000");
    expect(env.corsAllowedOrigins).toEqual(["http://localhost:3000"]);
  });

  it("con FRONTEND_URL y sin CORS_ALLOWED_ORIGINS, corsAllowedOrigins se deriva de frontendUrl", async () => {
    process.env.FRONTEND_URL = "https://styleb-front.onrender.com";

    const env = await loadEnv();

    expect(env.frontendUrl).toBe("https://styleb-front.onrender.com");
    expect(env.corsAllowedOrigins).toEqual([env.frontendUrl]);
  });

  it("con CORS_ALLOWED_ORIGINS definido, este prevalece sobre el derivado de FRONTEND_URL", async () => {
    process.env.FRONTEND_URL = "https://styleb-front.onrender.com";
    process.env.CORS_ALLOWED_ORIGINS = "https://otro-origen.com";

    const env = await loadEnv();

    expect(env.corsAllowedOrigins).toEqual(["https://otro-origen.com"]);
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

  it.each(["development", "test", "production"])(
    "acepta NODE_ENV=%s sin lanzar",
    async (value) => {
      process.env.NODE_ENV = value;
      if (value === "production") {
        process.env.CORS_ALLOWED_ORIGINS = "https://styleb.app";
        process.env.MONGODB_URI = "mongodb://prod-host:27017/StyleBusters";
      }

      const env = await loadEnv();

      expect(env.nodeEnv).toBe(value);
    },
  );

  it("lanza si NODE_ENV tiene un valor fuera de la lista permitida", async () => {
    process.env.NODE_ENV = "Production";

    await expect(loadEnv()).rejects.toThrow(
      'NODE_ENV tiene un valor no permitido: "Production". Valores permitidos: development, test, production.',
    );
  });
});
