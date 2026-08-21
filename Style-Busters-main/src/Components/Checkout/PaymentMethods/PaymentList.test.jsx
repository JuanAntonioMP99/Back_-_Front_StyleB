import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PaymentList from "./PaymentList";

const payments = [
  { _id: "p1", alias: "Banorte", cardNumber: "4444-4444-4444-4444", expiryDate: "01/30", placeHolder: "A" },
  { _id: "p2", alias: "Bancomer", cardNumber: "4444-4444-4444-5555", expiryDate: "08/31", placeHolder: "B" },
];

function setup(props = {}) {
  const handlers = {
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
  };
  render(
    <PaymentList payments={payments} selectedPayment={payments[1]} {...handlers} {...props} />,
  );
  return handlers;
}

describe("PaymentList", () => {
  it("renderiza un item por método de pago", () => {
    setup();
    expect(screen.getByText("Banorte")).toBeInTheDocument();
    expect(screen.getByText("Bancomer")).toBeInTheDocument();
  });

  it("marca como seleccionado el que coincide con selectedPayment", () => {
    setup();
    expect(screen.getByRole("button", { name: /seleccionada/i })).toBeDisabled();
  });

  it("'Agregar Nueva Tarjeta' invoca onAdd", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.click(screen.getByRole("button", { name: /agregar nueva tarjeta/i }));
    expect(onAdd).toHaveBeenCalled();
  });
});
