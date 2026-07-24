import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import errorHandler from "../../../src/middlewares/errorHandler.js";

// fs se mockea para no escribir en el logs/error.log real del proyecto. El
// callback de appendFile se invoca con null (éxito) salvo que un test lo cambie.
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    appendFile: vi.fn((_path, _msg, cb) => cb?.(null)),
  },
}));

function mockRes({ headersSent = false } = {}) {
  const res = { headersSent };
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

const req = { method: "POST", url: "/api/products" };

beforeEach(() => {
  fs.existsSync.mockReturnValue(true);
  fs.appendFile.mockImplementation((_path, _msg, cb) => cb?.(null));
});

describe("errorHandler", () => {
  it("responde 500 con el cuerpo genérico, sin filtrar el error interno", () => {
    const res = mockRes();
    const err = new Error("Detalle interno con datos sensibles");

    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal Server Error",
    });
    // El mensaje real del error no debe llegar al cliente.
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(
      "Detalle interno",
    );
  });

  it("no vuelve a responder si res.headersSent es true", () => {
    const res = mockRes({ headersSent: true });

    errorHandler(new Error("boom"), req, res, vi.fn());

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    // Aun así deja constancia en el log.
    expect(fs.appendFile).toHaveBeenCalledOnce();
  });

  it("registra en logs/error.log el método, la url y el mensaje del error", () => {
    const res = mockRes();

    errorHandler(new Error("fallo de conexion"), req, res, vi.fn());

    expect(fs.appendFile).toHaveBeenCalledOnce();
    const [logPath, logMessage] = fs.appendFile.mock.calls[0];
    expect(logPath).toMatch(/logs[\\/]error\.log$/);
    expect(logMessage).toContain("POST");
    expect(logMessage).toContain("/api/products");
    expect(logMessage).toContain("fallo de conexion");
    expect(logMessage.endsWith("\n")).toBe(true);
  });

  it("crea el directorio de logs si no existe", () => {
    fs.existsSync.mockReturnValue(false);
    const res = mockRes();

    errorHandler(new Error("boom"), req, res, vi.fn());

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringMatching(/logs$/), {
      recursive: true,
    });
  });

  it("si falla la escritura del log, avisa por consola y aun así responde 500", () => {
    fs.appendFile.mockImplementation((_p, _m, cb) => cb(new Error("EACCES")));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = mockRes();

    expect(() => errorHandler(new Error("boom"), req, res, vi.fn())).not.toThrow();

    expect(consoleError).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
