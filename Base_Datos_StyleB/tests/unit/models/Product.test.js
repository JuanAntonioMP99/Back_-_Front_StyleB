import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Product from "../../../src/models/Product.js";

describe("Modelo Product", () => {
  it("exige name, description y price", () => {
    const error = new Product({}).validateSync();

    expect(error).toBeDefined();
    expect(Object.keys(error.errors).sort()).toEqual([
      "description",
      "name",
      "price",
    ]);
  });

  it("aplica los defaults stock=0 e imageURL placeholder", () => {
    const product = new Product({
      name: "Camiseta",
      description: "Algodón",
      price: 19.99,
    });

    expect(product.stock).toBe(0);
    expect(product.imageURL).toBe("https://placehold.co/600x400");
    expect(product.validateSync()).toBeUndefined();
  });

  it("imageURL es required pero su default hace que nunca falte", () => {
    // required + default: el default se aplica antes de validar, así que la
    // combinación no puede fallar. Se fija el comportamiento real.
    const error = new Product({
      name: "Camiseta",
      description: "Algodón",
      price: 10,
      imageURL: undefined,
    }).validateSync();

    expect(error).toBeUndefined();
  });

  it("rechaza un price no numérico", () => {
    const error = new Product({
      name: "Camiseta",
      description: "Algodón",
      price: "gratis",
    }).validateSync();

    expect(error.errors).toHaveProperty("price");
  });

  it("acepta category como ObjectId y rechaza un id inválido", () => {
    expect(
      new Product({
        name: "Camiseta",
        description: "Algodón",
        price: 10,
        category: new mongoose.Types.ObjectId(),
      }).validateSync(),
    ).toBeUndefined();

    const error = new Product({
      name: "Camiseta",
      description: "Algodón",
      price: 10,
      category: "no-es-un-objectid",
    }).validateSync();

    expect(error.errors).toHaveProperty("category");
  });
});
