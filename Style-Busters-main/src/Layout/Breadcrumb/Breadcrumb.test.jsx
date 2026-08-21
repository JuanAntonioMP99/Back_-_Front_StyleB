import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Breadcrumb from "./Breadcrumb";

function renderCrumb(items) {
  return render(
    <MemoryRouter>
      <Breadcrumb items={items} />
    </MemoryRouter>,
  );
}

describe("Breadcrumb", () => {
  it("renderiza enlaces para items intermedios con 'to'", () => {
    renderCrumb([
      { label: "Inicio", to: "/" },
      { label: "Ropa", to: "/category/1" },
      { label: "Camiseta" },
    ]);
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Ropa" })).toHaveAttribute("href", "/category/1");
  });

  it("el último item es texto plano y marca la posición actual", () => {
    renderCrumb([
      { label: "Inicio", to: "/" },
      { label: "Camiseta" },
    ]);
    const current = screen.getByText("Camiseta");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Camiseta" })).not.toBeInTheDocument();
  });
});
