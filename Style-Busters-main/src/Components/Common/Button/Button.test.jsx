import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("renderiza children y tipo 'button' por defecto con clases base", () => {
    render(<Button>Enviar</Button>);
    const btn = screen.getByRole("button", { name: "Enviar" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveClass("btn", "btn-primary");
  });

  it("compone clases con variant, size y className extra", () => {
    render(
      <Button variant="secondary" size="lg" className="extra">
        X
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "X" });
    expect(btn).toHaveClass("btn", "btn-secondary", "btn-lg", "extra");
  });

  it("dispara onClick y respeta disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1); // no aumenta
  });

  it("reenvía props extra como data-testid y type submit", () => {
    render(
      <Button type="submit" data-testid="save-btn">
        Guardar
      </Button>,
    );
    const btn = screen.getByTestId("save-btn");
    expect(btn).toHaveAttribute("type", "submit");
  });
});
