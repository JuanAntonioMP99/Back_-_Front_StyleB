import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PaymentForm from "./PaymentForm";

describe("PaymentForm", () => {
  it("modo nuevo: título y botón de alta", () => {
    render(<PaymentForm onSubmit={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /nuevo método de pago/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agregar método de pago/i })).toBeInTheDocument();
  });

  it("envía los datos capturados vía onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PaymentForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/alias de la tarjeta/i), "Bancomer");
    await user.type(screen.getByLabelText(/número de tarjeta/i), "4444-4444-4444-5555");
    await user.type(screen.getByLabelText(/nombre del titular/i), "Ada");
    await user.type(screen.getByLabelText(/fecha de expiración/i), "08/31");
    await user.type(screen.getByLabelText(/cvv/i), "123");
    await user.click(screen.getByRole("button", { name: /agregar método de pago/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        alias: "Bancomer",
        cardNumber: "4444-4444-4444-5555",
        placeHolder: "Ada",
        expiryDate: "08/31",
        cvv: "123",
      }),
    );
  });

  it("modo edición: precarga y muestra 'Guardar Cambios'", () => {
    render(
      <PaymentForm onSubmit={vi.fn()} isEdit initialValues={{ alias: "Mi tarjeta" }} />,
    );
    expect(screen.getByRole("heading", { name: /editar método de pago/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/alias de la tarjeta/i)).toHaveValue("Mi tarjeta");
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it("cancelar invoca onCancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<PaymentForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
