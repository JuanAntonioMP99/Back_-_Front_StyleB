import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import env from "./src/config/env.js";
import connectDB from "./src/config/db.conf.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import logger from "./src/middlewares/logger.js";
import routes from "./src/routes/index.js";

const app = express();
const port = env.port;

const corsOptions = {
  origin(origin, callback) {
    // Sin header Origin (Postman, curl, tests, comunicación interna) → permitido.
    if (!origin || env.corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(logger);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API Ecommerce con MongoDB");
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});

export default app;

// Conecta DB y levanta servidor solo cuando se ejecuta directamente (no al importar en tests)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  connectDB();
  // Host 0.0.0.0 explícito: en Render el servicio debe aceptar conexiones
  // externas, no solo desde loopback.
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}