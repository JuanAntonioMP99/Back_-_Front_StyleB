import { describe, it, expect, vi } from "vitest";
import { body } from "express-validator";
import validate from "../../../src/middlewares/validation.js";

// Dobles mínimos de Express: res.status(...).json(...) encadenable.
function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

// req plano con la forma que express-validator inspecciona.
function mockReq(bodyData = {}) {
  return { body: bodyData, cookies: {}, headers: {}, params: {}, query: {} };
}

// Se ejecutan cadenas REALES de express-validator sobre el req: es lo que hace
// Express antes de llegar a `validate`. Mockear validationResult() haría que el
// test afirmara sobre el mock en vez de sobre el middleware.
async function runChains(chains, req) {
  for (const chain of chains) {
    await chain.run(req);
  }
}

describe("validate", () => {
  it("llama a next() cuando no hay errores de validación", async () => {
    const req = mockReq({ name: "Camiseta" });
    const res = mockRes();
    const next = vi.fn();

    await runChains([body("name").notEmpty()], req);
    validate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("responde 422 con { errors: [...] } cuando hay errores y no llama a next()", async () => {
    const req = mockReq({ name: "" });
    const res = mockRes();
    const next = vi.fn();

    await runChains(
      [body("name").notEmpty().withMessage("Name is required")],
      req,
    );
    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(next).not.toHaveBeenCalled();

    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty("errors");
    expect(payload.errors).toHaveLength(1);
    expect(payload.errors[0]).toMatchObject({
      msg: "Name is required",
      path: "name",
      location: "body",
    });
  });

  it("incluye todos los errores acumulados, no solo el primero", async () => {
    const req = mockReq({ name: "", price: "no-es-numero" });
    const res = mockRes();
    const next = vi.fn();

    await runChains(
      [
        body("name").notEmpty().withMessage("Name is required"),
        body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
      ],
      req,
    );
    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    const payload = res.json.mock.calls[0][0];
    expect(payload.errors).toHaveLength(2);
    expect(payload.errors.map((e) => e.path).sort()).toEqual(["name", "price"]);
  });

  it("llama a next() si no se ejecutó ninguna cadena de validación", async () => {
    // Una ruta sin validadores: validationResult no encuentra errores → pasa.
    const req = mockReq({ cualquier: "cosa" });
    const res = mockRes();
    const next = vi.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
