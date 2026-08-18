import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../Context/AuthContext";
import { CartProvider } from "../Context/CartContext";
import Cart from "./CartPage";

// Unit de página: usuario NO autenticado → el carrito opera en local (sin API).
// El estado inicial se siembra en localStorage (clave "cart"), que CartProvider lee.

function renderCart() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Cart />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("carrito vacío → estado vacío", () => {
    renderCart();

    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });

  it("carrito con productos → muestra total, conteo y botón de pago", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        { product: { _id: "p1", name: "Camisa", price: 100 }, quantity: 2 },
      ]),
    );

    renderCart();

    expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("$200.00");
    expect(screen.getByText(/2 artículos/i)).toBeInTheDocument();
    expect(screen.getByTestId("cart-checkout-button")).toBeEnabled();
  });
});
