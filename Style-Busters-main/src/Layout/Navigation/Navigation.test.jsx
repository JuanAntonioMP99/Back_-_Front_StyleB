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
  it("desktop: muestra el botón de categorías y los enlaces destacados", () => {
    renderNav();
    expect(
      screen.getByRole("button", { name: /todas las categorías/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ofertas del día/i })).toHaveAttribute(
      "href",
      "/offers",
    );
    expect(screen.getByRole("link", { name: /novedades/i })).toHaveAttribute(
      "href",
      "/new",
    );
    expect(screen.getByRole("link", { name: /más vendidos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /flash sale/i })).toBeInTheDocument();
  });

  it("móvil: renderiza los enlaces destacados como navegación móvil", () => {
    renderNav({ isMobile: true });
    expect(screen.getByRole("link", { name: /ofertas del día/i })).toHaveAttribute(
      "href",
      "/offers",
    );
    expect(screen.getByRole("link", { name: /novedades/i })).toBeInTheDocument();
  });
});
