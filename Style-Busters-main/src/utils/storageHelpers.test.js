import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeAddress,
  normalizePayment,
  readLocalJSON,
  STORAGE_KEYS,
  writeLocalJSON,
} from "./storageHelpers";

describe("storageHelpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("read/writeLocalJSON", () => {
    it("escribe y lee de vuelta un objeto", () => {
      writeLocalJSON("k", { a: 1 });
      expect(readLocalJSON("k")).toEqual({ a: 1 });
    });

    it("devuelve null si la clave no existe", () => {
      expect(readLocalJSON("no-existe")).toBeNull();
    });

    it("devuelve null y avisa si el JSON está corrupto", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem("bad", "{no-json");
      expect(readLocalJSON("bad")).toBeNull();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe("normalizeAddress", () => {
    it("devuelve null si no hay dirección", () => {
      expect(normalizeAddress(null)).toBeNull();
    });

    it("usa _id como id y refleja default en isDefault", () => {
      const out = normalizeAddress({ _id: "a1", name: "Casa", default: true });
      expect(out.id).toBe("a1");
      expect(out.default).toBe(true);
      expect(out.isDefault).toBe(true);
      expect(out.name).toBe("Casa");
    });

    it("genera un id cuando no hay id ni _id", () => {
      const out = normalizeAddress({ name: "Sin id" }, 3);
      expect(out.id).toMatch(/^addr-\d+-3$/);
      expect(out.isDefault).toBe(false);
    });
  });

  describe("normalizePayment", () => {
    it("devuelve null si no hay pago", () => {
      expect(normalizePayment(undefined)).toBeNull();
    });

    it("genera alias con los últimos 4 dígitos si no hay alias", () => {
      const out = normalizePayment({ _id: "p1", cardNumber: "4444-1111-2222-5555" });
      expect(out.alias).toBe("Tarjeta ****5555");
      expect(out.id).toBe("p1");
    });

    it("respeta alias y mapea cardHolderName -> placeHolder y expiryDate -> expireDate", () => {
      const out = normalizePayment({
        alias: "Mi tarjeta",
        cardHolderName: "Ada",
        expiryDate: "08/31",
        isDefault: true,
      });
      expect(out.alias).toBe("Mi tarjeta");
      expect(out.placeHolder).toBe("Ada");
      expect(out.expireDate).toBe("08/31");
      expect(out.default).toBe(true);
    });
  });

  it("STORAGE_KEYS expone las claves esperadas", () => {
    expect(STORAGE_KEYS).toMatchObject({
      addresses: "shippingAddresses",
      payments: "paymentMethods",
      orders: "orders",
    });
  });
});
