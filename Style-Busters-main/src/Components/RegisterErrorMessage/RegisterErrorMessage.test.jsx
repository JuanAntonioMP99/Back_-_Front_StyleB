import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RegisterErrorMessage from "./RegisterErrorMessage";

describe("RegisterErrorMessage", () => {
  it("no renderiza nada si no hay kind", () => {
    const { container } = render(<RegisterErrorMessage kind={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("traduce un kind conocido a su mensaje", () => {
    render(<RegisterErrorMessage kind="NETWORK" />);
    expect(screen.getByTestId("form-error-message")).toHaveTextContent(
      /no pudimos conectar con el servidor/i,
    );
  });

  it("cae al mensaje UNKNOWN ante un kind desconocido", () => {
    render(<RegisterErrorMessage kind="ALGO_RARO" />);
    expect(screen.getByTestId("form-error-message")).toHaveTextContent(
      /ocurrió un error inesperado/i,
    );
  });
});
