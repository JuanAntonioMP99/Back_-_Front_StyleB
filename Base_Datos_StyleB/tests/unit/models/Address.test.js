import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Address from "../../../src/models/Address.js";

const objectId = () => new mongoose.Types.ObjectId();

function validAddress(overrides = {}) {
  return new Address({
    user: objectId(),
    address: "Calle Falsa 123",
    city: "Madrid",
    state: "Madrid",
    postalCode: "28001",
    country: "España",
    phone: "600123456",
    ...overrides,
  });
}

// Address no tiene rutas montadas (K04), así que solo se prueba el schema.

describe("Modelo Address", () => {
  it("exige user, address, city, state, postalCode, country y phone", () => {
    const error = new Address({}).validateSync();

    expect(error).toBeDefined();
    expect(Object.keys(error.errors).sort()).toEqual([
      "address",
      "city",
      "country",
      "phone",
      "postalCode",
      "state",
      "user",
    ]);
  });

  it("aplica los defaults isDefault=false y addressType=home", () => {
    const address = validAddress();

    expect(address.isDefault).toBe(false);
    expect(address.addressType).toBe("home");
    expect(address.validateSync()).toBeUndefined();
  });

  it("acepta todos los addressType del enum y rechaza uno fuera", () => {
    for (const addressType of ["home", "work", "other"]) {
      expect(validAddress({ addressType }).validateSync()).toBeUndefined();
    }

    expect(
      validAddress({ addressType: "casa" }).validateSync().errors,
    ).toHaveProperty("addressType");
  });

  it("recorta espacios en los campos de texto", () => {
    expect(validAddress({ city: "  Madrid  " }).city).toBe("Madrid");
  });

  // K20: postalCode declara min:4/max:6 y phone max:10, pero en Mongoose min/max
  // solo aplican a Number/Date. Sobre String no validan nada.
  // El assert describe el comportamiento CORRECTO; hoy falla a propósito.
  it.fails(
    "🔒 K20 — debería rechazar postalCode fuera de 4-6 caracteres y phone de más de 10",
    () => {
      const error = validAddress({
        postalCode: "999999999999999",
        phone: "123456789012345678",
      }).validateSync();

      expect(error).toBeDefined();
      expect(error.errors).toHaveProperty("postalCode");
      expect(error.errors).toHaveProperty("phone");
    },
  );
});
