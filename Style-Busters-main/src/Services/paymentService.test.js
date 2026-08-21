import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Datos deterministas: el default NO es el primero, para probar que getDefault
// realmente lo BUSCA (no que devuelve el primero por casualidad).
vi.mock("../Data/paymentMethods.json", () => ({
  default: [
    { _id: "1", alias: "Banorte", isDefault: false },
    { _id: "2", alias: "Bancomer", isDefault: true },
  ],
}));

import { getDefaultPaymentMethod, getPaymentMethods } from "./paymentService";

describe("paymentService (mock local)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("getPaymentMethods resuelve la lista tras el delay simulado", async () => {
    const promise = getPaymentMethods();
    await vi.runAllTimersAsync();
    const methods = await promise;
    expect(methods).toHaveLength(2);
    expect(methods[0].alias).toBe("Banorte");
  });

  it("getDefaultPaymentMethod devuelve el marcado como default", async () => {
    const promise = getDefaultPaymentMethod();
    await vi.runAllTimersAsync();
    const def = await promise;
    expect(def._id).toBe("2");
    expect(def.isDefault).toBe(true);
  });
});
