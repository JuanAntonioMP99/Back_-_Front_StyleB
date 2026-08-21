import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ImageCarousel from "./ImageCarousel";

const images = ["/a.png", "/b.png", "/c.png"];

describe("ImageCarousel", () => {
  it("no renderiza nada sin imágenes", () => {
    const { container } = render(<ImageCarousel images={[]} altText="Prod" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra la primera imagen y sin controles con una sola imagen", () => {
    render(<ImageCarousel images={["/a.png"]} altText="Prod" />);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Prod - Vista 1");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("avanza a la siguiente imagen con el botón siguiente", async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={images} altText="Prod" />);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Prod - Vista 1");
    await user.click(screen.getByRole("button", { name: "❯" }));
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Prod - Vista 2");
  });

  it("retrocede en circular desde la primera con el botón anterior", async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={images} altText="Prod" />);
    await user.click(screen.getByRole("button", { name: "❮" }));
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Prod - Vista 3");
  });
});
