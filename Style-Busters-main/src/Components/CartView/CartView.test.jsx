import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartView from "./CartView";

const mocks = vi.hoisted(() => ({
  items: [],
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
}));

vi.mock("../../Context/CartContext", () => ({
  useCart: () => ({
    items: mocks.items,
    removeItem: mocks.removeItem,
    updateQuantity: mocks.updateQuantity,
  }),
}));

const item = {
  product: { _id: "p1", name: "Camisa", price: 100, imageURL: "http://i/1.png" },
  quantity: 2,
};

describe("CartView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.items = [item];
  });

  it("renderiza el item con nombre, precio y cantidad", () => {
    render(<CartView />);
    expect(screen.getByTestId("cart-item-p1")).toBeInTheDocument();
    expect(screen.getByText("Camisa")).toBeInTheDocument();
    expect(screen.getByTestId("cart-item-quantity-p1")).toHaveTextContent("2");
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("aumentar llama updateQuantity con quantity+1", async () => {
    const user = userEvent.setup();
    render(<CartView />);
    await user.click(screen.getByTestId("cart-item-increase-p1"));
    expect(mocks.updateQuantity).toHaveBeenCalledWith("p1", 3);
  });

  it("disminuir llama updateQuantity con quantity-1", async () => {
    const user = userEvent.setup();
    render(<CartView />);
    await user.click(screen.getByTestId("cart-item-decrease-p1"));
    expect(mocks.updateQuantity).toHaveBeenCalledWith("p1", 1);
  });

  it("eliminar llama removeItem con el id del producto", async () => {
    const user = userEvent.setup();
    render(<CartView />);
    await user.click(screen.getByTestId("cart-item-remove-p1"));
    expect(mocks.removeItem).toHaveBeenCalledWith("p1");
  });

  it("carrito vacío muestra el conteo en 0 artículos", () => {
    mocks.items = [];
    render(<CartView />);
    expect(screen.getByText(/0 artículos/i)).toBeInTheDocument();
    expect(screen.queryByTestId("cart-item-p1")).not.toBeInTheDocument();
  });
});
