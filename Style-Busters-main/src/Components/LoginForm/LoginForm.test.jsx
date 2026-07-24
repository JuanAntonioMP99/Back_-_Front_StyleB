import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../Context/AuthContext";
import LoginForm from "./LoginForm";

// Mock del servicio de auth (usado por AuthContext.login).
vi.mock("../../Services/authService", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));
import { login as loginService } from "../../Services/authService";

// Mock de useNavigate conservando el resto de react-router-dom.
const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

/** JWT falso para que AuthContext.decodeToken funcione. */
function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renderiza email, contraseña, botón y enlace a registro", () => {
    renderLogin();
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /registrate/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("envía credenciales y navega tras login exitoso", async () => {
    const user = userEvent.setup();
    loginService.mockResolvedValue({
      token: makeToken({ userId: "u1", name: "Ada", role: "customer" }),
      refreshToken: "r",
    });

    renderLogin();
    await user.type(screen.getByTestId("login-email-input"), "ada@mail.com");
    await user.type(screen.getByTestId("login-password-input"), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(loginService).toHaveBeenCalledWith({
        email: "ada@mail.com",
        password: "secret123",
      });
    });
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("muestra mensaje ante credenciales incorrectas y no navega", async () => {
    const user = userEvent.setup();
    loginService.mockRejectedValue({
      kind: "CLIENT_ERROR",
      status: 400,
      original: { response: { data: { message: "Invalid Credentials" } } },
    });

    renderLogin();
    await user.type(screen.getByTestId("login-email-input"), "bad@mail.com");
    await user.type(screen.getByTestId("login-password-input"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(
      await screen.findByText(/email o contraseña incorrectos/i),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    // el botón deja de estar en estado de carga
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeEnabled();
  });

  it("muestra estado de carga mientras la petición está pendiente", async () => {
    const user = userEvent.setup();
    let resolveLogin;
    loginService.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );

    renderLogin();
    await user.type(screen.getByTestId("login-email-input"), "ada@mail.com");
    await user.type(screen.getByTestId("login-password-input"), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(
      await screen.findByRole("button", { name: /iniciando sesión/i }),
    ).toBeDisabled();

    resolveLogin({ token: makeToken({ userId: "u1", name: "Ada" }) });
  });
});
