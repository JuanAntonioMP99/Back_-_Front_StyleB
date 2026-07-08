# API Best Practices - RESTful Design & Production Ready

**Scope:** backend
**Trigger:** cuando se diseñen APIs REST, se mencione API design, RESTful principles, API documentation, o production-ready APIs
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para diseñar y desarrollar APIs RESTful profesionales y production-ready. Cubre principios REST, versionado, documentación con Swagger/OpenAPI, seguridad, rate limiting, caching y monitoring.

## Cuándo Usar Esta Skill

- Diseñar nuevas APIs REST desde cero
- Refactorizar APIs existentes
- Implementar versionado de APIs
- Documentar APIs con OpenAPI/Swagger
- Configurar rate limiting y throttling
- Implementar caching strategies
- Preparar APIs para producción
- Migrar de REST a GraphQL

## Contexto y Conocimiento

### Principios REST

**REST (Representational State Transfer):**
1. **Client-Server** - Separación de responsabilidades
2. **Stateless** - No se guarda estado del cliente en servidor
3. **Cacheable** - Responses deben indicar si son cacheables
4. **Uniform Interface** - URLs consistentes y predecibles
5. **Layered System** - Cliente no sabe si habla con servidor final
6. **Code on Demand** (opcional) - Servidor puede enviar código

### Niveles de Madurez Richardson

```
Level 0: Single URI, Single Method (RPC)
    POST /api/endpoint

Level 1: Multiple URIs, Single Method
    POST /api/users
    POST /api/products

Level 2: Multiple URIs, Multiple Methods (HTTP Verbs)
    GET    /api/users
    POST   /api/users
    PUT    /api/users/1
    DELETE /api/users/1

Level 3: HATEOAS (Hypermedia)
    {
      "id": 1,
      "name": "John",
      "_links": {
        "self": "/users/1",
        "orders": "/users/1/orders"
      }
    }
```

## Diseño de URLs

### Naming Conventions

```
BIEN - Recursos en plural, sustantivos
GET    /api/v1/users
GET    /api/v1/users/123
POST   /api/v1/users
PUT    /api/v1/users/123
DELETE /api/v1/users/123

BIEN - Relaciones anidadas
GET    /api/v1/users/123/orders
GET    /api/v1/users/123/orders/456
POST   /api/v1/users/123/orders

MAL - Verbos en URLs
GET    /api/v1/getUsers
POST   /api/v1/createUser
PUT    /api/v1/updateUser

MAL - Singular inconsistente
GET    /api/v1/user
GET    /api/v1/products
```

### Query Parameters

```
BIEN - Filtros, búsqueda, paginación
GET /api/v1/users?role=admin&status=active
GET /api/v1/products?category=electronics&price_max=1000
GET /api/v1/posts?page=2&limit=20&sort=-created_at

BIEN - Campos específicos (sparse fieldsets)
GET /api/v1/users?fields=id,name,email

BIEN - Búsqueda
GET /api/v1/products?search=laptop
GET /api/v1/users?q=john

MAL - Lógica de negocio en query
GET /api/v1/users?action=sendEmail
```

## HTTP Methods y Status Codes

### HTTP Methods

```
GET     - Obtener recursos (idempotente, cacheable)
POST    - Crear nuevo recurso
PUT     - Actualizar completo (idempotente)
PATCH   - Actualizar parcial (idempotente)
DELETE  - Eliminar recurso (idempotente)
HEAD    - Como GET pero solo headers
OPTIONS - Métodos permitidos (CORS)
```

### Status Codes Correctos

**2xx - Success:**
```
200 OK              - GET, PUT, PATCH exitosos
201 Created         - POST exitoso, recurso creado
    Location: /api/v1/users/123
202 Accepted        - Procesamiento asíncrono aceptado
204 No Content      - DELETE exitoso o PUT sin retorno
```

**3xx - Redirection:**
```
301 Moved Permanently  - URL cambió permanentemente
302 Found              - URL temporal
304 Not Modified       - Cache válido
```

**4xx - Client Error:**
```
400 Bad Request           - Validación falló
401 Unauthorized          - No autenticado
403 Forbidden             - No tiene permisos
404 Not Found             - Recurso no existe
405 Method Not Allowed    - Método HTTP no permitido
409 Conflict              - Conflicto (ej: email duplicado)
422 Unprocessable Entity  - Validación de negocio falló
429 Too Many Requests     - Rate limit excedido
```

**5xx - Server Error:**
```
500 Internal Server Error  - Error no manejado
502 Bad Gateway            - Gateway inválido
503 Service Unavailable    - Servicio temporalmente no disponible
504 Gateway Timeout        - Gateway timeout
```

### Ejemplos de Responses

```json
// 200 OK - GET /api/v1/users/123
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}

// 201 Created - POST /api/v1/users
{
  "id": 124,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "createdAt": "2024-01-02T00:00:00Z"
}
// Header: Location: /api/v1/users/124

// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 6 characters"
      }
    ]
  }
}

// 404 Not Found
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found with id: 999"
  }
}

// 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
// Header: Retry-After: 60
```

## Versionado

### Estrategias de Versionado

**1. URL Path (Recomendado):**
```
GET /api/v1/users
GET /api/v2/users
```

**2. Query Parameter:**
```
GET /api/users?version=1
GET /api/users?version=2
```

**3. Header:**
```
GET /api/users
Header: Accept: application/vnd.myapi.v1+json
```

**4. Content Negotiation:**
```
GET /api/users
Header: Accept: application/vnd.myapi+json; version=1
```

### Breaking vs Non-Breaking Changes

**Non-Breaking (no requiere nueva versión):**
- Agregar nuevo endpoint
- Agregar nuevo campo opcional en request
- Agregar nuevo campo en response
- Hacer campo requerido opcional

**Breaking (requiere nueva versión):**
- Cambiar URL de endpoint
- Remover campo de response
- Cambiar tipo de dato de campo
- Hacer campo opcional requerido
- Cambiar comportamiento de lógica

## Paginación

### Offset-based Pagination

```
GET /api/v1/users?page=2&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": true
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=20",
    "prev": "/api/v1/users?page=1&limit=20",
    "next": "/api/v1/users?page=3&limit=20",
    "last": "/api/v1/users?page=8&limit=20"
  }
}
```

### Cursor-based Pagination (mejor para grandes datasets)

```
GET /api/v1/posts?cursor=abc123&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "nextCursor": "def456",
    "prevCursor": "xyz789",
    "hasNext": true
  },
  "links": {
    "next": "/api/v1/posts?cursor=def456&limit=20",
    "prev": "/api/v1/posts?cursor=xyz789&limit=20"
  }
}
```

## Filtrado y Búsqueda

### Filtros Simples

```
GET /api/v1/products?category=electronics
GET /api/v1/users?role=admin&status=active
GET /api/v1/posts?author_id=123&published=true
```

### Rangos

```
GET /api/v1/products?price_min=100&price_max=500
GET /api/v1/orders?created_after=2024-01-01&created_before=2024-12-31
```

### Ordenamiento

```
GET /api/v1/users?sort=name           # Ascendente
GET /api/v1/users?sort=-created_at    # Descendente (-)
GET /api/v1/products?sort=category,-price  # Múltiples
```

### Búsqueda

```
GET /api/v1/products?search=laptop
GET /api/v1/users?q=john&fields=name,email
```

### Campos Específicos (Sparse Fieldsets)

```
GET /api/v1/users?fields=id,name,email
GET /api/v1/products?fields=id,name,price

Response:
{
  "data": [
    {
      "id": 1,
      "name": "John",
      "email": "john@example.com"
      // Solo campos solicitados
    }
  ]
}
```

## Seguridad

### Authentication

**JWT Bearer Token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**API Key:**
```
X-API-Key: your-api-key-here
```

**OAuth 2.0:**
```
Authorization: Bearer <access_token>
```

### Rate Limiting

**Headers de Rate Limit:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641024000

// Cuando se excede:
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1641024060
```

**Estrategias:**
```
1. Fixed Window   - 1000 requests por hora fija
2. Sliding Window - 1000 requests en rolling 1 hora
3. Token Bucket   - Tokens que se recargan
4. Leaky Bucket   - Cola con rate constante
```

### CORS

```javascript
// Express ejemplo
app.use(cors({
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

### Security Headers

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Caching

### Cache Headers

```
// Cache for 1 hour
Cache-Control: public, max-age=3600

// No cache
Cache-Control: no-store, no-cache, must-revalidate

// Private cache (browser only)
Cache-Control: private, max-age=300

// ETag for conditional requests
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

### Conditional Requests

```
// Cliente hace request con ETag
GET /api/v1/users/123
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// Si no cambió: 304 Not Modified (sin body)
HTTP/1.1 304 Not Modified
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// Si cambió: 200 OK (con nuevo body y ETag)
HTTP/1.1 200 OK
ETag: "new-etag-value"
```

## Documentación con OpenAPI/Swagger

### OpenAPI Spec (YAML)

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: API for managing users and products

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging

paths:
  /users:
    get:
      summary: List all users
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '401':
          $ref: '#/components/responses/Unauthorized'
      security:
        - bearerAuth: []

    post:
      summary: Create a new user
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 123
        name:
          type: string
          example: John Doe
        email:
          type: string
          format: email
          example: john@example.com
        createdAt:
          type: string
          format: date-time

    CreateUserRequest:
      type: object
      required:
        - name
        - email
        - password
      properties:
        name:
          type: string
          minLength: 3
          maxLength: 50
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 6

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

  responses:
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                    example: UNAUTHORIZED
                  message:
                    type: string
                    example: Authentication required

    BadRequest:
      description: Bad Request
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                  message:
                    type: string
                  details:
                    type: array
                    items:
                      type: object

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Monitoring y Logging

### Métricas Clave

```
1. Request Rate     - Requests por segundo
2. Error Rate       - % de 4xx y 5xx
3. Latency          - P50, P95, P99
4. Availability     - Uptime %
5. Throughput       - Data transferido
```

### Structured Logging

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "method": "GET",
  "path": "/api/v1/users/123",
  "statusCode": 200,
  "responseTime": 45,
  "userId": 456,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Health Check Endpoint

```
GET /health

Response:
{
  "status": "healthy",
  "version": "1.2.3",
  "timestamp": "2024-01-01T12:00:00Z",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "externalApi": "degraded"
  },
  "uptime": 86400
}
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Inconsistent responses | Cada endpoint diferente | Estandarizar formato |
| Verbos en URLs | No seguir REST | Usar recursos + HTTP verbs |
| N+1 queries | Falta eager loading | Optimizar queries con joins |
| Sin versionado | Breaking changes sin aviso | Implementar /v1/, /v2/ |
| Paginación ausente | Retornar miles de items | Siempre paginar resultados |
| Sin rate limiting | Abuso de API | Implementar throttling |

## Checklist Production-Ready

- [ ] Versionado implementado (/v1/)
- [ ] Paginación en endpoints de lista
- [ ] Filtros y ordenamiento
- [ ] Rate limiting configurado
- [ ] Authentication/Authorization
- [ ] CORS configurado correctamente
- [ ] Error handling consistente
- [ ] Logging estructurado
- [ ] Documentación OpenAPI/Swagger
- [ ] Health check endpoint
- [ ] Caching strategy
- [ ] Monitoring y alertas
- [ ] Load testing realizado
- [ ] Security headers
- [ ] Input validation

## Best Practices

1. **RESTful URLs** - Recursos en plural, sustantivos
2. **HTTP Methods** - Usar correctamente GET, POST, PUT, DELETE
3. **Status Codes** - Específicos y correctos
4. **Versioning** - Desde el inicio (/v1/)
5. **Pagination** - Siempre en listas grandes
6. **Rate Limiting** - Proteger contra abuso
7. **Documentation** - OpenAPI/Swagger actualizado
8. **Consistent Responses** - Mismo formato siempre
9. **Security** - JWT, CORS, rate limit, validation
10. **Monitoring** - Logs, métricas, alertas

## REST vs GraphQL vs gRPC

| Feature | REST | GraphQL | gRPC |
|---------|------|---------|------|
| **Best for** | CRUD apps | Complex queries | Microservices |
| **Learning curve** | Fácil | Media | Alta |
| **Over-fetching** | Común | No | No |
| **Under-fetching** | Común (N+1) | No | No |
| **Caching** | Built-in HTTP | Custom | Custom |
| **Tooling** | Excelente | Muy bueno | Bueno |
| **Browser support** | Nativo | Nativo | No directo |

---

**Última actualización:** Fase 4 - Skills Backend Robusto
**Mantenedor:** Sistema de Skills
**Siguiente:** Sistema completo con backend enterprise-ready
