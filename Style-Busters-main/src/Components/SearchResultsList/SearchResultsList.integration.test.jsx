import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { AuthProvider } from "../../Context/AuthContext";
import { CartProvider } from "../../Context/CartContext";
import SearchResultsList from "./SearchResultsList";

// Integración: SearchResultsList lee ?q de la URL, carga el catálogo vía MSW y
// filtra en cliente. Renderiza List + ProductCard (Router + CartContext).

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function renderSearch(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <CartProvider>
          <SearchResultsList />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("SearchResultsList (integración con MSW)", () => {
  it("con query coincidente muestra los resultados", async () => {
    renderSearch("/search?q=camisa");

    expect(
      await screen.findByText(/resultados para "camisa"/i),
    ).toBeInTheDocument();
    expect(await screen.findByText("Camisa")).toBeInTheDocument();
  });

  it("con query sin coincidencias muestra 'No encontramos coincidencias'", async () => {
    renderSearch("/search?q=zzzznoexiste");

    expect(
      await screen.findByText(/no encontramos coincidencias/i),
    ).toBeInTheDocument();
  });

  it("sin query invita a buscar", async () => {
    renderSearch("/search");

    expect(
      await screen.findByText(/¿buscas algo en especial\?/i),
    ).toBeInTheDocument();
  });
});
