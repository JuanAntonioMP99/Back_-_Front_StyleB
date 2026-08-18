import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/mswServer";
import { API } from "../test/handlers";
import { login, register } from "./authService";
import { getAllProducts, getProductById } from "./productService";

// Integración real: componente NO involucrado, pero SÍ el apiClient real
// (interceptores de request/response, inyección de token, classifyError) contra
// una red mockeada por MSW. No requiere backend en ejecución.

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe("authService + apiClient (MSW)", () => {
  it("login exitoso devuelve { token, refreshToken }", async () => {
    const result = await login({ email: "ada@mail.com", password: "secret123" });

    expect(typeof result.token).toBe("string");
    expect(result.refreshToken).toBe("refresh-1");
  });

  it("login con credenciales incorrectas → rechazo clasificado CLIENT_ERROR 400", async () => {
    await expect(
      login({ email: "ada@mail.com", password: "wrongpass" }),
    ).rejects.toMatchObject({ kind: "CLIENT_ERROR", status: 400 });
  });

  it("register exitoso resuelve con la respuesta del backend (201)", async () => {
    const res = await register("Ada", "ada@mail.com", "secret123");

    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({ role: "customer" });
  });
});

describe("productService + apiClient (MSW)", () => {
  it("getAllProducts devuelve el array del catálogo", async () => {
    const products = await getAllProducts();

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({ _id: "p1", name: "Camisa" });
  });

  it("getProductById existente → objeto", async () => {
    const product = await getProductById("p1");

    expect(product).toMatchObject({ _id: "p1" });
  });

  it("getProductById inexistente → rechazo NOT_FOUND 404", async () => {
    await expect(getProductById("missing")).rejects.toMatchObject({
      kind: "NOT_FOUND",
      status: 404,
    });
  });

  it("error 500 del backend → rechazo SERVER_ERROR", async () => {
    await expect(getProductById("boom")).rejects.toMatchObject({
      kind: "SERVER_ERROR",
      status: 500,
    });
  });
});

describe("interceptor de request de apiClient", () => {
  it("inyecta Authorization: Bearer <token> cuando hay token en localStorage", async () => {
    let receivedAuth = null;
    server.use(
      http.get(`${API}/products`, ({ request }) => {
        receivedAuth = request.headers.get("authorization");
        return HttpResponse.json([]);
      }),
    );
    localStorage.setItem("authToken", "tok-123");

    await getAllProducts();

    expect(receivedAuth).toBe("Bearer tok-123");
  });

  it("sin token en localStorage no envía Authorization", async () => {
    let receivedAuth = "unset";
    server.use(
      http.get(`${API}/products`, ({ request }) => {
        receivedAuth = request.headers.get("authorization");
        return HttpResponse.json([]);
      }),
    );

    await getAllProducts();

    expect(receivedAuth).toBeNull();
  });
});
