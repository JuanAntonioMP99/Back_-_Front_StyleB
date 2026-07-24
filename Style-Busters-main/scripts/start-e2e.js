// Arranca el dev server de CRA para E2E sin abrir navegador.
// Se invoca con `node ./scripts/start-e2e.js` para evitar los shims .cmd de
// npm/npx, que se rompen por el carácter "&" en la ruta del repositorio
// (Back_&_Front_StyleB) en Windows.
process.env.BROWSER = "none";
process.env.PORT = process.env.PORT || "3000";
process.env.CI = process.env.CI || "false";
require("react-scripts/scripts/start");
