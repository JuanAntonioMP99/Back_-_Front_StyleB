import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "../../test/mswServer";
import { AuthProvider } from "../../Context/AuthContext";
import LoginForm from "./LoginForm";

// Integración de extremo a extremo del cliente: LoginForm → AuthContext.login →
// authService → apiClient (interceptores reales) → red mockeada por MSW.
// A diferencia de LoginForm.test.jsx (que mockea authService), aquí NO se mockea
// la capa de servicio: solo la red. No requiere backend en ejecución.

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginForm (integración con MSW)", () => {
  it("login exitoso guarda el token y navega a /", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId("login-email-input"), "ada@mail.com");
    await user.type(screen.getByTestId("login-password-input"), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem("authToken")).toBeTruthy();
    });
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("error del backend muestra mensaje y no guarda token", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId("login-email-input"), "ada@mail.com");
    await user.type(screen.getByTestId("login-password-input"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(
      await screen.findByText(/email o contraseña incorrectos/i),
    ).toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
