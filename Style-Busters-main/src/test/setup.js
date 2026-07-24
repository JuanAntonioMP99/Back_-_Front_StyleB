// Setup global de Vitest para la SPA.
// - Matchers de @testing-library/jest-dom
// - Limpieza del DOM tras cada test (aislamiento)
// - Polyfills mínimos de jsdom que algunos componentes esperan
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom no implementa matchMedia; algunos componentes/hooks lo consultan.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

// jsdom no implementa IntersectionObserver (usado por carruseles/imágenes lazy).
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}
