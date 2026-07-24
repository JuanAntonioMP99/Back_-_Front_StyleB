import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Category from "../../../src/models/Category.js";

describe("Modelo Category", () => {
  it("exige name", () => {
    const error = new Category({}).validateSync();

    expect(error).toBeDefined();
    expect(Object.keys(error.errors)).toEqual(["name"]);
  });

  it("description es opcional y parentCategory tiene default null", () => {
    const category = new Category({ name: "Camisetas" });

    expect(category.parentCategory).toBeNull();
    expect(category.description).toBeUndefined();
    expect(category.validateSync()).toBeUndefined();
  });

  it("aplica el default de imageURL", () => {
    const category = new Category({ name: "Camisetas" });

    expect(category.imageURL).toBe("https://placehold.co/800x600.png");
  });

  it("recorta espacios en name", () => {
    expect(new Category({ name: "  Camisetas  " }).name).toBe("Camisetas");
  });

  it("acepta parentCategory como ObjectId (categoría anidada)", () => {
    const parentId = new mongoose.Types.ObjectId();
    const category = new Category({ name: "Manga corta", parentCategory: parentId });

    expect(category.validateSync()).toBeUndefined();
    expect(category.parentCategory).toEqual(parentId);
  });
});
