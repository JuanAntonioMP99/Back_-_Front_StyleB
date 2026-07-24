/**
 * Servidor de backend para pruebas E2E (Cypress).
 *
 * Levanta la API real (server.js) contra una instancia EFÍMERA de MongoDB
 * (mongodb-memory-server), de modo que los E2E NO tocan la base de datos
 * Atlas de producción. Cada arranque parte de una BD limpia y siembra datos
 * deterministas (categoría, productos y un usuario de prueba conocido).
 *
 * Variables de entorno de test (con defaults):
 *   TEST_USER_EMAIL     (default e2e@styleb.test)
 *   TEST_USER_PASSWORD  (default Test1234!)
 *   PORT                (default 4000)
 *
 * Uso:  node ./scripts/e2e-server.js
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { MongoMemoryServer } from "mongodb-memory-server";

// --- 1. Entorno de test: fijar ANTES de importar la app (env.js se evalúa al importar) ---
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "4000";
process.env.CORS_ALLOWED_ORIGINS =
  process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000";
process.env.JWT_SECRET = process.env.JWT_SECRET || "e2e_jwt_secret";
process.env.JWT_REFRESH_TOKEN =
  process.env.JWT_REFRESH_TOKEN || "e2e_refresh_secret";
// Definir ADMIN_SECRET evita el bug de escalada (K01): sin él, undefined===undefined
// haría admin a CUALQUIER registro. Con un valor, los registros normales son "customer".
process.env.ADMIN_SECRET = process.env.ADMIN_SECRET || "e2e_admin_secret";

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "e2e@styleb.test";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "Test1234!";

// --- 2. Mongo efímero ---
const mongoServer = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongoServer.getUri("styleb_e2e");

await mongoose.connect(process.env.MONGODB_URI);
console.log(`[e2e] MongoDB efímero en ${process.env.MONGODB_URI}`);

// --- 3. Importar modelos y app (después de fijar env y conectar) ---
const { default: app } = await import("../server.js");
const { default: Category } = await import("../src/models/Category.js");
const { default: Product } = await import("../src/models/Product.js");
const { default: User } = await import("../src/models/User.js");

// --- 4. Seed determinista ---
async function seed() {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);

  const category = await Category.create({
    name: "Ropa",
    description: "Categoría de prueba E2E",
  });

  await Product.create([
    {
      name: "Camiseta E2E",
      description: "Camiseta de prueba para Cypress",
      price: 199.99,
      stock: 25,
      imageURL: "https://placehold.co/600x400",
      category: category._id,
    },
    {
      name: "Pantalón E2E",
      description: "Pantalón de prueba para Cypress",
      price: 499.5,
      stock: 10,
      imageURL: "https://placehold.co/600x400",
      category: category._id,
    },
  ]);

  const hashed = await bcrypt.hash(TEST_USER_PASSWORD, 10);
  await User.create({
    name: "Usuario E2E",
    email: TEST_USER_EMAIL,
    password: hashed,
    role: "customer",
  });

  console.log(
    `[e2e] Seed listo: 1 categoría, 2 productos, usuario ${TEST_USER_EMAIL}`,
  );
}

await seed();

// --- 5. Levantar el servidor ---
const port = Number(process.env.PORT);
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`[e2e] API de pruebas escuchando en http://localhost:${port}`);
});

// --- 6. Apagado limpio ---
async function shutdown() {
  console.log("\n[e2e] Apagando servidor de pruebas...");
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
