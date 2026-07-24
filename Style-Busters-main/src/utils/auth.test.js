import { afterEach, describe, expect, it } from "vitest";
import {
  clearToken,
  decodeToken,
  getToken,
  isTokenExpired,
  saveToken,
} from "./auth";

/** Construye un JWT falso (header.payload.signature) con el payload dado. */
function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe("utils/auth", () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe("saveToken / getToken / clearToken", () => {
    it("guarda y lee el token bajo la clave authToken", () => {
      saveToken("abc.def.ghi");
      expect(getToken()).toBe("abc.def.ghi");
      expect(localStorage.getItem("authToken")).toBe("abc.def.ghi");
    });

    it("ignora tokens vacíos/falsy", () => {
      saveToken("");
      saveToken(null);
      expect(getToken()).toBeNull();
    });

    it("clearToken elimina el token", () => {
      saveToken("abc.def.ghi");
      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe("decodeToken", () => {
    it("decodifica el payload de un JWT válido", () => {
      const token = makeToken({ userId: "u1", name: "Ada", role: "customer" });
      expect(decodeToken(token)).toMatchObject({
        userId: "u1",
        name: "Ada",
        role: "customer",
      });
    });

    it("devuelve null ante un token malformado", () => {
      expect(decodeToken("no-es-un-jwt")).toBeNull();
      expect(decodeToken("")).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("es true cuando exp está en el pasado", () => {
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 60 });
      expect(isTokenExpired(token)).toBe(true);
    });

    it("es false cuando exp está en el futuro", () => {
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
      expect(isTokenExpired(token)).toBe(false);
    });

    it("es true cuando no hay exp", () => {
      const token = makeToken({ userId: "u1" });
      expect(isTokenExpired(token)).toBe(true);
    });
  });
});
