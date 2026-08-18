import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Servidor MSW para las pruebas de integración del frontend. Intercepta las
// peticiones XHR de axios (adaptador por defecto en jsdom) contra la API real.
// El ciclo de vida (listen/resetHandlers/close) lo gestiona cada archivo de
// integración, para no afectar a los tests unitarios que mockean apiClient.
export const server = setupServer(...handlers);
