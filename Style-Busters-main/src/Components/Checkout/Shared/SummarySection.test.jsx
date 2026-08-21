import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SummarySection from "./SummarySection";

describe("SummarySection", () => {
  it("expandida muestra los children", () => {
    render(
      <SummarySection title="Envío" isExpanded selected>
        <div>contenido interno</div>
      </SummarySection>,
    );
    expect(screen.getByText("contenido interno")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /envío/i })).toBeInTheDocument();
  });

  it("colapsada con selección muestra el resumen y la insignia ✓", () => {
    render(
      <SummarySection
        title="Envío"
        isExpanded={false}
        selected
        summaryContent={<div>Home</div>}
      >
        <div>contenido interno</div>
      </SummarySection>,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.queryByText("contenido interno")).not.toBeInTheDocument();
  });

  it("el botón 'Cambiar' invoca onToggle", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <SummarySection
        title="Envío"
        isExpanded={false}
        selected
        summaryContent={<div>Home</div>}
        onToggle={onToggle}
      />,
    );
    await user.click(screen.getByRole("button", { name: /cambiar/i }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("click en el encabezado (fuera del botón) invoca onToggle", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <SummarySection title="Envío" isExpanded selected onToggle={onToggle} />,
    );
    await user.click(screen.getByRole("heading", { name: /envío/i }));
    expect(onToggle).toHaveBeenCalled();
  });
});
