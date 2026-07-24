import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import PaymentMethod from "../../../src/models/PaymentMethod.js";

const objectId = () => new mongoose.Types.ObjectId();

function validPayment(overrides = {}) {
  return new PaymentMethod({
    user: objectId(),
    type: "credit_card",
    name: "Visa personal",
    numCard: "4111111111111111",
    dueDate: "12/30",
    cvv: "123",
    ...overrides,
  });
}

describe("Modelo PaymentMethod", () => {
  it("exige user, type, name, numCard, dueDate y cvv", () => {
    const error = new PaymentMethod({}).validateSync();

    expect(error).toBeDefined();
    expect(Object.keys(error.errors).sort()).toEqual([
      "cvv",
      "dueDate",
      "name",
      "numCard",
      "type",
      "user",
    ]);
  });

  it("acepta todos los type del enum y rechaza uno fuera", () => {
    for (const type of [
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ]) {
      expect(validPayment({ type }).validateSync()).toBeUndefined();
    }

    expect(validPayment({ type: "bitcoin" }).validateSync().errors).toHaveProperty(
      "type",
    );
  });

  it("aplica el default isDefault=false", () => {
    expect(validPayment().isDefault).toBe(false);
  });

  // K20: numCard declara max:16 y cvv max:3, pero en Mongoose min/max solo
  // aplican a Number/Date. Sobre String no validan nada (haría falta maxlength).
  // El assert describe el comportamiento CORRECTO; hoy falla a propósito.
  // Al corregir el schema, quitar `.fails` y el test protegerá la regresión.
  it.fails(
    "🔒 K20 — debería rechazar numCard de más de 16 caracteres y cvv de más de 3",
    () => {
      const error = validPayment({
        numCard: "1".repeat(40),
        cvv: "123456789",
      }).validateSync();

      expect(error).toBeDefined();
      expect(error.errors).toHaveProperty("numCard");
      expect(error.errors).toHaveProperty("cvv");
    },
  );
});
