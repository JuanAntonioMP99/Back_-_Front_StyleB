import { afterEach, describe, expect, it, vi } from "vitest";

// CA-1: apiClient.js lee REACT_APP_API_URL y, si no está definida (undefined o
// vacía), lanza un Error explícito al cargarse el módulo, sin fallback a
// ninguna URL. vi.stubEnv + vi.resetModules fuerzan una reimportación fresca
// del módulo con el valor de entorno manipulado para cada caso.
describe("apiClient - REACT_APP_API_URL requerida (sin fallback)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("lanza un Error explícito al importarse si la variable está vacía", async () => {
    vi.stubEnv("REACT_APP_API_URL", "");

    await expect(import("./apiClient.js")).rejects.toThrow(
      /REACT_APP_API_URL/,
    );
  });

  it("lanza un Error explícito al importarse si la variable está undefined", async () => {
    vi.stubEnv("REACT_APP_API_URL", undefined);

    await expect(import("./apiClient.js")).rejects.toThrow(
      /REACT_APP_API_URL/,
    );
  });

  it("no lanza y usa la URL provista cuando la variable está definida", async () => {
    vi.stubEnv("REACT_APP_API_URL", "http://localhost:4000/api");

    const { default: apiClient } = await import("./apiClient.js");

    expect(apiClient.defaults.baseURL).toBe("http://localhost:4000/api");
  });
});
