import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "./CheckoutPage";

const items = [{ product: { _id: "p1", name: "X", price: 100 }, quantity: 2 }];
const clearCart = vi.fn();

vi.mock("../Context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", name: "Ada" } }),
}));
vi.mock("../Context/CartContext", () => ({
  useCart: () => ({ items, total: 200, clearCart, removeItem: vi.fn(), updateQuantity: vi.fn() }),
}));

const defaultAddress = { _id: "addr1", name: "Home", address1: "Calle 1", city: "AGS", postalCode: "20000" };
const defaultPayment = { _id: "691262743278bbc102261a4a", alias: "Bancomer", cardNumber: "4444-4444-4444-5555" };

vi.mock("../Services/shippingService", () => ({
  getShippingAddresses: vi.fn(() => Promise.resolve([defaultAddress])),
  getDefaultShippingAddress: vi.fn(() => Promise.resolve(defaultAddress)),
}));
vi.mock("../Services/paymentService", () => ({
  getPaymentMethods: vi.fn(() => Promise.resolve([defaultPayment])),
  getDefaultPaymentMethod: vi.fn(() => Promise.resolve(defaultPayment)),
}));

// Mantener buildOrderPayload real, mockear sólo createOrder.
const createOrder = vi.fn();
vi.mock("../Services/orderService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createOrder: (...args) => createOrder(...args) };
});

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

function renderCheckout() {
  return render(
    <MemoryRouter>
      <CheckoutPage />
    </MemoryRouter>,
  );
}

describe("CheckoutPage (creación de orden real)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el resumen con el total del carrito", async () => {
    renderCheckout();
    expect(await screen.findByTestId("checkout-order-summary")).toBeInTheDocument();
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("$200.00");
  });

  it("crea una orden real con el payload correcto y redirige a confirmación", async () => {
    const user = userEvent.setup();
    createOrder.mockResolvedValue({ _id: "order-1", status: "pending" });

    renderCheckout();
    const confirmBtn = await screen.findByTestId("checkout-confirm-button");
    await waitFor(() => expect(confirmBtn).toBeEnabled());
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledTimes(1);
    });
    expect(createOrder).toHaveBeenCalledWith({
      user: "u1",
      products: [{ productId: "p1", quantity: 2, price: 100 }],
      paymentMethod: "691262743278bbc102261a4a",
      shippingCost: 0,
      totalPrice: 200,
    });
    expect(clearCart).toHaveBeenCalled();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        "/order-confirmation",
        expect.objectContaining({
          state: expect.objectContaining({ order: { _id: "order-1", status: "pending" } }),
        }),
      );
    });
  });

  it("previene doble envío mostrando estado de procesamiento", async () => {
    const user = userEvent.setup();
    let resolveOrder;
    createOrder.mockReturnValue(new Promise((r) => { resolveOrder = r; }));

    renderCheckout();
    const confirmBtn = await screen.findByTestId("checkout-confirm-button");
    await waitFor(() => expect(confirmBtn).toBeEnabled());

    await user.click(confirmBtn);
    // segundo click mientras está pendiente no debe disparar otra orden
    await user.click(confirmBtn).catch(() => {});

    expect(screen.getByTestId("checkout-confirm-button")).toBeDisabled();
    expect(createOrder).toHaveBeenCalledTimes(1);

    resolveOrder({ _id: "order-1" });
  });

  it("muestra error si la creación de la orden falla", async () => {
    const user = userEvent.setup();
    createOrder.mockRejectedValue({ kind: "SERVER_ERROR" });

    renderCheckout();
    const confirmBtn = await screen.findByTestId("checkout-confirm-button");
    await waitFor(() => expect(confirmBtn).toBeEnabled());
    await user.click(confirmBtn);

    expect(await screen.findByTestId("checkout-error")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("checkout-confirm-button")).toBeEnabled();
  });
});
