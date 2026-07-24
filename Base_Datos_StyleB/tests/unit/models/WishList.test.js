import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import WishList from "../../../src/models/WishList.js";

const objectId = () => new mongoose.Types.ObjectId();

describe("Modelo WishList", () => {
  it("exige user", () => {
    const error = new WishList({}).validateSync();

    expect(error).toBeDefined();
    expect(error.errors).toHaveProperty("user");
  });

  it("acepta una wishlist válida con productos", () => {
    const wishlist = new WishList({
      user: objectId(),
      products: [objectId(), objectId()],
    });

    expect(wishlist.validateSync()).toBeUndefined();
    expect(wishlist.products).toHaveLength(2);
  });

  it("acepta una wishlist sin productos (array vacío por defecto)", () => {
    const wishlist = new WishList({ user: objectId() });

    expect(wishlist.products).toEqual([]);
    expect(wishlist.validateSync()).toBeUndefined();
  });

  it("user apunta al modelo User", () => {
    expect(WishList.schema.path("user").options.ref).toBe("User");
  });

  // K06: products declara ref:"User" cuando debería ser "Product". El schema
  // valida igual (ambos son ObjectId), pero populate("products") resuelve contra
  // la colección equivocada. El assert describe el ref CORRECTO; hoy falla.
  it.fails("🔒 K06 — products debería referenciar al modelo Product", () => {
    const productsRef = WishList.schema.path("products").options.type[0].ref;

    expect(productsRef).toBe("Product");
  });
});
