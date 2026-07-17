import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../src/models/User.js";
import Product from "../../src/models/Product.js";
import Category from "../../src/models/Category.js";

// Factories: crean documentos reales en la BD en memoria. Los overrides
// permiten a cada test fijar solo el campo que le interesa.

export const PLAIN_PASSWORD = "Password123";

export async function createUser(overrides = {}) {
  const { password = PLAIN_PASSWORD, ...rest } = overrides;
  return User.create({
    name: "Test User",
    email: `user_${Date.now()}_${Math.random().toString(16).slice(2)}@test.com`,
    password: await bcrypt.hash(password, 10),
    role: "customer",
    ...rest,
  });
}

export async function createAdmin(overrides = {}) {
  return createUser({ name: "Admin User", role: "admin", ...overrides });
}

export async function createCategory(overrides = {}) {
  return Category.create({
    name: `Category ${Math.random().toString(16).slice(2)}`,
    description: "Categoría de prueba",
    ...overrides,
  });
}

export async function createProduct(overrides = {}) {
  return Product.create({
    name: "Test Product",
    description: "Producto de prueba",
    price: 100,
    stock: 10,
    ...overrides,
  });
}

// Firma un access token con la misma forma que authController.generateToken:
// { userId, name, role }. authMiddleware sólo verifica firma y expiración.
export function tokenFor(user) {
  return jwt.sign(
    { userId: user._id.toString(), name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

export function authHeader(user) {
  return { Authorization: `Bearer ${tokenFor(user)}` };
}

// Token válidamente firmado pero ya expirado: para probar el 401 de token
// expirado sin usar timers falsos.
export function expiredTokenFor(user) {
  return jwt.sign(
    { userId: user._id.toString(), name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "-1s" },
  );
}
