import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PaymentItem from "./PaymentItem";

const payment = {
  _id: "p1",
  alias: "Bancomer",
  cardNumber: "4444-4444-4444-5555",
  expiryDate: "08/31",
  placeHolder: "Ada",
  isDefault: true,
};

function setup(props = {}) {
  const handlers = { onSelect: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(<PaymentItem payment={payment} {...handlers} {...props} />);
  return handlers;
}

describe("PaymentItem", () => {
  it("muestra alias, tarjeta enmascarada, vencimiento y titular", () => {
    setup();
    expect(screen.getByText("Bancomer")).toBeInTheDocument();
    expect(screen.getByText("**** **** **** 5555")).toBeInTheDocument();
    expect(screen.getByText(/vence: 08\/31/i)).toBeInTheDocument();
    expect(screen.getByText(/titular: ada/i)).toBeInTheDocument();
    expect(screen.getByText(/predeterminada/i)).toBeInTheDocument();
  });

  it("enmascara por completo si no hay número", () => {
    setup({ payment: { ...payment, cardNumber: "" } });
    expect(screen.getByText("**** **** **** ****")).toBeInTheDocument();
  });

  it("seleccionar invoca onSelect y se deshabilita si ya está seleccionada", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    await user.click(screen.getByRole("button", { name: /^seleccionar$/i }));
    expect(onSelect).toHaveBeenCalledWith(payment);
  });

  it("editar y eliminar invocan sus callbacks", async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = setup();
    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onEdit).toHaveBeenCalledWith(payment);
    expect(onDelete).toHaveBeenCalledWith(payment);
  });
});
