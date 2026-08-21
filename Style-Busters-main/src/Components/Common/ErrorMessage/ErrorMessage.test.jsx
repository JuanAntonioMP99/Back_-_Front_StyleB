import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ErrorMessage from "./ErrorMessage";

describe("ErrorMessage", () => {
  it("renderiza los children dentro del contenedor de error", () => {
    render(<ErrorMessage>Algo falló</ErrorMessage>);
    const el = screen.getByText("Algo falló");
    expect(el).toHaveClass("error-message");
  });
});
