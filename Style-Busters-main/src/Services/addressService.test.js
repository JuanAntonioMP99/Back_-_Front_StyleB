import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import apiClient from "./apiClient";
import {
  createAddress,
  deleteAddress,
  getDefaultAddress,
  getMyAddresses,
  updateAddress,
} from "./addressService";

describe("addressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getMyAddresses hace GET /addresses y devuelve la lista", async () => {
    apiClient.get.mockResolvedValue({ data: { addresses: [{ _id: "a1" }] } });

    const result = await getMyAddresses();

    expect(apiClient.get).toHaveBeenCalledWith("/addresses");
    expect(result).toEqual([{ _id: "a1" }]);
  });

  it("getDefaultAddress devuelve la marcada isDefault", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        addresses: [
          { _id: "a1", isDefault: false },
          { _id: "a2", isDefault: true },
        ],
      },
    });

    const result = await getDefaultAddress();

    expect(result).toEqual({ _id: "a2", isDefault: true });
  });

  it("getDefaultAddress cae a la primera si ninguna es default", async () => {
    apiClient.get.mockResolvedValue({
      data: { addresses: [{ _id: "a1", isDefault: false }] },
    });

    const result = await getDefaultAddress();

    expect(result).toEqual({ _id: "a1", isDefault: false });
  });

  it("getDefaultAddress devuelve null si no hay direcciones", async () => {
    apiClient.get.mockResolvedValue({ data: { addresses: [] } });

    const result = await getDefaultAddress();

    expect(result).toBeNull();
  });

  it("createAddress hace POST /addresses", async () => {
    const payload = { address: "Calle 1", city: "Aguascalientes" };
    apiClient.post.mockResolvedValue({ data: { _id: "a1", ...payload } });

    const result = await createAddress(payload);

    expect(apiClient.post).toHaveBeenCalledWith("/addresses", payload);
    expect(result).toEqual({ _id: "a1", ...payload });
  });

  it("updateAddress hace PUT /addresses/:id", async () => {
    const payload = { city: "Guadalajara" };
    apiClient.put.mockResolvedValue({ data: { _id: "a1", ...payload } });

    const result = await updateAddress("a1", payload);

    expect(apiClient.put).toHaveBeenCalledWith("/addresses/a1", payload);
    expect(result).toEqual({ _id: "a1", ...payload });
  });

  it("deleteAddress hace DELETE /addresses/:id", async () => {
    apiClient.delete.mockResolvedValue({ data: { message: "ok" } });

    const result = await deleteAddress("a1");

    expect(apiClient.delete).toHaveBeenCalledWith("/addresses/a1");
    expect(result).toEqual({ message: "ok" });
  });
});
