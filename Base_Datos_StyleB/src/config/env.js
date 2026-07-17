import dotenv from "dotenv";

dotenv.config();

// Lectura y validación centralizada de las variables de entorno dependientes
// del entorno de ejecución (dev/test/prod). No expone secretos: JWT_* y
// MONGODB_URI se leen donde se usan (authController, db.conf) vía process.env.

const nodeEnv = process.env.NODE_ENV || "development";

// CORS_ALLOWED_ORIGINS es una lista separada por comas. Se parsea a array
// (trim + filter para tolerar espacios y comas colgantes).
const parsedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// En producción no se permite arrancar con la allowlist vacía: un fallback a
// localhost dejaría el backend inaccesible desde el frontend desplegado.
if (nodeEnv === "production" && (!parsedOrigins || parsedOrigins.length === 0)) {
  throw new Error("Falta configurar CORS_ALLOWED_ORIGINS en producción");
}

const env = {
  nodeEnv,
  port: process.env.PORT || 3000,
  // Default de desarrollo: el frontend CRA corre en http://localhost:3000.
  corsAllowedOrigins: parsedOrigins ?? ["http://localhost:3000"],
};

export default env;