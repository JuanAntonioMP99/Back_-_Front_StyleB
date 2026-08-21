import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// El default NO es el primero: prueba que getDefault lo busca por el flag.
vi.mock("../Data/shipping-address.json", () => ({
  default: [
    { _id: "1", name: "Work", default: false },
    { _id: "2", name: "Home", default: true },
  ],
}));

import {
  getDefaultShippingAddress,
  getShippingAddresses,
} from "./shippingService";

describe("shippingService (mock local)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("getShippingAddresses resuelve la lista tras el delay simulado", async () => {
    const promise = getShippingAddresses();
    await vi.runAllTimersAsync();
    const list = await promise;
    expect(list).toHaveLength(2);
  });

  it("getDefaultShippingAddress devuelve la marcada como default", async () => {
    const promise = getDefaultShippingAddress();
    await vi.runAllTimersAsync();
    const def = await promise;
    expect(def._id).toBe("2");
    expect(def.name).toBe("Home");
  });
});
