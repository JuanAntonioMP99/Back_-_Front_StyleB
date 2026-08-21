import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../src/models/User.js";
import Product from "../../src/models/Product.js";
import Category from "../../src/models/Category.js";
import Cart from "../../src/models/Cart.js";
import Order from "../../src/models/Order.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";
import WishList from "../../src/models/WishList.js";
import Address from "../../src/models/Address.js";

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

// Cart: si no se pasa user, crea uno. products es una lista de líneas
// { product: ObjectId, quantity } tal como exige el schema.
export async function createCart({ user, products } = {}) {
  const owner = user ?? (await createUser())._id;
  return Cart.create({ user: owner, products: products ?? [] });
}

// PaymentMethod: valores válidos por defecto; numCard se aleatoriza para no
// colisionar con el findOne({numCard}) del controller cuando un test crea varios.
export async function createPaymentMethod({ user, ...rest } = {}) {
  const owner = user ?? (await createUser())._id;
  return PaymentMethod.create({
    user: owner,
    type: "credit_card",
    name: "Tarjeta de prueba",
    numCard: `4${Math.random().toString().slice(2, 17)}`,
    dueDate: "12/30",
    cvv: "123",
    ...rest,
  });
}

// Order: rellena user, un producto real y un método de pago si no se pasan.
export async function createOrder({ user, products, paymentMethod, ...rest } = {}) {
  const owner = user ?? (await createUser())._id;
  const pm = paymentMethod ?? (await createPaymentMethod({ user: owner }))._id;
  const lines =
    products ?? [{ productId: (await createProduct())._id, quantity: 1, price: 100 }];
  return Order.create({
    user: owner,
    products: lines,
    paymentMethod: pm,
    totalPrice: 100,
    ...rest,
  });
}

export async function createWishlist({ user, products } = {}) {
  const owner = user ?? (await createUser())._id;
  return WishList.create({ user: owner, products: products ?? [] });
}

// Address: valores válidos por defecto para los campos requeridos del schema.
export async function createAddress({ user, ...rest } = {}) {
  const owner = user ?? (await createUser())._id;
  return Address.create({
    user: owner,
    address: "Calle 1",
    city: "Aguascalientes",
    state: "Aguascalientes",
    postalCode: "20000",
    country: "México",
    phone: "4491234567",
    ...rest,
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
