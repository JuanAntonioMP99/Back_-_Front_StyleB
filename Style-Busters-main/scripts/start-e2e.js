// Arranca el dev server de CRA para E2E sin abrir navegador.
// Se invoca con `node ./scripts/start-e2e.js` para evitar los shims .cmd de
// npm/npx (que históricamente se rompían por el carácter "&" en la ruta del
// repositorio, hoy renombrado a Back_Y_Front_StyleB). Esta forma funciona en
// cualquier ruta.
process.env.BROWSER = "none";
process.env.PORT = process.env.PORT || "3000";
process.env.CI = process.env.CI || "false";
// REACT_APP_API_URL: apiClient.js lanza si no está definida (sin fallback).
// Se fija aquí el default local ANTES de arrancar el dev server de CRA, igual
// que Base_Datos_StyleB/scripts/e2e-server.js hace con sus propias variables.
process.env.REACT_APP_API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";
require("react-scripts/scripts/start");
