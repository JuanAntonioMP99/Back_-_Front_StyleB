import { beforeEach, describe, expect, it, vi } from "vitest";

// apiClient es el axios preconfigurado; lo mockeamos para no tocar la red.
vi.mock("./apiClient", () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

import apiClient from "./apiClient";
import { login, register } from "./authService";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("POST /auth/login con email normalizado y devuelve token+refreshToken", async () => {
      apiClient.post.mockResolvedValue({
        data: { token: "t.k.n", refreshToken: "r.k.n" },
      });

      const result = await login({
        email: "  USER@Mail.COM ",
        password: "secret123",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
        email: "user@mail.com",
        password: "secret123",
      });
      expect(result).toEqual({ token: "t.k.n", refreshToken: "r.k.n" });
    });

    it("propaga el error clasificado del apiClient", async () => {
      apiClient.post.mockRejectedValue({ kind: "CLIENT_ERROR", status: 400 });
      await expect(
        login({ email: "a@b.com", password: "x" }),
      ).rejects.toMatchObject({ kind: "CLIENT_ERROR", status: 400 });
    });
  });

  describe("register", () => {
    it("POST /auth/register con name/email/phone normalizados", async () => {
      apiClient.post.mockResolvedValue({ data: { name: "Ada" } });

      await register("  Ada  ", "  ADA@Mail.com ", "secret123", " 555 ");

      expect(apiClient.post).toHaveBeenCalledWith("/auth/register", {
        name: "Ada",
        email: "ada@mail.com",
        password: "secret123",
        phone: "555",
      });
    });

    it("envía phone undefined cuando no se provee", async () => {
      apiClient.post.mockResolvedValue({ data: {} });
      await register("Ada", "ada@mail.com", "secret123");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/auth/register",
        expect.objectContaining({ phone: undefined }),
      );
    });
  });
});
