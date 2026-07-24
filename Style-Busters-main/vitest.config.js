import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest para la SPA (CRA/react-scripts). Se usa @vitejs/plugin-react para el
// transform de JSX + runtime automático de React 19. Los tests corren en jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
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
    },
  },
});
