import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "../test/mswServer";
import { API } from "../test/handlers";
import { AuthProvider } from "../Context/AuthContext";
import { CartProvider } from "../Context/CartContext";
import Home from "./HomePage";

// Integración de página: Home → productService → apiClient real → red MSW.
// Renderiza también List + ProductCard (usan Router + CartContext).

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function renderHome() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Home />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("HomePage (integración con MSW)", () => {
  it("carga y renderiza los productos del catálogo", async () => {
    renderHome();

    // Nota: List no tiene ningún parámetro de título (ni `titile` ni `title`),
    // así que se afirma sobre los productos realmente pintados.
    expect(await screen.findByText("Camisa")).toBeInTheDocument();
    expect(screen.getByText("Pantalón")).toBeInTheDocument();
  });

  it("catálogo vacío → mensaje de sin productos", async () => {
    server.use(http.get(`${API}/products`, () => HttpResponse.json([])));
    renderHome();

    expect(
      await screen.findByText(/no hay productos en el catalogo/i),
    ).toBeInTheDocument();
  });

  it("error 500 del backend → mensaje de error de servidor", async () => {
    server.use(
      http.get(`${API}/products`, () =>
        HttpResponse.json({ status: "error" }, { status: 500 }),
      ),
    );
    renderHome();

    expect(
      await screen.findByText(/algo salió mal, intente más tarde/i),
    ).toBeInTheDocument();
  });
});
