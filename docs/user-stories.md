# Historias de usuario — StyleBusters

> Derivadas de [backlog.md](backlog.md). Estado relacionado: Implementado / Parcial / No implementado / Inconsistente.

---

**ID:** US-001 · **Prioridad:** Crítico · **Estado actual:** Inconsistente
**Título:** Retirar secretos del control de versiones
**Como** responsable técnico **quiero** que `.env`, `node_modules` y `build` no estén en git y que los secretos se roten **para** eliminar la exposición de credenciales.
**Criterios de aceptación:**
- Existe `.gitignore` que excluye `node_modules/`, `build/`, `.env*`, `logs/`.
- `.env` deja de estar rastreado; existe `.env.example` sin valores reales.
- `JWT_SECRET`, `JWT_REFRESH_TOKEN` rotados y `ADMIN_SECRET` definido.
**Definición de terminado:** `git ls-files` no lista `.env` ni `node_modules`; backend arranca desde `.env` local.
**Dependencias:** acceso al entorno; rotación invalida tokens vigentes.

---

**ID:** US-002 · **Prioridad:** Crítico · **Estado actual:** No implementado
**Título:** Login real contra la API
**Como** cliente **quiero** iniciar sesión con credenciales reales **para** acceder a mis datos persistidos.
**Criterios de aceptación:**
- `AuthContext.login` usa `authService.login` y guarda el token con `saveToken`.
- `apiClient` envía `Authorization: Bearer` en llamadas protegidas; logout limpia token.
- Credenciales inválidas muestran el error del backend.
**Definición de terminado:** eliminado el atajo `"123456"`; una ruta protegida responde 2xx tras login real.
**Dependencias:** US-001; `utils/auth.js`; endpoints `/auth/*`.

---

**ID:** US-003 · **Prioridad:** Crítico · **Estado actual:** Inconsistente
**Título:** Frontend compilable y con rutas coherentes
**Como** desarrollador **quiero** que `App.jsx` importe los módulos reales **para** levantar la SPA sin errores.
**Criterios de aceptación:** `npm start` compila; toda ruta resuelve a una página existente; rutas protegidas usan `ProtectedRoute` con auth real.
**Definición de terminado:** navegación por Home, Producto, Carrito, Login, Checkout sin pantallas en blanco por import roto.
**Dependencias:** árbol real de `Pages/`; US-002.

---

**ID:** US-004 · **Prioridad:** Alto · **Estado actual:** Parcial
**Título:** Gestión de direcciones vía API
**Como** cliente **quiero** guardar/elegir direcciones desde el servidor **para** que persistan entre sesiones.
**Criterios de aceptación:** rutas CRUD de `Address` montadas y corregidas; el front las consume (no mock); default único por usuario.
**Definición de terminado:** crear/editar/eliminar dirección se refleja en Mongo tras recargar.
**Dependencias:** F3.1; US-002.

---

**ID:** US-005 · **Prioridad:** Alto · **Estado actual:** Inconsistente
**Título:** Métodos de pago persistentes y seguros
**Como** cliente **quiero** registrar/seleccionar métodos de pago desde el servidor **para** completar el checkout de forma segura.
**Criterios de aceptación:** front usa `/api/payment-methods`; `deletePaymentMethod` funciona; no se guarda `cvv`, `numCard` enmascarado.
**Definición de terminado:** alta/baja/listado end-to-end; sin CVV en BD.
**Dependencias:** F3.2; F1.3; US-002.

---

**ID:** US-006 · **Prioridad:** Alto · **Estado actual:** No implementado
**Título:** Crear orden real al finalizar el checkout
**Como** cliente **quiero** que al confirmar se genere una orden en el servidor **para** tener historial y seguimiento.
**Criterios de aceptación:** confirmar hace `POST /api/orders` con datos reales; confirmación muestra la orden del backend; el carrito se limpia.
**Definición de terminado:** orden en Mongo con `status=pending`; historial desde API.
**Dependencias:** US-002, US-004, US-005; F4.1.

---

**ID:** US-007 · **Prioridad:** Alto · **Estado actual:** Parcial
**Título:** Carrito con fuente de verdad única
**Como** cliente autenticado **quiero** que mi carrito se sincronice bien con el servidor **para** conservarlo sin duplicidades.
**Criterios de aceptación:** sync usa `_id` real; merge no duplica/pierde ítems; carrito de invitado se fusiona al iniciar sesión.
**Definición de terminado:** agregar como invitado, iniciar sesión y ver el ítem persistido en Mongo.
**Dependencias:** US-002; F2.2; F3.4.

---

**ID:** US-008 · **Prioridad:** Alto · **Estado actual:** Inconsistente
**Título:** Proteger la escritura del catálogo
**Como** administrador **quiero** que solo admins creen/editen/eliminen productos **para** evitar cambios no autorizados.
**Criterios de aceptación:** `POST/PUT/DELETE /products` exigen `auth + admin`; cliente sin rol recibe 403.
**Definición de terminado:** pruebas confirman 401/403 sin token/rol.
**Dependencias:** US-002; F2.3 (rol admin correcto).

---

**ID:** US-009 · **Prioridad:** Medio · **Estado actual:** Parcial
**Título:** Wishlist funcional end-to-end
**Como** cliente **quiero** agregar/quitar productos de mi lista de deseos **para** guardarlos para después.
**Criterios de aceptación:** `WishList.products` referencia `Product`; existe `wishlistService` + UI sobre `/api/wishlist`.
**Definición de terminado:** agregar/quitar se refleja en Mongo y UI.
**Dependencias:** F3.3; US-002.

---

**ID:** US-010 · **Prioridad:** Alto · **Estado actual:** No implementado
**Título:** Documentación de arranque del monorepo
**Como** desarrollador nuevo **quiero** un README que explique cómo levantar back + front + Mongo **para** poner el proyecto a correr sin adivinar.
**Criterios de aceptación:** README raíz con ambos proyectos, puertos, env y orden de arranque; README del front reemplaza el boilerplate.
**Definición de terminado:** un dev externo levanta el stack solo con el README.
**Dependencias:** US-001; F5.2.
