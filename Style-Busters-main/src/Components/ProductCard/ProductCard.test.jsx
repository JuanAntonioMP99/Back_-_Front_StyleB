import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard";

// Mock del contexto de carrito para aislar la ProductCard.
const addItem = vi.fn();
vi.mock("../../Context/CartContext", () => ({
  useCart: () => ({ addItem }),
}));

const product = {
  _id: "p1",
  name: "Camiseta Azul",
  price: 199,
  stock: 5,
  imagesUrl: ["http://img/1.png"],
  description: "Una camiseta cómoda",
};

function renderCard(p = product) {
  return render(
    <MemoryRouter>
      <ProductCard product={p} />
    </MemoryRouter>,
  );
}

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza nombre, precio y enlace al detalle", () => {
    renderCard();
    expect(screen.getByText("Camiseta Azul")).toBeInTheDocument();
    expect(screen.getByText("$199")).toBeInTheDocument();
    expect(screen.getByTestId("product-card-p1")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/product/p1");
  });

  it("agrega el producto al carrito al hacer click", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByTestId("product-card-add-button-p1"));
    expect(addItem).toHaveBeenCalledWith(product, 1);
  });

  it("deshabilita el botón cuando no hay stock", () => {
    renderCard({ ...product, stock: 0 });
    expect(screen.getByTestId("product-card-add-button-p1")).toBeDisabled();
    expect(screen.getByText(/agotado/i)).toBeInTheDocument();
  });

  it("muestra fallback cuando no hay producto", () => {
    render(
      <MemoryRouter>
        <ProductCard product={null} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no disponible/i)).toBeInTheDocument();
  });
});
