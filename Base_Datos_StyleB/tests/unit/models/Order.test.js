import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Order from "../../../src/models/Order.js";

const objectId = () => new mongoose.Types.ObjectId();

function validOrder(overrides = {}) {
  return new Order({
    user: objectId(),
    products: [{ productId: objectId(), quantity: 1, price: 10 }],
    paymentMethod: objectId(),
    totalPrice: 10,
    ...overrides,
  });
}

describe("Modelo Order", () => {
  it("exige user, paymentMethod y totalPrice", () => {
    const error = new Order({}).validateSync();

    expect(error).toBeDefined();
    expect(Object.keys(error.errors).sort()).toEqual([
      "paymentMethod",
      "totalPrice",
      "user",
    ]);
  });

  it("aplica los defaults status=pending, paymentStatus=pending y shippingCost=0", () => {
    const order = validOrder();

    expect(order.status).toBe("pending");
    expect(order.paymentStatus).toBe("pending");
    expect(order.shippingCost).toBe(0);
    expect(order.validateSync()).toBeUndefined();
  });

  it("acepta todos los status del enum y rechaza uno fuera", () => {
    for (const status of [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]) {
      expect(validOrder({ status }).validateSync()).toBeUndefined();
    }

    expect(validOrder({ status: "entregado" }).validateSync().errors).toHaveProperty(
      "status",
    );
  });

  it("acepta todos los paymentStatus del enum y rechaza uno fuera", () => {
    for (const paymentStatus of ["pending", "paid", "failed", "refunded"]) {
      expect(validOrder({ paymentStatus }).validateSync()).toBeUndefined();
    }

    expect(
      validOrder({ paymentStatus: "pagado" }).validateSync().errors,
    ).toHaveProperty("paymentStatus");
  });

  it("exige productId, quantity y price en cada línea de la orden", () => {
    const error = validOrder({ products: [{ quantity: 0 }] }).validateSync();

    expect(error.errors).toHaveProperty("products.0.productId");
    expect(error.errors).toHaveProperty("products.0.price");
    // quantity:0 incumple min:1
    expect(error.errors).toHaveProperty("products.0.quantity");
  });
});
