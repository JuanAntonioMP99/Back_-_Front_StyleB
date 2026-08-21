import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Navigation from "./Navigation";

function renderNav(props = {}) {
  return render(
    <MemoryRouter>
      <Navigation {...props} />
    </MemoryRouter>,
  );
}

describe("Navigation", () => {
  it("desktop: muestra el botón de categorías y no enlaces a rutas inexistentes", () => {
    renderNav();
    expect(
      screen.getByRole("button", { name: /todas las categorías/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /ofertas del día/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /novedades/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /más vendidos/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /flash sale/i }),
    ).not.toBeInTheDocument();
  });

  it("móvil: renderiza solo los enlaces de categorías, sin los enlaces destacados eliminados", () => {
    renderNav({ isMobile: true });
    expect(
      screen.queryByRole("link", { name: /ofertas del día/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /novedades/i }),
    ).not.toBeInTheDocument();
  });
});
