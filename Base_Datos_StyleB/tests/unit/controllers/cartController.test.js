import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/models/Cart.js", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

import Cart from "../../../src/models/Cart.js";
import {
  createCart,
  deleteCart,
  getCartById,
  getCartByUser,
  getCarts,
  updateCart,
} from "../../../src/controllers/cartController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.send = vi.fn(() => res);
  return res;
}

// Query encadenable: .populate().populate() resuelve al valor tras el 2º populate.
function queryChain(value) {
  const chain = { populate: vi.fn() };
  chain.populate
    .mockReturnValueOnce(chain)
    .mockReturnValueOnce(Promise.resolve(value));
  return chain;
}

const validProducts = [{ product: "p1", quantity: 2 }];

describe("cartController (unit)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getCarts -> 200 con la lista poblada", async () => {
    Cart.find.mockReturnValue(queryChain([{ _id: "c1" }]));
    const res = mockRes();
    await getCarts({}, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith([{ _id: "c1" }]);
  });

  it("getCartById -> 404 si no existe", async () => {
    Cart.findById.mockReturnValue(queryChain(null));
    const res = mockRes();
    await getCartById({ params: { id: "x" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("getCartByUser -> 404 si el usuario no tiene carrito", async () => {
    Cart.findOne.mockReturnValue(queryChain(null));
    const res = mockRes();
    await getCartByUser({ params: { id: "u1" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  describe("createCart", () => {
    it("404 si falta user o products no es arreglo", async () => {
      const res = mockRes();
      await createCart({ body: { user: "u1", products: "nope" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(Cart.create).not.toHaveBeenCalled();
    });

    it("400 si un item tiene cantidad < 1", async () => {
      const res = mockRes();
      await createCart(
        { body: { user: "u1", products: [{ product: "p1", quantity: 0 }] } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("201 al crear con datos válidos", async () => {
      const doc = { _id: "c1", populate: vi.fn().mockResolvedValue(undefined) };
      Cart.create.mockResolvedValue(doc);
      const res = mockRes();
      await createCart({ body: { user: "u1", products: validProducts } }, res, vi.fn());
      expect(Cart.create).toHaveBeenCalledWith({ user: "u1", products: validProducts });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(doc.populate).toHaveBeenCalledTimes(2);
    });
  });

  describe("updateCart", () => {
    it("404 si falta user/products", async () => {
      const res = mockRes();
      await updateCart({ params: { id: "c1" }, body: { user: "" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("400 si un item es inválido", async () => {
      const res = mockRes();
      await updateCart(
        { params: { id: "c1" }, body: { user: "u1", products: [{ quantity: 2 }] } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 si el carrito no existe", async () => {
      Cart.findByIdAndUpdate.mockReturnValue(queryChain(null));
      const res = mockRes();
      await updateCart(
        { params: { id: "c1" }, body: { user: "u1", products: validProducts } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("200 al actualizar", async () => {
      Cart.findByIdAndUpdate.mockReturnValue(queryChain({ _id: "c1" }));
      const res = mockRes();
      await updateCart(
        { params: { id: "c1" }, body: { user: "u1", products: validProducts } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteCart", () => {
    it("204 si elimina", async () => {
      Cart.findByIdAndDelete.mockResolvedValue({ _id: "c1" });
      const res = mockRes();
      await deleteCart({ params: { id: "c1" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("400 si no existe", async () => {
      Cart.findByIdAndDelete.mockResolvedValue(null);
      const res = mockRes();
      await deleteCart({ params: { id: "x" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
