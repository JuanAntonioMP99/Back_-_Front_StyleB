import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./Loading";

describe("Loading", () => {
  it("muestra el spinner accesible y el texto", () => {
    render(<Loading>Cargando productos…</Loading>);
    expect(screen.getByLabelText(/cargando/i)).toBeInTheDocument();
    expect(screen.getByText("Cargando productos…")).toBeInTheDocument();
  });
});
