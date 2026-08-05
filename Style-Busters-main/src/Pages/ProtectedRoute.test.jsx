import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// useAuth se mockea para controlar el estado de sesión sin montar el provider real.
let authState;
vi.mock("../Context/AuthContext", () => ({
  useAuth: () => authState,
}));

import ProtectedRoute from "./ProtectedRoute";

function renderAt(path = "/secret") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute>
              <div>Contenido protegido</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authState = { isAuthenticated: false, loading: false };
  });

  it("mientras loading no renderiza ni el contenido ni redirige", () => {
    authState = { isAuthenticated: false, loading: true };
    renderAt();

    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });

  it("no autenticado → redirige a /login", () => {
    authState = { isAuthenticated: false, loading: false };
    renderAt();

    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("autenticado → renderiza el contenido protegido", () => {
    authState = { isAuthenticated: true, loading: false };
    renderAt();

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });
});
