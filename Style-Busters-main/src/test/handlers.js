import { http, HttpResponse } from "msw";
import { makeToken } from "./token";

// Handlers MSW por defecto: modelan la forma REAL de las respuestas de la API.
// API se deriva de la misma variable de entorno que lee apiClient.js
// (REACT_APP_API_URL, fijada en vitest.config.js vía test.env) para que MSW y
// apiClient no puedan desincronizarse con dos literales independientes.
// Cada test puede sobreescribir un handler con server.use(...) para casos
// concretos (errores, captura de headers).
export const API = process.env.REACT_APP_API_URL;

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const { password } = await request.json();
    if (password === "wrongpass") {
      return HttpResponse.json({ message: "Invalid Credentials" }, { status: 400 });
    }
    return HttpResponse.json({ token: makeToken(), refreshToken: "refresh-1" });
  }),

  http.post(`${API}/auth/register`, async () =>
    HttpResponse.json(
      { _id: "u1", name: "Ada", email: "ada@mail.com", role: "customer" },
      { status: 201 },
    ),
  ),

  http.get(`${API}/products`, () =>
    HttpResponse.json([
      { _id: "p1", name: "Camisa", price: 100 },
      { _id: "p2", name: "Pantalón", price: 200 },
    ]),
  ),

  // /search debe ir antes que /:id: si no, :id capturaría "search".
  http.get(`${API}/products/search`, () =>
    HttpResponse.json({
      products: [{ _id: "p1", name: "Camisa", price: 100 }],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
        hasNext: false,
        hasPrev: false,
      },
    }),
  ),

  http.get(`${API}/products/:id`, ({ params }) => {
    if (params.id === "missing") {
      return HttpResponse.json({ message: "Product not found" }, { status: 404 });
    }
    if (params.id === "boom") {
      return HttpResponse.json({ status: "error" }, { status: 500 });
    }
    return HttpResponse.json({ _id: params.id, name: "Camisa", price: 100 });
  }),

  // --- Cart (forma real de cartController: user y products.product poblados) ---
  http.get(`${API}/cart/user/:id`, ({ params }) => {
    if (params.id === "nocart") {
      return HttpResponse.json(
        { message: "No cart found for this user" },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      _id: "cart1",
      user: { _id: params.id },
      products: [
        { product: { _id: "p1", name: "Camisa", price: 100 }, quantity: 1 },
      ],
    });
  }),

  http.post(`${API}/cart`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        _id: "cart1",
        user: { _id: body.user },
        products: (body.products || []).map((p) => ({
          product: { _id: p.product },
          quantity: p.quantity,
        })),
      },
      { status: 201 },
    );
  }),

  http.put(`${API}/cart/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      _id: params.id,
      user: { _id: body.user },
      products: (body.products || []).map((p) => ({
        product: { _id: p.product },
        quantity: p.quantity,
      })),
    });
  }),

  http.delete(`${API}/cart/:id`, () => new HttpResponse(null, { status: 204 })),

  // --- Orders (forma real de orderController: defaults status/paymentStatus) ---
  http.post(`${API}/orders`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        _id: "order1",
        user: body.user,
        products: body.products,
        paymentMethod: body.paymentMethod,
        totalPrice: body.totalPrice,
        shippingCost: body.shippingCost ?? 0,
        status: "pending",
        paymentStatus: "pending",
      },
      { status: 201 },
    );
  }),

  http.get(`${API}/orders/:id`, ({ params }) => {
    if (params.id === "missing") {
      return HttpResponse.json({ message: "Order not found" }, { status: 404 });
    }
    return HttpResponse.json({
      _id: params.id,
      status: "pending",
      paymentStatus: "pending",
      totalPrice: 100,
    });
  }),
];
