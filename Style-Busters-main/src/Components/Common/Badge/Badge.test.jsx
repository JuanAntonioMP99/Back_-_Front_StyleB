import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Badge from "./Badge";

describe("Badge", () => {
  it("renderiza el texto con la variante por defecto (info)", () => {
    render(<Badge text="Nuevo" />);
    const el = screen.getByText("Nuevo");
    expect(el).toHaveClass("badge", "badge-info");
  });

  it("aplica la variante y className provistos", () => {
    render(<Badge text="En stock" variant="success" className="x" />);
    const el = screen.getByText("En stock");
    expect(el).toHaveClass("badge", "badge-success", "x");
  });
});
