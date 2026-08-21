import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

const state = vi.hoisted(() => ({
  auth: { user: null, isAuthenticated: false, logout: vi.fn() },
}));

vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => state.auth,
}));
vi.mock("../../Context/CartContext", () => ({
  useCart: () => ({ count: 3 }),
}));
vi.mock("../../Context/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    state.auth = { user: null, isAuthenticated: false, logout: vi.fn() };
  });

  it("muestra el contador del carrito", () => {
    renderHeader();
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3");
  });

  it("no autenticado: invita a iniciar sesión", () => {
    renderHeader();
    expect(screen.getByText(/hola, inicia sesión/i)).toBeInTheDocument();
  });

  it("autenticado: saluda con el nombre del usuario", () => {
    state.auth = {
      user: { name: "Ada", email: "ada@example.com" },
      isAuthenticated: true,
      logout: vi.fn(),
    };
    renderHeader();
    expect(screen.getByText(/hola, ada/i)).toBeInTheDocument();
  });
});
