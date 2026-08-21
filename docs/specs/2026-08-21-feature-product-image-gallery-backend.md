# Spec: Galería de imágenes de producto — contrato de backend (`images`)

## Metadata
- **Tipo:** feature
- **Complejidad:** S
- **Fecha:** 2026-08-21
- **Estado:** DONE
- **ID de backlog:** BE-PRODUCT-IMAGE-GALLERY-2026-08-21
- **Ejecutor:** subagente backend-builder

## Historia

Como backend de `Base_Datos_StyleB`, quiero exponer un campo `images` (array de URLs) en el modelo y en el contrato de `Product`, adicional al `imageURL` existente, para que un pendiente de frontend posterior (`ImageCarousel.jsx`, hoy huérfano en `Style-Busters-main/src/Components/ImageCarousel/`) pueda construir una galería real de varias imágenes por producto, sin romper a ninguno de los tres consumidores actuales de `imageURL` (`ProductCard.jsx`, `ProductDetails.jsx`, `CartView.jsx`, todos vía `Style-Busters-main/src/utils/productImage.js`).

- **Específica:** agregar el campo `images: [String]` (default `[]`) al esquema `Product`, su validación en `express-validator` (`productRoutes.js`) y su lectura/escritura en `createProduct`/`updateProduct` (`productController.js`), sin tocar `imageURL`, rutas, middlewares de auth/permisos ni ningún otro modelo.
- **Medible:** criterios de aceptación CA-1 a CA-9, verificables por inspección de código y por `npm test` (`Base_Datos_StyleB`, en particular `tests/unit/models/Product.test.js` y `tests/integration/products.test.js`).
- **Alcanzable:** 4 archivos reales a tocar (`src/models/Product.js`, `src/routes/productRoutes.js`, `src/controllers/productController.js`, `tests/unit/models/Product.test.js`), todos ya existentes, reutilizando patrones de validación de array ya presentes en el propio repo (`cartRoutes.js`, `orderRoutes.js`). No requiere librerías nuevas ni cambios de infraestructura.
- **Relevante:** es el pendiente 1 de 2 (contrato de API primero, por regla del dispatch — ver `.agents/dispatch.md` §3) que habilita, en un pendiente frontend separado y posterior, conectar `<ImageCarousel>` a datos reales en vez de dejarlo sin consumidor.
- **Temporal:** complejidad S — 4 archivos, un solo modelo, patrón de validación ya existente en el repo, sin cambios de rutas/permisos.

## Contexto

El carrusel `Style-Busters-main/src/Components/ImageCarousel/ImageCarousel.jsx` existía en el commit inicial de este repo (`b57c1c3c`), se eliminó de sus consumidores en `b79f0357`, y hoy sigue en el árbol de archivos pero sin ningún componente que lo importe. Recibe `images` (array de strings) y `altText`, y renderiza `images[currentIndex]` directamente como `src` de un `<img>`.

El backend actual (`Base_Datos_StyleB/src/models/Product.js`) solo soporta una imagen por producto: `imageURL: { type: String, required: true, default: "https://placehold.co/600x400" }`. El usuario decidió explícitamente que quiere soporte real de múltiples imágenes, no un parche cosmético. El orchestrator dividió el trabajo en dos pendientes siguiendo la regla de `.agents/dispatch.md` §3 ("un pendiente que cruza front y back se divide en dos... contrato de API primero"): este spec cubre **solo** el contrato de backend; un segundo pendiente frontend (spec aparte, después de que este se mergee) conectará `<ImageCarousel>` en `ProductDetails.jsx`.

Verificación de código real hecha para este spec:
- `productController.js` (`createProduct`/`updateProduct`) desestructura explícitamente los campos que acepta de `req.body` (`name, description, price, stock, imageURL, category`) y los pasa tal cual a `Product.create()` / `findByIdAndUpdate()`. Un campo no desestructurado ahí, aunque llegue en el body, se ignora — así que `images` **debe** añadirse explícitamente en ambas funciones para persistir.
- `productRoutes.js` **no valida `imageURL` hoy**: ni `createProductValidation` ni `updateProductValidation` tienen ninguna regla `body("imageURL")`. Es un hallazgo real (no un patrón a "seguir"), documentado en "Decisiones de Diseño" — la validación de `images` que introduce este pendiente no tiene precedente exacto de "URL válida" en el propio código de `imageURL`; sí existe precedente de **estructura de array** (`body("products").isArray()` + `body("products.*.campo")` en `cartRoutes.js`/`orderRoutes.js`), que es el patrón que se reutiliza aquí.
- Las rutas `POST /api/products`, `PUT /api/products/:id` **no tienen `authMiddleware` ni `isAdminMiddleware`** hoy (confirmado en `productRoutes.js` y en la tabla de rutas de `CLAUDE.md` §2) — cualquiera puede crear/editar productos sin autenticación. Esto ya está registrado como deuda técnica en `docs/backlog.md` (`F3.5`, prioridad Alto) y **queda fuera de alcance de este pendiente** (CA-9), pero se trata en detalle en "Consideraciones de Seguridad" porque agrava directamente el impacto de este cambio.
- `Style-Busters-main/src/utils/productImage.js` (`getProductImage`) lee únicamente `product?.imageURL`; no lee `images`. Mientras el pendiente 2 (frontend) no se implemente, `images` es un campo que la API acepta y devuelve pero que ningún consumidor actual del frontend lee — es aditivo por diseño y no cambia el comportamiento observable de la SPA hoy.
- `tests/unit/models/Product.test.js` existe y hoy no menciona `images`; se amplía en este pendiente (CA-7).

## Criterios de Aceptación

- [x] **CA-1 — Campo `images` en el modelo `Product`.** `Base_Datos_StyleB/src/models/Product.js` agrega `images: { type: [String], default: [] }` (sin `required`, para no romper documentos existentes ni forzar el campo en creaciones que no lo envíen). El campo incluye un comentario inline (JSDoc o comentario de línea) que documenta el criterio de CA-2b: `images` son imágenes **adicionales** a `imageURL`, no lo incluyen. Verificable: `new Product({ name, description, price }).images` es `[]` por defecto; `Product.schema.path("images")` es de tipo array de `String`.

- [x] **CA-2 — `imageURL` sin cambios de comportamiento.** `imageURL` conserva exactamente su definición actual (`required: true`, `default: "https://placehold.co/600x400"`, `String`), sin agregarle validación de formato en el schema ni en `express-validator` como parte de este pendiente (ver "Decisiones de Diseño" sobre por qué se deja fuera, a propósito). Los tres consumidores del frontend (`ProductCard.jsx`, `ProductDetails.jsx`, `CartView.jsx`, vía `utils/productImage.js`) siguen recibiendo `imageURL` sin cambios en cada respuesta de la API.
  - **CA-2a:** ningún test existente de `tests/unit/models/Product.test.js` sobre `imageURL` (default, `required` con default aplicado) cambia su aserción.
  - **CA-2b (criterio de semántica, inequívoco para el pendiente 2 de frontend):** `images` representa **únicamente las imágenes adicionales de la galería**, sin incluir la URL ya presente en `imageURL`. La galería completa a mostrar en `<ImageCarousel>` se construye en el frontend (pendiente 2, fuera de alcance aquí) como `[imageURL, ...images]`. Este criterio queda documentado como comentario en el schema (CA-1) y no admite otra interpretación en la implementación de este pendiente.

- [x] **CA-3 — Validación de `images` en `express-validator`.** `Base_Datos_StyleB/src/routes/productRoutes.js` agrega, en `createProductValidation` y en `updateProductValidation` (ambas con `.optional()`, ya que `images` nunca es obligatorio):
  ```js
  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Images must be an array of at most 10 URLs"),
  body("images.*")
    .isURL()
    .withMessage("Each image must be a valid URL"),
  ```
  reutilizando el patrón ya existente de `body("array").isArray()` + `body("array.*")` de `cartRoutes.js`/`orderRoutes.js` (única diferencia: aquí los elementos son strings, no subobjetos, por lo que `body("images.*")` valida el elemento directamente, no un subcampo). El límite `max: 10` es un control de payload/DoS propuesto por este spec (no existe precedente en el repo de límite de tamaño de array); ver "Consideraciones de Seguridad". Verificable: una petición con `images` no-array, con más de 10 elementos, o con un elemento que no sea una URL válida (p. ej. `"no-es-url"` o `"javascript:alert(1)"`) responde `422` con `{ errors: [...] }` vía el middleware `validate` ya existente.

- [x] **CA-4 — `createProduct` acepta y persiste `images`.** `productController.js` → `createProduct` desestructura `images` de `req.body` junto a los campos actuales y lo pasa a `Product.create({ ..., images })`. Si `images` no viene en el body, el default de schema (`[]`) se aplica igual que hoy ocurre con `imageURL` cuando es `undefined` (test ya existente `"imageURL es required pero su default hace que nunca falte"`, mismo mecanismo de Mongoose). Verificable: `POST /api/products` con `images: ["https://a.test/1.jpg", "https://a.test/2.jpg"]` devuelve `201` con esos valores en `images`; sin `images` en el body, devuelve `201` con `images: []`.

- [x] **CA-5 — `updateProduct` acepta y persiste `images`.** `productController.js` → `updateProduct` desestructura `images` de `req.body` y lo incluye en el objeto pasado a `findByIdAndUpdate`, mismo patrón que el campo `category` (opcional) ya usa hoy: si `images` no viene en el body, la propiedad queda `undefined` en el objeto de actualización y el driver de MongoDB la omite al serializar — el `images` ya persistido en el documento **no se borra** por omitirlo en un `PUT` parcial. Verificable: `PUT /api/products/:id` con `images: [...]` actualiza el array; `PUT /api/products/:id` sin `images` en el body dado un producto que ya tenía `images` no vacío conserva ese valor sin cambios.

- [x] **CA-6 — Sin migración de datos existentes.** No se agrega ningún script de migración ni se toca `tests/globalSetup.js`/`tests/setup.js`. Los productos ya existentes en cualquier entorno, al leerse con el esquema actualizado, exponen `images: []` por el `default` de Mongoose (aplicado a nivel de lectura del documento tal como ocurre hoy con cualquier campo con `default` ausente en un documento antiguo), sin necesidad de reescribirlos. Verificable: un documento insertado directamente en Mongo sin el campo `images` (simulando un producto pre-existente) devuelve `images: []` al leerse vía `Product.findById(...)`.

- [x] **CA-7 — Tests unitarios del modelo ampliados.** `Base_Datos_StyleB/tests/unit/models/Product.test.js` agrega, como mínimo:
  - `images` es `[]` por defecto en un producto nuevo sin el campo.
  - `images` acepta y persiste (`validateSync()` sin error) un array de strings URL.
  - Ningún test existente sobre `imageURL`/`name`/`description`/`price`/`stock`/`category` cambia de comportamiento (CA-2a).
  Verificable: `npm run test:unit` (`Base_Datos_StyleB`) pasa, incluyendo los tests nuevos.

- [x] **CA-8 — Consistencia de respuesta en lecturas.** `getProducts`, `getProductById` y `searchProducts` (que no se modifican en su lógica) siguen devolviendo el documento completo vía `Product.find()`/`findById()` — como no proyectan campos explícitamente hoy, `images` aparece automáticamente en sus respuestas sin cambio de código en esos tres handlers. Verificable: `GET /api/products` y `GET /api/products/:id` incluyen `images` en cada producto sin haber tocado `searchProducts`/`getProducts`/`getProductById`.

- [x] **CA-9 — Sin cambios a rutas, permisos ni otros modelos.** `productRoutes.js` no agrega ni quita ninguna ruta, ni `authMiddleware`/`isAdminMiddleware` (la ausencia de auth en `POST`/`PUT`/`DELETE /products` es deuda técnica preexistente, trackeada en `docs/backlog.md` como `F3.5`, y **no se corrige en este pendiente** — ver "Consideraciones de Seguridad"). Ningún otro modelo (`Category`, `Cart`, `Order`, `User`, `Address`, `PaymentMethod`, `WishList`) se modifica. Verificable: `git diff` del pendiente toca únicamente `src/models/Product.js`, `src/routes/productRoutes.js`, `src/controllers/productController.js`, `tests/unit/models/Product.test.js` (y, si el ejecutor lo considera necesario para no romper `tests/integration/products.test.js`, ajustes estrictamente aditivos ahí — sin quitar aserciones existentes).

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:**
  - **Spoofing:** N/A directo — este pendiente no toca autenticación ni identidad. Nota relacionada (no de este CA): como `POST`/`PUT /products` no requieren `authMiddleware` (hallazgo preexistente, `F3.5`), no hay ninguna identidad que verificar en el flujo que este pendiente extiende; no se agrava ni se corrige aquí.
  - **Tampering — SÍ APLICA, es la amenaza principal de este pendiente.** `images` es un array de strings arbitrarios escribible vía `POST`/`PUT /products`, endpoints **sin autenticación** hoy (`F3.5`, preexistente y fuera de alcance). Antes de este pendiente, un actor no autenticado ya podía manipular `imageURL` (un string); después de este pendiente, puede manipular hasta 10 strings por producto en la misma petición, sin ningún control de origen. Es una ampliación cuantitativa del mismo vector ya existente, no una amenaza nueva en tipo — pero el spec la trata en serio porque el volumen de datos manipulables por petición crece.
    - **Control aplicado en este pendiente:** `body("images.*").isURL()` (CA-3) rechaza cualquier valor que no tenga forma de URL válida (usa `validator.js` vía `express-validator`, `protocols` por defecto `['http', 'https', 'ftp']` con `require_valid_protocol: true` — un string como `"javascript:alert(1)"` se parsea con protocolo `javascript`, no está en la lista permitida, y la validación falla con `422`). `body("images").isArray({ max: 10 })` (CA-3) acota el número de strings inyectables por petición.
    - **Control que NO se aplica aquí (out of scope, ver CA-9):** no se añade `authMiddleware`/`isAdminMiddleware` a las rutas de escritura de `/products`. Este pendiente **no resuelve** el vector de fondo (escritura sin autenticación); solo evita que el nuevo campo `images` sea, además, un vector de inyección de strings con forma no-URL. Se recomienda explícitamente al orchestrator evaluar priorizar `F3.5` en el mismo ciclo de trabajo o inmediatamente después, dado que este pendiente amplía la superficie del mismo problema ya trackeado.
  - **Repudiation:** N/A — sin identidad autenticada en estas rutas (ver Spoofing/Tampering), no hay ninguna atribución de acción que este pendiente pueda afectar en ningún sentido; `logger` (método/url) sigue registrando igual que hoy, sin cambios.
  - **Information Disclosure:** Bajo — `images` se devuelve en las mismas respuestas donde ya se devuelve `imageURL` (catálogo público, `GET /products` y `GET /products/:id`, sin auth ninguno de los dos). No se expone ningún dato nuevo de carácter sensible (no son URLs de usuario, no son PII); el nivel de exposición es idéntico al que ya tiene `imageURL` hoy.
  - **Denial of Service:** Aplica de forma acotada.
    - Payload por petición: `express.json()` en `server.js` usa el límite por defecto (100 KB), lo que ya acota el tamaño total del body incluyendo `images` — control existente, no de este pendiente, pero relevante como capa adicional.
    - Tamaño de documento/colección: sin límite de longitud de array, una petición podría intentar decenas de URLs por producto; `isArray({ max: 10 })` (CA-3) lo acota explícitamente a nivel de request. No se agrega ningún límite adicional a nivel de schema de Mongoose (`images` es `[String]` sin `maxlength` de array) porque el repo no tiene precedente de ese patrón (`Cart.products`/`Order.products` tampoco lo tienen a nivel de schema); el control queda en la capa de validación de ruta, igual que el resto del repo.
    - Sin autenticación en las rutas de escritura (`F3.5`, preexistente), no hay throttling por usuario/IP en el repo hoy; un abuso sostenido de `POST /products` con arrays de 10 URLs cada vez sigue siendo posible igual que ya lo era con `imageURL` antes de este cambio, en una magnitud mayor pero acotada por el límite de 10. No se implementa rate limiting en este pendiente (no existe en el repo, sería expansión de alcance no solicitada).
  - **Elevation of Privilege:** N/A — este pendiente no toca `isAdminMiddleware`, roles, ni ningún flujo de permisos.
- **Controles de mitigación:** `body("images").isArray({ max: 10 })`, `body("images.*").isURL()` (ambos en `createProductValidation`/`updateProductValidation`), límite global de `express.json()` (100 KB, ya existente).
- **Inputs que requieren validación:** `req.body.images` (array de hasta 10 strings, cada uno debe pasar `isURL()`).
- **Secrets involucrados:** ninguno.
- **Superficie de ataque afectada:** las rutas ya existentes `POST /api/products` y `PUT /api/products/:id`, ampliando el conjunto de campos manipulables de 1 string (`imageURL`, ya expuesto) a hasta 10 strings adicionales (`images`), sobre una superficie que ya carecía de autenticación antes de este pendiente (`F3.5`).

## Dependencias

- **Internas** (todas en `Base_Datos_StyleB/src/` o `Base_Datos_StyleB/tests/` salvo que se indique):
  - `src/models/Product.js` — CA-1, CA-2, CA-6
  - `src/routes/productRoutes.js` — CA-3, CA-9
  - `src/controllers/productController.js` — CA-4, CA-5, CA-8
  - `tests/unit/models/Product.test.js` — CA-7
  - `tests/integration/products.test.js` (solo lectura/ajuste estrictamente aditivo si algo se rompe — no se espera, ver CA-9) — verificación de no-regresión
  - `Base_Datos_StyleB/tests/helpers/factories.js` (`createProduct`, solo lectura de referencia — confirma que no fuerza `imageURL`/`images` en sus defaults, por lo que no requiere cambios) — verificación de no-regresión
  - `docs/backlog.md` (`F3.5`, solo lectura de referencia — confirma que la falta de auth en `/products` ya está trackeada y por qué queda fuera de alcance en CA-9) — contexto de "Consideraciones de Seguridad"
- **Externas:** ninguna librería nueva. `express-validator` (`isArray`, `isURL`) ya es dependencia directa del backend (usada en `cartRoutes.js`, `orderRoutes.js`, etc.).
- **Cruzadas (fuera de este pendiente, informativas):** el pendiente 2 (frontend, spec aparte, aún no escrito) depende del contrato exacto definido aquí, en particular de CA-2b (`images` excluye `imageURL`) y de la forma del array (`string[]` de URLs planas, sin objetos `{url, alt}` ni metadata adicional).

## Decisiones de Diseño

- **Cambio aditivo, no reemplazo de `imageURL`.** Alternativas consideradas:
  | Alternativa | Pros | Contras | Descartada porque |
  |---|---|---|---|
  | A. Agregar `images: [String]` (default `[]`) manteniendo `imageURL` intacto (elegida) | Cero riesgo de romper los 3 consumidores actuales del frontend; sin migración; reutiliza el patrón `[String]` ya usado en el repo (`WishList.products`) y el patrón de validación de array (`cartRoutes.js`) | Dos campos de imagen coexistiendo (deuda semántica leve, documentada en CA-2b) | — (elegida) |
  | B. Reemplazar `imageURL` por `images: [String]` (imagen principal = `images[0]`) | Un solo campo, más "limpio" a futuro | Rompe el contrato leído por `utils/productImage.js` (`product?.imageURL`) en los 3 consumidores del frontend antes de que el pendiente 2 los migre; requiere migración de datos existentes; excede el alcance explícito de este pendiente (solo backend, sin tocar frontend) | Rompe consumidores existentes — inaceptable dado que el pendiente 2 (frontend) aún no se ha ejecutado |
  | C. `images` como array de objetos `{ url, alt, order }` en vez de `string[]` | Permite metadata futura (alt text por imagen, orden explícito) | No hay ningún precedente de esa forma en el repo; `ImageCarousel.jsx` ya consume `string[]` directamente (`images[currentIndex]` como `src`); sobre-ingeniería para el alcance pedido | Excede lo pedido; `CLAUDE.md` §8 prohíbe inventar estructura no solicitada |
- **`images` excluye `imageURL` (CA-2b), no lo incluye.** Se eligió este criterio (en vez de que `images` sea "la galería completa incluyendo la principal") porque: (a) evita duplicar la misma URL en dos campos cuando el frontend construya `[imageURL, ...images]`; (b) mantiene `imageURL` como el único campo que los 3 consumidores actuales ya usan, sin ambigüedad sobre si deben seguir leyendo `imageURL` o cambiar a `images[0]`; (c) es el criterio literal que usó el orchestrator al describir el campo como imágenes "ADICIONALES". El pendiente 2 de frontend debe componer la galería completa en el cliente; este spec no lo hace por él (fuera de alcance).
- **Límite `max: 10` en la validación de `images` (CA-3):** no hay precedente de límite de tamaño de array en el repo (`Cart.products`/`Order.products` no lo tienen). Se introduce aquí porque el análisis STRIDE (Tampering/DoS) de este spec lo identificó como necesario dado que las rutas de escritura de `/products` no tienen autenticación (`F3.5`). El valor `10` es una propuesta razonable de este spec (galería de producto típica: principal + variantes/ángulos), no un valor ya usado en otro lugar del código; el ejecutor puede ajustarlo si el orchestrator o el security-reviewer lo consideran insuficiente/excesivo, siempre que quede documentado el cambio.
- **No se valida `imageURL` con `isURL()` en este pendiente (CA-2).** Aunque sería consistente aplicar la misma regla a `imageURL`, hacerlo ahora cambiaría el comportamiento actual de la API (podría rechazar con `422` peticiones que hoy son aceptadas, p. ej. si algún test o dato real usa un valor que no pasa `isURL()`), lo cual violaría CA-2 ("`imageURL` sin cambios de comportamiento") y excede el alcance pedido por el orchestrator para este pendiente. Se documenta como asimetría consciente, no como omisión accidental, y se dejan registrada como candidata a backlog en "Pendientes Abiertos".

### Nota sobre necesidad de ADR (para el orchestrator, antes de G1)

Evaluación explícita pedida por el orchestrator: este pendiente modifica un **esquema de modelo** (`Product.images`) y el **contrato de API** de `/products` (nuevo campo aceptado en `POST`/`PUT` y devuelto en `GET`), que son, literalmente, dos de los disparadores listados en `.agents/roles/architecture-reviewer.md` ("Cuando un pendiente introduce/modifica: contratos de API, esquemas de modelo...") y en `.agents/dispatch.md` §1 ("Cambio de arquitectura ⇒ ADR obligatorio (G1 no pasa sin él)").

**Recomendación de este spec: no amerita un ADR formal separado**, por las siguientes razones:
1. Es puramente aditivo y retrocompatible (CA-2, CA-6) — no reemplaza, no rompe, no requiere migración.
2. Reutiliza patrones ya existentes en el propio repo sin introducir ninguno nuevo: `[String]` como tipo de campo (ya usado en `WishList.products`, aunque ahí con `ref`), y `body("array").isArray()` + `body("array.*")` (ya usado en `cartRoutes.js`/`orderRoutes.js`). No se agrega ninguna capa, dependencia, servicio ni patrón arquitectónico nuevo.
3. La sección "Decisiones de Diseño" de este spec ya documenta alternativas con pros/contras/motivo de descarte — el mismo contenido que llevaría un ADR — por lo que un ADR separado sería, en este caso, redundante con el propio spec.
4. En `.agents/dispatch.md` §2, `architecture-reviewer` aparece entre corchetes (`[architecture-reviewer]`) en el pipeline de `feature`, es decir, condicional, no obligatorio para todo feature.

**Ambigüedad que se escala explícitamente (formato SSDLC 11.7), por si el orchestrator no comparte esta lectura:**
- **Duda:** ¿el disparador literal "modifica esquema de modelo / contrato de API" de `architecture-reviewer.md` debe leerse de forma literal (cualquier campo nuevo dispara ADR) o de forma sustantiva (solo cambios estructurales/no aditivos)?
- **Opciones:** (A) aceptar la recomendación de este spec y pasar a G1 sin ADR; (B) despachar `architecture-reviewer` para que emita un ADR breve antes de aprobar G1, dado que el pendiente 2 (frontend) dependerá de la decisión de CA-2b y un ADR le da una referencia más estable/descubrible que este spec.
- **Impacto:** (A) es más rápido y proporcional al riesgo real (bajo); (B) añade trazabilidad formal para una decisión de contrato que otro pendiente futuro consumirá, a costo de un paso adicional.
- **Recomendación de este spec:** (A), con la salvedad de que si el orchestrator prefiere (B) por el valor de referencia para el pendiente 2, este spec ya contiene todo el contenido necesario (contexto, decisión, alternativas, consecuencias) para que `architecture-reviewer` lo traslade a `docs/adrs/ADR-000X-product-image-gallery.md` sin investigación adicional.

## Riesgos y Deuda Técnica

- La falta de autenticación en `POST`/`PUT /products` (`F3.5`) no se corrige aquí y amplía el impacto de este cambio (ver "Consideraciones de Seguridad" — Tampering/DoS). Riesgo heredado, no nuevo, pero agravado en magnitud (1 string manipulable → hasta 10).
- Asimetría de validación entre `imageURL` (sin `isURL()`, a propósito, CA-2) e `images` (con `isURL()`) — documentada, no accidental, pero es deuda técnica de coherencia que un pendiente futuro de "armonizar validación de imágenes" podría resolver (candidato a backlog).
- El límite `max: 10` es una propuesta de este spec sin precedente en el repo; si el pendiente 2 de frontend (o el propio usuario) necesita más de 10 imágenes por producto, requerirá reabrir este contrato.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna dentro del alcance de este pendiente (backend únicamente); el consumo real de `images` en `<ImageCarousel>` es explícitamente el pendiente 2 (frontend), fuera de este spec.
- **Comportamientos inconsistentes detectados:**
  - `imageURL` no tiene validación de formato (`isURL()` ni ninguna otra) en `createProductValidation`/`updateProductValidation`, mientras que `images` sí la tendrá tras este pendiente — asimetría documentada a propósito en "Decisiones de Diseño", no corregida aquí.
  - `POST`/`PUT`/`DELETE /products` no requieren `authMiddleware`/`isAdminMiddleware` — hallazgo preexistente, ya trackeado como `F3.5` en `docs/backlog.md`, no corregido en este pendiente.
- **Gaps entre frontend y backend:** el campo `images` que este pendiente crea no tiene aún ningún consumidor en el frontend (`ImageCarousel.jsx` sigue huérfano hasta el pendiente 2). Es un gap esperado e intencional dado el orden "contrato de API primero" del dispatch.
- **Persistencia pendiente de migrar:** ninguna (CA-6 — el default de Mongoose cubre los documentos existentes sin script de migración).
- **Decisiones aplazadas:** el valor exacto del límite `max: 10` (ver "Decisiones de Diseño") queda abierto a ajuste por el orchestrator/security-reviewer sin invalidar el resto del spec.
- **Trabajo fuera de alcance en esta iteración:** conectar `<ImageCarousel>` en `ProductDetails.jsx` (pendiente 2, frontend); agregar auth a las rutas de escritura de `/products` (`F3.5`); validar `imageURL` con `isURL()`; cualquier UI de administración para subir/gestionar imágenes (no existe hoy en el repo, no se ha pedido).
- **Riesgos que requieren seguimiento:** los tres listados en "Riesgos y Deuda Técnica".
- **Items que deben convertirse en backlog:** la armonización de validación `imageURL`/`images` (nuevo hallazgo de este spec, aún sin ID de backlog — a crear por el orchestrator/docs-keeper al cierre); `F3.5` ya existe y no requiere una nueva entrada, solo se reafirma su relevancia.

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-08-21.
- **CAs cumplidos:** los 9 (CA-1 a CA-9, incluyendo los subcriterios CA-2a y CA-2b) — verificados por inspección de código (`src/models/Product.js`, `src/routes/productRoutes.js`, `src/controllers/productController.js`) y por `npm test` en `Base_Datos_StyleB`. Hubo una vuelta de corrección durante el ciclo: `qa-test-designer` detectó que no existían tests de integración versionados para `images` (solo verificación manual con `curl`); se corrigió antes de pasar a code-review agregando 7 tests nuevos (`IT-PROD-10` a `IT-PROD-16`) en `tests/integration/products.test.js` (commit `e2440203`, "test(products): cubrir images en tests de integración").
- **CAs no cumplidos:** ninguno.
- **Deuda técnica generada:** ninguna nueva directamente. Se reafirmó/agravó la deuda preexistente `F3.5` (falta de auth en `POST`/`PUT`/`DELETE /products`, `docs/backlog.md`): el security-reviewer registró que este cambio amplía su superficie de impacto, de 1 string manipulable sin autenticación (`imageURL`) a hasta 10 (`images`). No se corrigió aquí (fuera de alcance explícito, CA-9), solo se documentó.
- **Lecciones aprendidas:** (a) dividir un pendiente full-stack en backend-primero permitió cerrar el contrato de API de forma aislada y verificable antes de tocar el frontend; (b) `qa-test-designer` detectó que "verificado manualmente con curl" no es lo mismo que "cubierto por test de regresión versionado" — vale la pena que futuros pendientes prioricen tests de integración reproducibles sobre verificación ad hoc, aunque en este caso se terminaron haciendo ambas cosas.
- **Pendientes abiertos confirmados:**
  1. Conectar `<ImageCarousel>` en el frontend (`Style-Busters-main/src/Components/ImageCarousel/ImageCarousel.jsx`) — es el pendiente 2, ya planeado desde el propio spec (§"Contexto"), no es un backlog suelto: es el siguiente spec a redactar por el orchestrator.
  2. `F3.5` (`docs/backlog.md`, auth ausente en `/products`) — ya trackeado; se reafirma su prioridad dado el hallazgo del security-reviewer en este pendiente.
  3. Armonización de validación `imageURL` (sin `isURL()`) vs `images` (con `isURL()`) — hallazgo nuevo de este spec; convertido en backlog en este cierre como `BE-VALIDATE-IMAGEURL-2026-08-21` (ver "Backlog derivado creado").
- **Gaps no resueltos:** ninguno dentro del alcance de este spec.
- **Trabajo fuera de alcance confirmado:** auth en `/products` (`F3.5`); validación de formato de `imageURL`; UI de administración de imágenes (no existe hoy en el repo, no se ha pedido).
- **Backlog derivado creado:** sí — `BE-VALIDATE-IMAGEURL-2026-08-21` en `docs/backlog.md` (E3 — Estabilización backend). El pendiente 2 de frontend (conectar `<ImageCarousel>`) NO se agrega como backlog: es el siguiente spec directo del orchestrator, ya identificado desde el inicio de este spec.
- **Referencias a historias/tareas creadas:** PR #16 (https://github.com/JuanAntonioMP99/Back_-_Front_StyleB/pull/16, merge commit `ba375300`); este spec (`docs/specs/2026-08-21-feature-product-image-gallery-backend.md`); plan de prueba (`docs/test-plans/2026-08-21-feature-product-image-gallery-backend.md`); backlog derivado `BE-VALIDATE-IMAGEURL-2026-08-21` (`docs/backlog.md`).

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| Gap de cobertura: sin tests de integración versionados para `images` (solo verificación manual con `curl`), detectado por `qa-test-designer` | Corregido antes de code-review | Cerrado — 7 tests nuevos (`IT-PROD-10` a `IT-PROD-16`) añadidos en `tests/integration/products.test.js`, commit `e2440203` ("test(products): cubrir images en tests de integración") |
| Deuda técnica preexistente `F3.5` (auth ausente en `/products`), agravada en superficie por este cambio (1 → 10 strings manipulables) | Reafirmada, no corregida (fuera de alcance, CA-9) | Ya trackeada en `docs/backlog.md`; se mantiene su prioridad Alto, sin nueva entrada |
| Asimetría de validación `imageURL` (sin `isURL()`) vs `images` (con `isURL()`) | Documentada a propósito en el spec, sin corregir | Backlog creado: `BE-VALIDATE-IMAGEURL-2026-08-21` en `docs/backlog.md` |
| Pendiente 2 (frontend): conectar `<ImageCarousel>` a `images` | Fuera de alcance de este spec, planeado | No es backlog — siguiente spec directo del orchestrator |
