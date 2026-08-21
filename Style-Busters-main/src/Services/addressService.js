import apiClient from "./apiClient";

// Servicio conectado a la API real (/api/addresses, K04). A diferencia de
// shippingService.js (mock sobre Data/shipping-address.json, usado hoy por
// CheckoutPage), este es el que persiste contra el backend.

export async function getMyAddresses() {
  const response = await apiClient.get("/addresses");
  return response.data.addresses;
}

export async function getDefaultAddress() {
  const addresses = await getMyAddresses();
  return addresses.find((address) => address.isDefault) || addresses[0] || null;
}

export async function createAddress(address) {
  const response = await apiClient.post("/addresses", address);
  return response.data;
}

export async function updateAddress(addressId, address) {
  const response = await apiClient.put(`/addresses/${addressId}`, address);
  return response.data;
}

export async function deleteAddress(addressId) {
  const response = await apiClient.delete(`/addresses/${addressId}`);
  return response.data;
}
