import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddressItem from "./AddressItem";

const address = {
  _id: "a1",
  name: "Casa",
  address1: "Calle 1",
  city: "Aguascalientes",
  postalCode: "20000",
  default: true,
};

function setup(props = {}) {
  const handlers = { onSelect: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(<AddressItem address={address} {...handlers} {...props} />);
  return handlers;
}

describe("AddressItem", () => {
  it("muestra los datos y la insignia de predeterminada", () => {
    setup();
    expect(screen.getByText("Casa")).toBeInTheDocument();
    expect(screen.getByText("Calle 1")).toBeInTheDocument();
    expect(screen.getByText(/aguascalientes, 20000/i)).toBeInTheDocument();
    expect(screen.getByText(/predeterminada/i)).toBeInTheDocument();
  });

  it("seleccionar invoca onSelect con la dirección", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    await user.click(screen.getByRole("button", { name: /^seleccionar$/i }));
    expect(onSelect).toHaveBeenCalledWith(address);
  });

  it("el botón queda deshabilitado si ya está seleccionada", () => {
    setup({ isSelected: true });
    expect(screen.getByRole("button", { name: /seleccionada/i })).toBeDisabled();
  });

  it("editar y eliminar invocan sus callbacks", async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = setup();
    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onEdit).toHaveBeenCalledWith(address);
    expect(onDelete).toHaveBeenCalledWith(address);
  });
});
