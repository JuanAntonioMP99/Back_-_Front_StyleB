import { describe, it, expect, vi, afterEach } from "vitest";
import logger from "../../../src/middlewares/logger.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("logger", () => {
  it("llama a next() para no cortar la cadena de middlewares", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const next = vi.fn();

    logger({ method: "GET", url: "/api/products" }, {}, next);

    expect(next).toHaveBeenCalledOnce();
    consoleLog.mockRestore();
  });

  it("emite una línea con formato `ISO | método | url`", () => {
    // Reloj fijo: la marca de tiempo pasa a ser determinista y se puede afirmar
    // el formato exacto en vez de un regex laxo.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T10:20:30.000Z"));
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    logger({ method: "POST", url: "/api/auth/login" }, {}, vi.fn());

    expect(consoleLog).toHaveBeenCalledWith(
      "2026-07-16T10:20:30.000Z | POST | /api/auth/login",
    );
    consoleLog.mockRestore();
  });
});
