import { describe, expect, it } from "vitest";
import { getProductImage, PRODUCT_IMAGE_PLACEHOLDER } from "./productImage";

describe("productImage", () => {
  it("devuelve imageURL cuando es una cadena no vacía", () => {
    expect(getProductImage({ imageURL: "http://img/1.png" })).toBe(
      "http://img/1.png",
    );
  });

  it("devuelve el placeholder si imageURL está vacío", () => {
    expect(getProductImage({ imageURL: "" })).toBe(PRODUCT_IMAGE_PLACEHOLDER);
  });

  it("devuelve el placeholder si no hay imageURL", () => {
    expect(getProductImage({})).toBe(PRODUCT_IMAGE_PLACEHOLDER);
  });

  it("devuelve el placeholder si el producto es null/undefined", () => {
    expect(getProductImage(null)).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(getProductImage(undefined)).toBe(PRODUCT_IMAGE_PLACEHOLDER);
  });

  it("devuelve el placeholder si imageURL no es string", () => {
    expect(getProductImage({ imageURL: 123 })).toBe(PRODUCT_IMAGE_PLACEHOLDER);
  });
});
