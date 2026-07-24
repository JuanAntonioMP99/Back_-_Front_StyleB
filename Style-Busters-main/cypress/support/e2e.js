// Cargado automáticamente antes de cada archivo de spec E2E.
import "./commands";

// Evita que errores no controlados de la app (p. ej. imágenes que fallan al
// cargar en jsdom-less headless) tumben un test que no está evaluando eso.
// Se mantiene estricto: sólo se ignoran errores de recursos, no de lógica.
Cypress.on("uncaught:exception", (err) => {
  if (/ResizeObserver loop|Loading chunk|Failed to fetch dynamically/.test(err.message)) {
    return false;
  }
  return true;
});
