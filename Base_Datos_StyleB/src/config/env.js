import dotenv from "dotenv";

dotenv.config();

// Lectura y validación centralizada de las variables de entorno dependientes
// del entorno de ejecución (dev/test/prod). No expone secretos: JWT_* y
// ADMIN_SECRET se leen donde se usan (authController) vía process.env.

const ALLOWED_NODE_ENVS = ["development", "test", "production"];

const nodeEnv = process.env.NODE_ENV || "development";

// Si NODE_ENV llega mal escrita (p.ej. "Production", "prod" o un despliegue
// que la deja vacía), las guardas de producción de abajo comparan con "==="
// y se saltarían en silencio: el backend arrancaría con los defaults de
// desarrollo (Mongo local, CORS con localhost) sin avisar de nada. Se valida
// contra una lista cerrada para que un typo falle ruidosamente en el arranque
// en vez de degradar el entorno a desarrollo sin diagnóstico.
if (!ALLOWED_NODE_ENVS.includes(nodeEnv)) {
  throw new Error(
    `NODE_ENV tiene un valor no permitido: "${nodeEnv}". Valores permitidos: ${ALLOWED_NODE_ENVS.join(", ")}.`,
  );
}

// URL del frontend: único punto de verdad para el default local (CRA corre en
// http://localhost:3000). No es obligatoria en producción porque hoy no tiene
// ningún consumidor crítico en runtime (sin emails, redirecciones ni callbacks
// OAuth en el código real); solo aporta el default de corsAllowedOrigins.
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

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

// En producción no se permite arrancar sin una URI de Mongo explícita: el
// fallback a localhost dejaría el backend sin base de datos real (K02).
if (nodeEnv === "production" && !process.env.MONGODB_URI) {
  throw new Error("Falta configurar MONGODB_URI en producción");
}

const env = {
  nodeEnv,
  port: process.env.PORT || 3000,
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/StyleBusters",
  frontendUrl,
  // Default de desarrollo derivado de frontendUrl: un único punto de verdad
  // para la URL local del frontend.
  corsAllowedOrigins: parsedOrigins ?? [frontendUrl],
};

export default env;