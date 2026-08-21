import { beforeEach, describe, expect, it, vi } from "vitest";

// addressController NO está montado en ningún router (ver CLAUDE.md), así que
// solo puede ejercerse por unidad. Se prueban los 4 handlers correctos.
// `updateAddress` NO se cubre: usa `userId` sin declararlo (declara `user`) y
// lanzaría ReferenceError — defecto reportado, no se prueba como si funcionara.
const { AddressMock, saveMock } = vi.hoisted(() => {
  const saveMock = vi.fn();
  const AddressMock = vi.fn();
  AddressMock.find = vi.fn();
  AddressMock.findOne = vi.fn();
  AddressMock.updateMany = vi.fn();
  AddressMock.findByIdAndDelete = vi.fn();
  return { AddressMock, saveMock };
});

vi.mock("../../../src/models/Address.js", () => ({ default: AddressMock }));

import {
  createAddress,
  deleteAddress,
  getAddressById,
  getUserAddresses,
} from "../../../src/controllers/addressController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

const reqUser = { user: { userId: "u1" } };

describe("addressController (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Rearmar tras el reset automático (restoreMocks) de vitest.config.
    AddressMock.mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = saveMock;
    });
    saveMock.mockResolvedValue(undefined);
  });

  it("getUserAddresses -> 200 con las direcciones del usuario", async () => {
    AddressMock.find.mockReturnValue({
      sort: vi.fn().mockResolvedValue([{ _id: "a1" }]),
    });
    const res = mockRes();
    await getUserAddresses(reqUser, res, vi.fn());
    expect(AddressMock.find).toHaveBeenCalledWith({ user: "u1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ addresses: [{ _id: "a1" }] });
  });

  it("getAddressById -> 200 si existe", async () => {
    AddressMock.findOne.mockResolvedValue({ _id: "a1" });
    const res = mockRes();
    await getAddressById({ ...reqUser, params: { addressId: "a1" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getAddressById -> 404 si no existe", async () => {
    AddressMock.findOne.mockResolvedValue(null);
    const res = mockRes();
    await getAddressById({ ...reqUser, params: { addressId: "x" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("createAddress -> 201 y desmarca otras si isDefault", async () => {
    AddressMock.updateMany.mockResolvedValue(undefined);
    const res = mockRes();
    await createAddress(
      {
        ...reqUser,
        body: { name: "Casa", address: "Calle 1", city: "Ags", isDefault: true },
      },
      res,
      vi.fn(),
    );
    expect(AddressMock.updateMany).toHaveBeenCalledWith(
      { user: "u1" },
      { isDefault: false },
    );
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("createAddress -> 201 sin tocar otras si no es default", async () => {
    const res = mockRes();
    await createAddress(
      { ...reqUser, body: { name: "Casa", address: "Calle 1", city: "Ags" } },
      res,
      vi.fn(),
    );
    expect(AddressMock.updateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("deleteAddress -> 200 si existe", async () => {
    AddressMock.findOne.mockResolvedValue({ _id: "a1" });
    AddressMock.findByIdAndDelete.mockResolvedValue({ _id: "a1" });
    const res = mockRes();
    await deleteAddress({ ...reqUser, params: { addressId: "a1" } }, res, vi.fn());
    expect(AddressMock.findByIdAndDelete).toHaveBeenCalledWith("a1");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deleteAddress -> 404 si no existe", async () => {
    AddressMock.findOne.mockResolvedValue(null);
    const res = mockRes();
    await deleteAddress({ ...reqUser, params: { addressId: "x" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
