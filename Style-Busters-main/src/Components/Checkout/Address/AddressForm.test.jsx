import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddressForm from "./AddressForm";

describe("AddressForm", () => {
  it("modo nuevo: título y botón de alta", () => {
    render(<AddressForm onSubmit={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /nueva dirección/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agregar dirección/i })).toBeInTheDocument();
  });

  it("envía los datos capturados vía onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<AddressForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/nombre de la dirección/i), "Casa");
    await user.type(screen.getByLabelText(/dirección línea 1/i), "Calle 1");
    await user.type(screen.getByLabelText(/código postal/i), "20000");
    await user.type(screen.getByLabelText(/ciudad/i), "Aguascalientes");
    await user.type(screen.getByLabelText(/país/i), "México");
    await user.click(screen.getByRole("button", { name: /agregar dirección/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Casa",
        address1: "Calle 1",
        postalCode: "20000",
        city: "Aguascalientes",
        country: "México",
      }),
    );
  });

  it("modo edición: precarga valores y muestra 'Guardar Cambios'", () => {
    render(
      <AddressForm
        onSubmit={vi.fn()}
        isEdit
        initialValues={{ name: "Trabajo", city: "CDMX" }}
      />,
    );
    expect(screen.getByRole("heading", { name: /editar dirección/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de la dirección/i)).toHaveValue("Trabajo");
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it("cancelar invoca onCancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<AddressForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
