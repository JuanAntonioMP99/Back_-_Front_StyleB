import { beforeEach, describe, expect, it, vi } from "vitest";

// Unit puro: se mockea el modelo (sin BD) y bcrypt (sin coste de hashing real).
vi.mock("../../../src/models/User.js", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));
vi.mock("bcrypt", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed") },
}));

import User from "../../../src/models/User.js";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../../../src/controllers/userController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.send = vi.fn(() => res);
  return res;
}

const selectResolving = (value) => ({ select: vi.fn().mockResolvedValue(value) });

describe("userController (unit)", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("getUsers", () => {
    it("200 con la lista sin password", async () => {
      User.find.mockReturnValue(selectResolving([{ _id: "u1" }]));
      const res = mockRes();
      await getUsers({}, res, vi.fn());
      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ _id: "u1" }]);
    });

    it("propaga el error a next ante fallo del modelo", async () => {
      User.find.mockImplementation(() => {
        throw new Error("db down");
      });
      const next = vi.fn();
      await getUsers({}, mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getUserById", () => {
    it("200 si existe", async () => {
      User.findById.mockReturnValue(selectResolving({ _id: "u1" }));
      const res = mockRes();
      await getUserById({ params: { id: "u1" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("404 si no existe", async () => {
      User.findById.mockReturnValue(selectResolving(null));
      const res = mockRes();
      await getUserById({ params: { id: "x" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("createUser", () => {
    it("409 si el email ya existe", async () => {
      User.findOne.mockResolvedValue({ _id: "u1" });
      const res = mockRes();
      await createUser(
        { body: { email: "a@a.com", name: "A", password: "x", role: "customer" } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(409);
      expect(User.create).not.toHaveBeenCalled();
    });

    it("201 y no expone el password", async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        toObject: () => ({
          _id: "u1",
          name: "A",
          email: "a@a.com",
          role: "customer",
          password: "hashed",
        }),
      });
      const res = mockRes();
      await createUser(
        { body: { email: "a@a.com", name: "A", password: "x", role: "customer" } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      const payload = res.json.mock.calls[0][0];
      expect(payload).not.toHaveProperty("password");
      expect(payload.email).toBe("a@a.com");
    });
  });

  describe("updateUser", () => {
    it("200 si actualiza", async () => {
      User.findByIdAndUpdate.mockReturnValue(selectResolving({ _id: "u1", name: "B" }));
      const res = mockRes();
      await updateUser(
        { params: { id: "u1" }, body: { name: "B", password: "x" } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("404 si no existe", async () => {
      User.findByIdAndUpdate.mockReturnValue(selectResolving(null));
      const res = mockRes();
      await updateUser(
        { params: { id: "x" }, body: { password: "x" } },
        res,
        vi.fn(),
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteUser", () => {
    it("204 si elimina", async () => {
      User.findByIdAndDelete.mockResolvedValue({ _id: "u1" });
      const res = mockRes();
      await deleteUser({ params: { id: "u1" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("404 si no existe", async () => {
      User.findByIdAndDelete.mockResolvedValue(null);
      const res = mockRes();
      await deleteUser({ params: { id: "x" } }, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
