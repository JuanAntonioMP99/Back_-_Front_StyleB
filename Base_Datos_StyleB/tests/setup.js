import { beforeAll, afterAll, afterEach, inject } from "vitest";
import mongoose from "mongoose";
import { randomUUID } from "crypto";

// Variables de entorno deterministas para los tests. Se fijan ANTES de que
// cualquier módulo lea process.env (authController firma con JWT_SECRET al
// invocarse, no al importarse, pero env.js sí lee en tiempo de import).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.JWT_REFRESH_TOKEN = "test_jwt_refresh_secret";
process.env.ADMIN_SECRET = "test_admin_secret";
process.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000";

beforeAll(async () => {
  // El mongod lo levanta una sola vez tests/globalSetup.js; aquí solo se conecta.
  // Cada archivo usa su propia base dentro de esa instancia: el aislamiento entre
  // archivos no depende de que corran en serie.
  // Los tests NO llaman a connectDB(): usan la conexión global de mongoose, que
  // es la que resuelven los modelos.
  await mongoose.connect(inject("mongoUri"), { dbName: `test_${randomUUID()}` });
});

// Aislamiento entre tests: cada test parte de una BD vacía.
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  // Se elimina la base de este archivo para no dejar residuo en la instancia
  // compartida.
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
