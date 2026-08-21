import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SearchForm from "./SearchForm";

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="loc">{`${loc.pathname}${loc.search}`}</div>;
}

function renderSearch(props = {}) {
  return render(
    <MemoryRouter>
      <SearchForm {...props} />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("SearchForm", () => {
  it("navega a /search?q=... con el término tecleado", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByPlaceholderText(/buscar productos/i), "zapato");
    await user.click(screen.getByRole("button", { name: /buscar/i }));
    expect(screen.getByTestId("loc")).toHaveTextContent("/search?q=zapato");
  });

  it("navega a /search sin query si el término está vacío", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(screen.getByRole("button", { name: /buscar/i }));
    expect(screen.getByTestId("loc")).toHaveTextContent("/search");
    expect(screen.getByTestId("loc")).not.toHaveTextContent("?q=");
  });

  it("invoca onSubmitted tras buscar", async () => {
    const onSubmitted = vi.fn();
    const user = userEvent.setup();
    renderSearch({ onSubmitted });
    await user.type(screen.getByPlaceholderText(/buscar productos/i), "x");
    await user.click(screen.getByRole("button", { name: /buscar/i }));
    expect(onSubmitted).toHaveBeenCalled();
  });
});
