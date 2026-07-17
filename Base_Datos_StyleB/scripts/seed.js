import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB from "../src/config/db.conf.js";
import User from "../src/models/User.js";
import Category from "../src/models/Category.js";
import Product from "../src/models/Product.js";

dotenv.config();

// -----------------------------------------------------------------------------
// Configuración
// -----------------------------------------------------------------------------
// bcrypt con saltRounds = 10, igual que authController.js / userController.js.
const SALT_ROUNDS = 10;

// El modelo Product tiene stock con default 0. Para que el ecommerce sea usable
// en desarrollo/demo se siembra un stock configurable (no destructivo).
const DEFAULT_STOCK = Number(process.env.SEED_DEFAULT_STOCK ?? 25);

// Reset controlado. Por defecto el seed es NO destructivo.
const ALLOW_RESET = process.env.SEED_ALLOW_RESET === "true";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// products.json vive en el frontend (Style-Busters-main). Ruta configurable.
const PRODUCTS_JSON_PATH = process.env.PRODUCTS_JSON_PATH
  ? path.resolve(process.env.PRODUCTS_JSON_PATH)
  : path.resolve(__dirname, "../../Style-Busters-main/src/Data/products.json");

// -----------------------------------------------------------------------------
// Usuarios a sembrar (1 admin + 2 customers). Credenciales por variables de
// entorno con defaults de desarrollo.
// -----------------------------------------------------------------------------
const usersToSeed = [
  {
    name: process.env.SEED_ADMIN_NAME || "Admin StyleBusters",
    email: (process.env.SEED_ADMIN_EMAIL || "admin@stylebusters.com").toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
    role: "admin",
  },
  {
    name: process.env.SEED_CUSTOMER1_NAME || "Customer One",
    email: (process.env.SEED_CUSTOMER1_EMAIL || "customer1@stylebusters.com").toLowerCase(),
    password: process.env.SEED_CUSTOMER1_PASSWORD || "Customer123!",
    role: "customer",
  },
  {
    name: process.env.SEED_CUSTOMER2_NAME || "Customer Two",
    email: (process.env.SEED_CUSTOMER2_EMAIL || "customer2@stylebusters.com").toLowerCase(),
    password: process.env.SEED_CUSTOMER2_PASSWORD || "Customer123!",
    role: "customer",
  },
];

// Emails gestionados por el seed (para el reset controlado no destructivo).
const seedEmails = usersToSeed.map((u) => u.email);

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const readProducts = () => {
  if (!fs.existsSync(PRODUCTS_JSON_PATH)) {
    throw new Error(`No se encontró products.json en: ${PRODUCTS_JSON_PATH}`);
  }
  const raw = fs.readFileSync(PRODUCTS_JSON_PATH, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("products.json no contiene un array de productos");
  }
  return data;
};

// Verificación previa: crea solo si no existe (idempotente y no destructivo).
// Usa el modelo directamente para respetar validaciones/enums/casting de Mongoose.
async function seedUser(user) {
  const existing = await User.findOne({ email: user.email });
  if (existing) {
    return { email: user.email, created: false };
  }
  const password = await hashPassword(user.password);
  await User.create({
    name: user.name,
    email: user.email,
    password,
    role: user.role,
  });
  return { email: user.email, created: true };
}

async function seedCategory(name) {
  let category = await Category.findOne({ name });
  if (!category) {
    // .create() ejecuta las validaciones del schema (name required).
    category = await Category.create({ name });
  }
  return category;
}

async function seedProduct(doc) {
  const existing = await Product.findOne({ name: doc.name });
  if (existing) {
    return { name: doc.name, created: false };
  }
  await Product.create(doc); // validaciones completas del modelo
  return { name: doc.name, created: true };
}

// Reset controlado: solo se ejecuta con SEED_ALLOW_RESET=true.
// No borra usuarios ajenos: elimina únicamente los usuarios del seed por email.
async function runReset() {
  console.log("⚠️  SEED_ALLOW_RESET=true → ejecutando reset controlado...");
  const [prod, cat, users] = await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({ email: { $in: seedEmails } }),
  ]);
  console.log(
    `   Borrados → productos: ${prod.deletedCount}, categorías: ${cat.deletedCount}, usuarios seed: ${users.deletedCount}`,
  );
}

// -----------------------------------------------------------------------------
// Orquestación del seed
// -----------------------------------------------------------------------------
async function run() {
  try {
    await connectDB();

    if (ALLOW_RESET) {
      await runReset();
    }

    // 1) Usuarios (independientes de otras entidades)
    console.log("\n👤 Sembrando usuarios...");
    for (const user of usersToSeed) {
      const result = await seedUser(user);
      console.log(
        `   ${result.created ? "＋ creado " : "= existente"} ${result.email} (${user.role})`,
      );
    }

    // 2) Productos (dependen de Category por ObjectId)
    const rawProducts = readProducts();

    // 2a) Categorías base derivadas de products.json (name → ObjectId)
    console.log("\n🏷️  Sembrando categorías...");
    const categoryNames = [
      ...new Set(rawProducts.map((p) => p.category).filter(Boolean)),
    ];
    const categoryMap = new Map();
    for (const name of categoryNames) {
      const category = await seedCategory(name);
      categoryMap.set(name, category._id);
      console.log(`   ✓ ${name} → ${category._id}`);
    }

    // 2b) Productos: mapea image[] → imageURL y category(string) → ObjectId
    console.log("\n👕 Sembrando productos...");
    let created = 0;
    let skipped = 0;
    for (const p of rawProducts) {
      const doc = {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: DEFAULT_STOCK,
        // El modelo espera un String; products.json trae un array de imágenes.
        imageURL: Array.isArray(p.image) ? p.image[0] : p.image,
        category: p.category ? categoryMap.get(p.category) : undefined,
      };
      const result = await seedProduct(doc);
      result.created ? created++ : skipped++;
      console.log(`   ${result.created ? "＋ creado " : "= existente"} ${result.name}`);
    }

    // 3) Resumen
    const [userCount, categoryCount, productCount] = await Promise.all([
      User.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments(),
    ]);
    console.log("\n✅ Seed completado.");
    console.log(`   Productos nuevos: ${created} | ya existentes: ${skipped}`);
    console.log(
      `   Totales en BD → usuarios: ${userCount}, categorías: ${categoryCount}, productos: ${productCount}`,
    );
  } catch (error) {
    console.error("\n❌ Error durante el seed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexión a MongoDB cerrada.");
  }
}

run();
