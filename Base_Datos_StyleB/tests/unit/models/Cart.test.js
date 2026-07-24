import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Cart from "../../../src/models/Cart.js";

const objectId = () => new mongoose.Types.ObjectId();

describe("Modelo Cart", () => {
  it("exige user", () => {
    const error = new Cart({}).validateSync();

    expect(error).toBeDefined();
    expect(error.errors).toHaveProperty("user");
  });

  it("acepta un carrito válido con productos", () => {
    const cart = new Cart({
      user: objectId(),
      products: [{ product: objectId(), quantity: 2 }],
    });

    expect(cart.validateSync()).toBeUndefined();
  });

  it("acepta un carrito sin productos (array vacío por defecto)", () => {
    const cart = new Cart({ user: objectId() });

    expect(cart.products).toEqual([]);
    expect(cart.validateSync()).toBeUndefined();
  });

  it("rechaza quantity menor que 1", () => {
    const error = new Cart({
      user: objectId(),
      products: [{ product: objectId(), quantity: 0 }],
    }).validateSync();

    expect(error.errors).toHaveProperty("products.0.quantity");
  });

  it("exige product y quantity en cada línea del carrito", () => {
    const error = new Cart({
      user: objectId(),
      products: [{ quantity: 1 }, { product: objectId() }],
    }).validateSync();

    expect(error.errors).toHaveProperty("products.0.product");
    expect(error.errors).toHaveProperty("products.1.quantity");
  });
});
