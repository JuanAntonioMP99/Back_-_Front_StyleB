import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterForm from "./RegisterForm";

vi.mock("../../Services/authService", () => ({
  register: vi.fn(),
  login: vi.fn(),
}));
import { register as registerService } from "../../Services/authService";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>,
  );
}

async function fillValidForm(user) {
  await user.type(screen.getByTestId("register-name-input"), "Ada Lovelace");
  await user.type(screen.getByTestId("register-email-input"), "ada@mail.com");
  await user.type(screen.getByTestId("register-password-input"), "secret123");
  await user.type(
    screen.getByTestId("register-confirm-password-input"),
    "secret123",
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza todos los campos, botón y enlace a login", () => {
    renderRegister();
    expect(screen.getByTestId("register-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-password-input")).toBeInTheDocument();
    expect(
      screen.getByTestId("register-confirm-password-input"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /crear cuenta/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /inicia sesión/i }),
    ).toHaveAttribute("href", "/login");
  });

  it("valida campos obligatorios y no envía", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByTestId("register-name-error")).toHaveTextContent(
      /requerido/i,
    );
    expect(screen.getByTestId("register-email-error")).toBeInTheDocument();
    expect(screen.getByTestId("register-password-error")).toBeInTheDocument();
    expect(registerService).not.toHaveBeenCalled();
  });

  it("valida formato de correo inválido", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByTestId("register-name-input"), "Ada");
    await user.type(screen.getByTestId("register-email-input"), "no-es-correo");
    await user.type(screen.getByTestId("register-password-input"), "secret123");
    await user.type(
      screen.getByTestId("register-confirm-password-input"),
      "secret123",
    );
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByTestId("register-email-error")).toHaveTextContent(
      /formato/i,
    );
    expect(registerService).not.toHaveBeenCalled();
  });

  it("bloquea cuando las contraseñas no coinciden", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByTestId("register-name-input"), "Ada");
    await user.type(screen.getByTestId("register-email-input"), "ada@mail.com");
    await user.type(screen.getByTestId("register-password-input"), "secret123");
    await user.type(
      screen.getByTestId("register-confirm-password-input"),
      "otradistinta",
    );
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByTestId("register-confirm-password-error"),
    ).toHaveTextContent(/no coinciden/i);
    expect(registerService).not.toHaveBeenCalled();
  });

  it("registra y navega a /login en caso de éxito", async () => {
    const user = userEvent.setup();
    registerService.mockResolvedValue({ name: "Ada", email: "ada@mail.com" });

    renderRegister();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(registerService).toHaveBeenCalledWith(
        "Ada Lovelace",
        "ada@mail.com",
        "secret123",
        undefined,
      );
    });
    expect(navigateMock).toHaveBeenCalledWith("/login", {
      state: { justRegistered: true, email: "ada@mail.com" },
    });
  });

  it("muestra error de email ya registrado y no queda cargando", async () => {
    const user = userEvent.setup();
    registerService.mockRejectedValue({
      kind: "CLIENT_ERROR",
      status: 400,
      original: { response: { data: { message: "User already exist" } } },
    });

    renderRegister();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByTestId("register-email-error")).toHaveTextContent(
      /ya está registrado/i,
    );
    expect(
      screen.getByRole("button", { name: /crear cuenta/i }),
    ).toBeEnabled();
  });
});
