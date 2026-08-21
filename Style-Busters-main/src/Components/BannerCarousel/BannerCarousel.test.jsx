import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BannerCarousel from "./BannerCarousel";

const banners = [
  { id: 1, title: "Verano", subtitle: "Hasta 50%", buttonText: "Comprar", image: "/1.png" },
  { id: 2, title: "Invierno", subtitle: "Nueva colección", buttonText: "Ver", image: "/2.png" },
];

describe("BannerCarousel", () => {
  it("muestra el estado vacío sin banners", () => {
    render(<BannerCarousel banners={[]} />);
    expect(screen.getByText(/no hay banners disponibles/i)).toBeInTheDocument();
  });

  it("renderiza el contenido del banner", () => {
    render(<BannerCarousel banners={[banners[0]]} />);
    expect(screen.getByRole("heading", { name: "Verano" })).toBeInTheDocument();
    expect(screen.getByText("Hasta 50%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /comprar/i })).toBeInTheDocument();
  });

  it("muestra controles anterior/siguiente con varios banners", () => {
    render(<BannerCarousel banners={banners} />);
    expect(screen.getByRole("button", { name: /banner anterior/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /banner siguiente/i })).toBeInTheDocument();
  });
});
