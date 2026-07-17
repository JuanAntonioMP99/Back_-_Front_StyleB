import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Variables de entorno deterministas para los tests. Se fijan ANTES de que
// cualquier módulo lea process.env (authController firma con JWT_SECRET al
// invocarse, no al importarse, pero env.js sí lee en tiempo de import).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.JWT_REFRESH_TOKEN = "test_jwt_refresh_secret";
process.env.ADMIN_SECRET = "test_admin_secret";
process.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  // Los tests NO llaman a connectDB(): conectan a la instancia en memoria.
  // Los modelos usan la conexión global de mongoose, así que basta con esto.
  await mongoose.connect(mongoServer.getUri());
});

// Aislamiento entre tests: cada test parte de una BD vacía.
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});
