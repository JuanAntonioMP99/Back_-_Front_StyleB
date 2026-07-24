import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import { CartProvider, useCart } from "./CartContext";

// Sin token => usuario no autenticado => el carrito opera en local (sin API).
const wrapper = ({ children }) => (
  <AuthProvider>
    <CartProvider>{children}</CartProvider>
  </AuthProvider>
);

const productA = { _id: "a", name: "A", price: 100 };
const productB = { _id: "b", name: "B", price: 50 };

function setup() {
  return renderHook(() => useCart(), { wrapper });
}

describe("CartContext (carrito local)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("agrega un producto y calcula count y total", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addItem(productA, 2);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(2);
    expect(result.current.total).toBe(200);
  });

  it("incrementa la cantidad si el producto ya existe", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addItem(productA, 1);
    });
    await act(async () => {
      await result.current.addItem(productA, 3);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(4);
  });

  it("actualiza la cantidad de un producto", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addItem(productA, 1);
    });
    await act(async () => {
      await result.current.updateQuantity("a", 5);
    });
    expect(result.current.count).toBe(5);
  });

  it("cantidad < 1 elimina el producto del carrito", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addItem(productA, 1);
    });
    await act(async () => {
      await result.current.updateQuantity("a", 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("elimina un producto y limpia el carrito", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addItem(productA, 1);
    });
    await act(async () => {
      await result.current.addItem(productB, 2);
    });
    await act(async () => {
      await result.current.removeItem("a");
    });
    expect(result.current.items.map((i) => i.product._id)).toEqual(["b"]);

    await act(async () => {
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("persiste el carrito en localStorage", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addItem(productA, 2);
    });
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("cart"));
      expect(stored).toHaveLength(1);
      expect(stored[0].quantity).toBe(2);
    });
  });
});
