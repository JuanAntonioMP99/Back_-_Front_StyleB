import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cachedRequest, clearCache, invalidateCache } from "./cache";

describe("cache", () => {
  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    clearCache();
  });

  it("cachea el valor dentro del TTL (una sola llamada al loader)", async () => {
    const loader = vi.fn().mockResolvedValue("v");
    expect(await cachedRequest("k", loader, 1000)).toBe("v");
    expect(await cachedRequest("k", loader, 1000)).toBe("v");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("deduplica peticiones en vuelo (misma promesa compartida)", async () => {
    let resolveLoader;
    const loader = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLoader = resolve;
        }),
    );
    const p1 = cachedRequest("k", loader);
    const p2 = cachedRequest("k", loader);
    expect(loader).toHaveBeenCalledTimes(1);
    resolveLoader("v");
    expect(await p1).toBe("v");
    expect(await p2).toBe("v");
  });

  it("recarga cuando el TTL expira", async () => {
    const loader = vi.fn().mockResolvedValue("v");
    await cachedRequest("k", loader, 1000);
    vi.advanceTimersByTime(1001);
    await cachedRequest("k", loader, 1000);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("no cachea errores: el siguiente intento vuelve a llamar al loader", async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");
    await expect(cachedRequest("k", loader)).rejects.toThrow("boom");
    expect(await cachedRequest("k", loader)).toBe("ok");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("invalidateCache tumba las claves por prefijo", async () => {
    const loader = vi.fn().mockResolvedValue("v");
    await cachedRequest("product:1", loader);
    invalidateCache("product");
    await cachedRequest("product:1", loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("clearCache vacía todo", async () => {
    const loader = vi.fn().mockResolvedValue("v");
    await cachedRequest("k", loader);
    clearCache();
    await cachedRequest("k", loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
