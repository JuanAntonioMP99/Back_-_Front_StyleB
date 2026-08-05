import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest para la SPA (CRA/react-scripts). Se usa @vitejs/plugin-react para el
// transform de JSX + runtime automático de React 19. Los tests corren en jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    // Vitest NO carga archivos .env (a diferencia del dev server de CRA): hay
    // que proveer aquí las variables REACT_APP_* que consume el código en
    // tiempo de import (p. ej. apiClient.js), con el valor de desarrollo.
    env: {
      REACT_APP_API_URL: "http://localhost:4000/api",
    },
    setupFiles: ["./src/test/setup.js"],
    css: false,
    include: ["src/**/*.{test,spec}.{js,jsx}"],
    exclude: ["node_modules", "cypress", "build", "dist"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "text-summary", "html", "lcov"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/**/*.{test,spec}.{js,jsx}",
        "src/test/**",
        "src/index.js",
        "src/App/index.js",
        "src/reportWebVitals.js",
        "src/setupTests.js",
        "src/**/*.css",
        "src/Data/**",
      ],
      // Trinquete (ratchet) conservador. Sube al cerrar cada bloque. Es un SUELO
      // anti-regresión, no el objetivo de calidad.
      // - 2026-07-30 bloque FE (ProtectedRoute/AuthContext + integración MSW): 38.35% líneas.
      // - 2026-07-30 ampliación (HomePage/SearchResults/CartPage + cart/order + contrato):
      //   cobertura medida 47.03% líneas / 39.65% branches / 34.69% funcs / 46.02% stmts.
      // Los suelos se ponen por debajo de lo medido para absorber varianza.
      thresholds: {
        lines: 44,
        functions: 32,
        branches: 36,
        statements: 43,
      },
    },
  },
});
