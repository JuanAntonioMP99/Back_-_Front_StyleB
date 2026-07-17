import { describe, it, expect, vi } from "vitest";
import isAdmin from "../../../src/middlewares/isAdminMiddleware.js";

// Dobles mínimos de Express: res.status(...).json(...) encadenable.
function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("isAdminMiddleware", () => {
  it("responde 401 si no hay req.user", () => {
    const res = mockRes();
    const next = vi.fn();

    isAdmin({}, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication is required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 si el rol no es admin", () => {
    const res = mockRes();
    const next = vi.fn();

    isAdmin({ user: { role: "customer" } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("llama a next() si el rol es admin", () => {
    const res = mockRes();
    const next = vi.fn();

    isAdmin({ user: { role: "admin" } }, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
