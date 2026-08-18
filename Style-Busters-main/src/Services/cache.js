/**
 * Caché en memoria para respuestas GET de la API.
 *
 * Por qué esto y no una librería de data-fetching: la SPA consume 4 endpoints
 * de lectura y ya tiene su propio contrato de errores (`classifyError` en
 * apiClient devuelve `{ kind, status }`). Un cliente completo añadiría una
 * dependencia mayor que el ahorro y obligaría a reescribir ese manejo de
 * errores en todas las páginas.
 *
 * Cubre los dos casos reales del proyecto:
 *  - Volver a una pantalla ya visitada (Home → detalle → Home) no vuelve a
 *    descargar el catálogo completo.
 *  - Dos componentes que piden el mismo recurso a la vez comparten una única
 *    petición en vuelo (deduplicación).
 *
 * Los errores NO se cachean: un fallo de red debe poder reintentarse.
 * La caché es de sesión (memoria): un recargar de página la vacía, así que no
 * puede servir datos obsoletos entre visitas.
 */

const DEFAULT_TTL_MS = 60_000;

const entries = new Map(); // key -> { value, expiresAt }
const inFlight = new Map(); // key -> Promise

/**
 * @param {string} key clave estable del recurso (p. ej. "products" o "product:abc")
 * @param {() => Promise<any>} loader función que hace la petición real
 * @param {number} [ttlMs] tiempo de validez; por defecto 60 s
 */
export function cachedRequest(key, loader, ttlMs = DEFAULT_TTL_MS) {
  const hit = entries.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return Promise.resolve(hit.value);
  }
  if (hit) entries.delete(key);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = loader()
    .then((value) => {
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Invalida por prefijo tras una escritura (crear/editar/borrar producto).
 * `invalidateCache("product")` tumba tanto "products" como "product:<id>".
 */
export function invalidateCache(prefix) {
  for (const key of entries.keys()) {
    if (key.startsWith(prefix)) entries.delete(key);
  }
}

/** Vacía la caché por completo. Se usa entre tests para aislarlos. */
export function clearCache() {
  entries.clear();
  inFlight.clear();
}
