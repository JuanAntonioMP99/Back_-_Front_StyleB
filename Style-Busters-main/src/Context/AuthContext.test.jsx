import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// authService.login se mockea: este es un test UNITARIO del contexto (sin red).
vi.mock("../Services/authService", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));
import { login as loginService } from "../Services/authService";
import { AuthProvider, useAuth } from "./AuthContext";
import { makeToken } from "../test/token";

function Consumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="name">{user?.name ?? "-"}</span>
      <button onClick={() => login({ email: "a@b.com", password: "x" })}>
        login
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("sin token en localStorage → no autenticado tras cargar", async () => {
    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("no"),
    );
  });

  it("restaura la sesión desde un token válido al montar", async () => {
    localStorage.setItem("authToken", makeToken({ name: "Bob" }));

    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("yes"),
    );
    expect(screen.getByTestId("name")).toHaveTextContent("Bob");
  });

  it("token expirado → limpia el token y queda no autenticado", async () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    localStorage.setItem("authToken", makeToken({ exp: past }));

    renderAuth();

    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("no"),
    );
    expect(localStorage.getItem("authToken")).toBeNull();
  });

  it("login guarda el token y setea el usuario", async () => {
    loginService.mockResolvedValue({ token: makeToken({ name: "Ada" }) });
    const user = userEvent.setup();
    renderAuth();
    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("no"),
    );

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("yes"),
    );
    expect(screen.getByTestId("name")).toHaveTextContent("Ada");
    expect(localStorage.getItem("authToken")).toBeTruthy();
  });

  it("logout limpia el token y el usuario", async () => {
    loginService.mockResolvedValue({ token: makeToken({ name: "Ada" }) });
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("yes"),
    );

    await user.click(screen.getByRole("button", { name: "logout" }));

    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(localStorage.getItem("authToken")).toBeNull();
  });

  it("evento storage que borra el token limpia el usuario", async () => {
    loginService.mockResolvedValue({ token: makeToken({ name: "Ada" }) });
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("yes"),
    );

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "authToken", newValue: null }),
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("no"),
    );
  });
});
