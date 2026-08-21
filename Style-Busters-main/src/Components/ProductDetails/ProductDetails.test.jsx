import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetails from "./ProductDetails";

vi.mock("../../Services/productService", () => ({
  getProductById: vi.fn(),
}));

const addItem = vi.fn();
vi.mock("../../Context/CartContext", () => ({
  useCartActions: () => ({ addItem }),
}));

import { getProductById } from "../../Services/productService";

const product = {
  _id: "p1",
  name: "Camiseta Azul",
  description: "Muy cómoda",
  price: 199,
  stock: 5,
  imageURL: "http://img/1.png",
  category: { id: "c1", name: "Ropa" },
};

function renderDetails(id = "p1") {
  return render(
    <MemoryRouter>
      <ProductDetails productId={id} />
    </MemoryRouter>,
  );
}

describe("ProductDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el producto tras cargar", async () => {
    getProductById.mockResolvedValue(product);
    renderDetails();

    expect(await screen.findByTestId("product-detail")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Camiseta Azul" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$199")).toBeInTheDocument();
    expect(screen.getByTestId("add-to-cart-button")).toBeEnabled();
  });

  it("agrega el producto al carrito al hacer click", async () => {
    getProductById.mockResolvedValue(product);
    const user = userEvent.setup();
    renderDetails();

    await user.click(await screen.findByTestId("add-to-cart-button"));
    expect(addItem).toHaveBeenCalledWith(product, 1);
  });

  it("deshabilita el botón y muestra Agotado sin stock", async () => {
    getProductById.mockResolvedValue({ ...product, stock: 0 });
    renderDetails();

    expect(await screen.findByTestId("add-to-cart-button")).toBeDisabled();
    expect(screen.getByText(/agotado/i)).toBeInTheDocument();
  });

  it("muestra 'Producto no encontrado' ante NOT_FOUND", async () => {
    getProductById.mockRejectedValue({ kind: "NOT_FOUND" });
    renderDetails();

    expect(
      await screen.findByText(/producto no encontrado/i),
    ).toBeInTheDocument();
  });

  it("muestra error de conexión ante NETWORK", async () => {
    getProductById.mockRejectedValue({ kind: "NETWORK" });
    renderDetails();

    expect(
      await screen.findByText(/no pudimos conectar con el servidor/i),
    ).toBeInTheDocument();
  });

  it("muestra error del servidor ante SERVER_ERROR", async () => {
    getProductById.mockRejectedValue({ kind: "SERVER_ERROR" });
    renderDetails();

    expect(
      await screen.findByText(/algo salió mal de nuestro lado/i),
    ).toBeInTheDocument();
  });

  it("no muestra controles de navegación sin imágenes adicionales", async () => {
    getProductById.mockResolvedValue(product);
    renderDetails();

    await screen.findByTestId("product-detail");
    expect(
      screen.queryByRole("button", { name: "❯" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "❮" }),
    ).not.toBeInTheDocument();
  });

  it("no muestra controles de navegación con images vacío", async () => {
    getProductById.mockResolvedValue({ ...product, images: [] });
    renderDetails();

    await screen.findByTestId("product-detail");
    expect(
      screen.queryByRole("button", { name: "❯" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "❮" }),
    ).not.toBeInTheDocument();
  });

  it("muestra controles de navegación con imágenes adicionales", async () => {
    getProductById.mockResolvedValue({
      ...product,
      images: ["https://a.test/1.jpg", "https://a.test/2.jpg"],
    });
    renderDetails();

    await screen.findByTestId("product-detail");
    expect(
      screen.getByRole("button", { name: "❯" }),
    ).toBeInTheDocument();
  });
});
