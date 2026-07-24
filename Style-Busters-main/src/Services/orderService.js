import apiClient from "./apiClient";

/**
 * Crea una orden real en el backend.
 * Contrato de POST /api/orders (ver orderRoutes.js):
 *   { user, products: [{ productId, quantity, price }], paymentMethod, totalPrice, shippingCost? }
 * Requiere token Bearer (authMiddleware). Devuelve la orden creada (201).
 * @returns {Promise<Object>} orden creada con _id
 */
export async function createOrder(orderData) {
  const response = await apiClient.post("/orders", orderData);
  return response.data;
}

export async function getOrderById(id) {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data;
}

/**
 * Construye el payload de orden a partir del carrito y la selección de checkout.
 * @param {{ userId: string, items: Array, paymentMethodId: string, shippingCost?: number }} args
 */
export function buildOrderPayload({
  userId,
  items,
  paymentMethodId,
  shippingCost = 0,
}) {
  const products = items.map((item) => ({
    productId: item.product._id,
    quantity: item.quantity,
    price: item.product.price,
  }));

  const totalPrice =
    products.reduce((acc, p) => acc + p.price * p.quantity, 0) + shippingCost;

  return {
    user: userId,
    products,
    paymentMethod: paymentMethodId,
    shippingCost,
    totalPrice,
  };
}
