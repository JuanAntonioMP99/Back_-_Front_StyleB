import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProfileCard from "./ProfileCard";

// ProfileCard llama useAuth() siempre; se mockea para aislar el componente y
// probar la prioridad de `userProp` sobre el usuario del contexto.
vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

describe("ProfileCard", () => {
  it("muestra datos del usuario y acciones de customer", () => {
    render(
      <ProfileCard
        user={{ name: "Ada", email: "ada@example.com", role: "customer" }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("customer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ver mis pedidos/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /panel de administración/i }),
    ).not.toBeInTheDocument();
  });

  it("muestra las acciones de admin cuando el rol es admin", () => {
    render(<ProfileCard user={{ name: "Root", role: "admin" }} />);
    expect(
      screen.getByRole("button", { name: /panel de administración/i }),
    ).toBeInTheDocument();
  });

  it("usa 'No disponible' cuando faltan datos", () => {
    render(<ProfileCard user={{ name: "Ada", role: "customer" }} />);
    // Email ausente → "No disponible".
    expect(screen.getAllByText(/no disponible/i).length).toBeGreaterThan(0);
  });
});
