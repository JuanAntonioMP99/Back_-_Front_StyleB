import ErrorMessage from "../Common/ErrorMessage/ErrorMessage";

/**
 * Traduce un "kind" de error del apiClient a un mensaje legible.
 * Los kinds provienen de Services/apiClient.js -> classifyError().
 */
const MESSAGES = {
  UNAUTHORIZED: "No autorizado. Revisa tus credenciales.",
  FORBIDDEN: "No tienes permisos para realizar esta acción.",
  NOT_FOUND: "Recurso no encontrado.",
  VALIDATION: "Revisa los datos ingresados.",
  BAD_REQUEST: "Solicitud inválida. Revisa los datos ingresados.",
  SERVER_ERROR: "Error del servidor. Inténtalo más tarde.",
  CLIENT_ERROR: "No se pudo procesar la solicitud.",
  TIMEOUT: "La solicitud tardó demasiado. Inténtalo de nuevo.",
  NETWORK: "No pudimos conectar con el servidor. Revisa tu conexión.",
  UNKNOWN: "Ocurrió un error inesperado.",
};

export default function RegisterErrorMessage({ kind }) {
  if (!kind) return null;
  const message = MESSAGES[kind] || MESSAGES.UNKNOWN;
  return (
    <span data-testid="form-error-message">
      <ErrorMessage>{message}</ErrorMessage>
    </span>
  );
}
