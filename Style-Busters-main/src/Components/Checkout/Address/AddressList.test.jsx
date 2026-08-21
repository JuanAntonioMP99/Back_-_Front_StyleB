import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddressList from "./AddressList";

const addresses = [
  { _id: "a1", name: "Casa", address1: "Calle 1", city: "Ags", postalCode: "20000" },
  { _id: "a2", name: "Trabajo", address1: "Calle 2", city: "Ags", postalCode: "20001" },
];

function setup(props = {}) {
  const handlers = {
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn(),
  };
  render(
    <AddressList addresses={addresses} selectedAddress={addresses[0]} {...handlers} {...props} />,
  );
  return handlers;
}

describe("AddressList", () => {
  it("renderiza un item por dirección", () => {
    setup();
    expect(screen.getByText("Casa")).toBeInTheDocument();
    expect(screen.getByText("Trabajo")).toBeInTheDocument();
  });

  it("marca como seleccionada la que coincide con selectedAddress", () => {
    setup();
    // La dirección "Casa" (a1) está seleccionada → su botón dice "Seleccionada".
    expect(screen.getByRole("button", { name: /seleccionada/i })).toBeDisabled();
  });

  it("'Agregar Nueva Dirección' invoca onAdd", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.click(screen.getByRole("button", { name: /agregar nueva dirección/i }));
    expect(onAdd).toHaveBeenCalled();
  });
});
