import axios from "axios";

// La URL base viene EXCLUSIVAMENTE de REACT_APP_API_URL (convención de Create
// React App: solo las variables con ese prefijo se incrustan en el bundle de
// producción). Sin fallback: un valor ausente falla rápido y de forma
// explícita al cargar el módulo, en vez de apuntar en silencio a localhost o
// a una URL de producción hardcodeada. Incluye el sufijo /api (los servicios
// llaman paths relativos como /auth/login, /products, ...).
const apiBaseUrl = process.env.REACT_APP_API_URL;
if (!apiBaseUrl) {
  throw new Error(
    "REACT_APP_API_URL no está definida. Copia .env.example a .env y fija la URL de la API antes de iniciar la app.",
  );
}

// El backend está en el plan gratuito de Render: tras ~15 min sin tráfico el
// servicio se duerme y la primera petición paga el arranque en frío. Medido
// contra el despliegue real: 22.5 s en frío frente a 0.44 s en caliente, así
// que un timeout de 10 s abortaba SIEMPRE la primera carga de la portada.
// 45 s deja margen sobre lo medido sin dejar la UI colgada indefinidamente.
const API_TIMEOUT_MS = 45000;

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

function classifyError(error) {
  if (error.response) {
    const status = error.response.status;
    if (status === 404) return { kind: "NOT_FOUND", status, original: error };
    if (status === 401)
      return { kind: "UNAUTHORIZED", status, original: error };
    if (status === 403) return { kind: "FORBIDDEN", status, original: error };
    if (status === 422)
      return {
        kind: "VALIDATION",
        status,
        fields: error.response.data?.errors,
        original: error,
      };
    if (status === 500)
      return { kind: "SERVER_ERROR", status, original: error };

    return { kind: "CLIENT_ERROR", status, original: error };
  }

  if (error.code === "ECONNABORTED") {
    return { kind: "TIMEOUT", original: error };
  }

  if (error.request) {
    return { kind: "NETWORK", original: error };
  }

  return { kind: "UNKNOWN", original: error };
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); 
  if (token) config.headers.Authorization = `Bearer ${token}`; 

  return config; 
}); 

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const classified = classifyError(error);
    console.error(`[API ${classified.kind}]`, classified);
    return Promise.reject(classified);
  },
);



export default apiClient;