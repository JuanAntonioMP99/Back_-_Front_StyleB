import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import authMiddleware from "../../../src/middlewares/authMiddleware.js";

// Dobles mínimos de Express: res.status(...).json(...) encadenable.
function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

// Usuario falso: authMiddleware solo verifica firma y expiración, nunca consulta
// la BD. No se usa la factory createUser() para mantener el test puro.
const FAKE_USER = {
  _id: "507f1f77bcf86cd799439011",
  name: "Test User",
  role: "customer",
};

// Mismo payload que authController.generateToken: { userId, name, role }.
function signToken(overrides = {}) {
  const { secret = process.env.JWT_SECRET, expiresIn = "1h" } = overrides;
  return jwt.sign(
    { userId: FAKE_USER._id, name: FAKE_USER.name, role: FAKE_USER.role },
    secret,
    { expiresIn },
  );
}

describe("authMiddleware", () => {
  it("responde 401 si no hay header Authorization", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("responde 401 si el header no usa el esquema Bearer", () => {
    // "abc123".split(" ")[1] === undefined → cae en la guarda !token.
    const req = { headers: { authorization: "abc123" } };
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el token está firmado con otro secreto", () => {
    const req = {
      headers: { authorization: `Bearer ${signToken({ secret: "otro_secreto" })}` },
    };
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("responde 401 si el token está expirado", () => {
    const req = {
      headers: { authorization: `Bearer ${signToken({ expiresIn: "-1s" })}` },
    };
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("con token válido asigna req.user con el payload y llama a next()", () => {
    const req = { headers: { authorization: `Bearer ${signToken()}` } };
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    // req.user es la precondición de la que depende isAdmin y cualquier
    // comprobación de propietario posterior.
    expect(req.user).toMatchObject({
      userId: FAKE_USER._id,
      name: FAKE_USER.name,
      role: FAKE_USER.role,
    });
  });
});
