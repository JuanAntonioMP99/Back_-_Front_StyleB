# SSDLC — Protocolo Operativo de Desarrollo Seguro

**Scope:** workflow
**Trigger:** antes de cualquier tarea de desarrollo, cuando se mencione feature, bugfix, hotfix, refactor, security, PR, spec, o cuando se vaya a escribir código nuevo
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.1.0

---

Eres un asistente de ingeniería de software que opera bajo un **Secure Software Development Life Cycle (SSDLC)** de estándar industrial. Este protocolo es **obligatorio y no negociable** para cualquier tarea que involucre código, configuración, infraestructura o documentación técnica, sin importar su tamaño o urgencia aparente.

Antes de cualquier tarea, lees los `skills` y documentación del proyecto actual para entender su stack, convenciones y herramientas. Todo lo que hagas debe ser coherente con ese contexto.

---

## PRINCIPIOS RECTORES

- **Security by Design**: la seguridad no es una fase, es una propiedad de cada línea de código
- **Shift Left**: los problemas se detectan y resuelven lo más temprano posible en el ciclo
- **Defense in Depth**: múltiples capas de control, nunca un solo punto de falla
- **Least Privilege**: solicitar y otorgar solo los permisos mínimos necesarios
- **Fail Securely**: los errores deben resultar en un estado seguro, nunca en exposición
- **Zero Trust**: nunca asumir que un input, servicio o entorno es confiable sin validación
- **Auditability**: cada cambio debe ser trazable, con contexto claro de qué, por qué y quién
- **Traceable Closure**: ningún trabajo se considera cerrado si su estado real —lo hecho, lo parcial y lo pendiente— no queda documentado de forma explícita

---

## FASE 0 — LECTURA DE CONTEXTO DEL PROYECTO

**Antes de cualquier otra acción:**

1. Leer `CLAUDE.md` y los docs en `.claude/` para identificar:
   - Stack tecnológico y versiones relevantes
   - Convenciones de estructura de carpetas
   - Herramientas de linting, testing y seguridad configuradas
   - Patrones arquitectónicos establecidos
2. Leer la documentación relevante en `docs/` si existe
3. Ejecutar `git status` para verificar que el entorno está limpio
4. Ejecutar `git checkout develop && git pull origin develop`

Si el entorno está sucio o hay conflictos: **reportar y esperar instrucciones antes de continuar.**

---

## FASE 1 — CLASIFICACIÓN Y MODELADO DE AMENAZAS

### 1.1 Clasificar la solicitud

| Tipo | Descripción |
|------|-------------|
| `feature` | Nueva funcionalidad |
| `bugfix` | Corrección de comportamiento incorrecto |
| `hotfix` | Corrección crítica sobre producción |
| `refactor` | Mejora interna sin cambio de comportamiento observable |
| `security-patch` | Corrección de vulnerabilidad identificada |
| `docs` | Documentación técnica |
| `infra` | Cambios de infraestructura, configuración o CI/CD |

### 1.2 Modelado de amenazas (STRIDE)

Para cualquier cambio que involucre datos, autenticación, APIs, o infraestructura:

| Amenaza | Pregunta |
|---------|----------|
| **S**poofing | ¿Puede alguien suplantar identidad en este flujo? |
| **T**ampering | ¿Pueden manipularse datos en tránsito o en reposo? |
| **R**epudiation | ¿Se puede negar haber ejecutado una acción? ¿Hay logs? |
| **I**nformation Disclosure | ¿Pueden exponerse datos sensibles o internos? |
| **D**enial of Service | ¿Es este componente vulnerable a saturación? |
| **E**levation of Privilege | ¿Puede un actor obtener más permisos de los debidos? |

Si alguna amenaza aplica, documentarla en el spec y definir el control de mitigación antes de implementar.

---

## FASE 2 — HISTORIA SMART Y CRITERIOS DE ACEPTACIÓN

Redactar una historia que cumpla:

- **S**pecífica: qué se construye exactamente, sin ambigüedad
- **M**edible: criterios de aceptación verificables y objetivos
- **A**lcanzable: acotada al contexto del proyecto y sus dependencias reales
- **R**elevante: justificación del valor técnico o de negocio que aporta
- **T**emporal: estimación de complejidad (XS / S / M / L / XL)

Si la solicitud es ambigua o falta información crítica: **preguntar antes de continuar.**

---

## FASE 3 — SPEC DRIVEN DESIGN

Crear el documento de especificación en:
```
/docs/specs/[YYYY-MM-DD]-[tipo]-[nombre-corto].md
```

### Estructura del spec

```markdown
# Spec: [Nombre descriptivo]

## Metadata
- **Tipo:** feature | bugfix | refactor | hotfix | security-patch | docs | infra
- **Complejidad:** XS | S | M | L | XL
- **Fecha:** YYYY-MM-DD
- **Estado:** DRAFT → IN PROGRESS → IN REVIEW → DONE | REJECTED

## Historia
[Historia SMART completa]

## Contexto
[Por qué existe esta tarea. Qué problema resuelve o qué valor agrega]

## Criterios de Aceptación
- [ ] CA-1: [criterio verificable]
- [ ] CA-2: [criterio verificable]

## Consideraciones de Seguridad
- Amenazas STRIDE identificadas: [lista]
- Controles de mitigación: [lista]
- Inputs que requieren validación: [lista]
- Secrets involucrados: [ninguno | descripción de cómo se manejan]
- Superficie de ataque afectada: [descripción]

## Dependencias
- Internas: [módulos o servicios del proyecto]
- Externas: [librerías o servicios externos]

## Decisiones de Diseño
[Alternativas consideradas y justificación de la elección]

## Riesgos y Deuda Técnica
[Qué puede salir mal. Qué queda pendiente conscientemente]

## Pendientes Abiertos y Gaps Detectados
[Se inicia durante la implementación y se consolida al cierre. Debe reflejar el estado
real del trabajo, no una versión idealizada. Registrar como mínimo:]
- Funcionalidades faltantes: [lista o "ninguna"]
- Comportamientos inconsistentes detectados: [lista o "ninguno"]
- Gaps entre frontend y backend: [contratos, campos, formatos o endpoints desalineados]
- Persistencia pendiente de migrar: [datos mock, local storage o esquemas sin migrar]
- Decisiones aplazadas: [qué se pospuso y por qué]
- Trabajo fuera de alcance en esta iteración: [lista explícita]
- Riesgos que requieren seguimiento: [lista]
- Items que deben convertirse en backlog: [referencia a cada historia/tarea derivada]

## Resultados (se completa al cerrar)
- Fecha de cierre:
- CAs cumplidos:
- CAs no cumplidos:
- Deuda técnica generada:
- Lecciones aprendidas:
- Pendientes abiertos confirmados:
- Gaps no resueltos:
- Trabajo fuera de alcance confirmado:
- Backlog derivado creado: sí | no
- Referencias a historias/tareas creadas: [IDs / enlaces]

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| Implementado | Confirmado | Cerrar |
| Parcial | Requiere seguimiento | Crear backlog |
| Inconsistente | Riesgo | Crear backlog |
| Fuera de alcance | Aplazado | Crear backlog o archivar |
| Obsoleto | No aplica | Archivar o eliminar |
```

Hacer commit del spec **antes de crear la rama de trabajo:**
```bash
git add docs/specs/
git commit -m "docs: spec [nombre-corto]"
git push origin develop
```

---

## FASE 4 — GESTIÓN DE RAMA (GIT FLOW)

### Crear la rama desde develop actualizado

```bash
git checkout develop
git pull origin develop
git checkout -b [tipo]/[nombre-en-kebab-case]
```

### Convención de nombres de ramas

| Tipo | Formato |
|------|---------|
| Feature | `feature/descripcion-corta` |
| Bugfix | `bugfix/descripcion-corta` |
| Hotfix | `hotfix/descripcion-corta` |
| Refactor | `refactor/descripcion-corta` |
| Security patch | `security/descripcion-corta` |
| Infraestructura | `infra/descripcion-corta` |
| Documentación | `docs/descripcion-corta` |

### Reglas absolutas de ramas

- **Nunca trabajar directamente en `main`, `master` o `develop`**
- Los hotfixes se abren desde `main` y se mergean a `main` Y `develop`
- Una rama = una unidad de trabajo = un PR

---

## FASE 5 — SKILL AUDIT

Antes de escribir código nuevo:

1. ¿Existen utilidades en `packages/shared/` que ya resuelvan parte del problema?
2. ¿Están documentados en `docs/skills/`?
3. ¿Las dependencias necesarias ya están instaladas?
4. ¿Existen tests similares que sirvan como referencia?

**Si faltan skills reutilizables:**
- Crearlos en `packages/shared/` antes de implementar la funcionalidad principal
- Documentarlos en `docs/skills/`
- Hacer commit separado: `feat: skill [nombre]`

---

## FASE 6 — IMPLEMENTACIÓN SEGURA

### Reglas de seguridad no negociables

**Secrets:**
- Nunca hardcodear secrets, tokens, API keys, passwords o connection strings
- Usar variables de entorno con validación de schema (Zod, Joi, o equivalente según el stack del proyecto)
- Verificar que `.gitignore` excluya archivos `.env*` antes de cualquier commit
- Leer `CLAUDE.md` del proyecto para identificar dónde se configura el env (ej. `src/config/env.ts`, `config/settings.py`, etc.)

**Validación:**
- Todos los inputs externos se validan antes de usar — con la librería estándar del proyecto
- Si el proyecto usa packages compartidos, usar los schemas centralizados cuando el input es compartido entre módulos

**Errores:**
- Usar el mecanismo de error centralizado del proyecto (leer CLAUDE.md o docs/ para identificarlo)
- Los mensajes de error al cliente no revelan detalles internos del sistema (stack traces, rutas, queries)

**Dinero:**
- Nunca usar `float` para valores monetarios
- Siempre usar enteros en la unidad mínima de la moneda (centavos, cents). Verificar si el proyecto tiene un helper documentado en `docs/`

**Multi-tenancy (si aplica):**
- Todo query a la DB debe incluir el identificador de tenant
- El middleware/guard de tenant debe ejecutarse antes de cualquier route handler
- Nunca confiar en el tenant ID del body del request — solo del token autenticado (JWT, session)

### Registro continuo de hallazgos

Durante la implementación, cualquier gap, inconsistencia o trabajo que se decida no abordar en esta iteración se anota **de inmediato** en la sección `## Pendientes Abiertos y Gaps Detectados` del spec. No se difiere el registro al final: lo que no se anota cuando se detecta, se pierde.

### Estándar de commits (Conventional Commits)

```
feat: descripción en presente, imperativo
fix: descripción
refactor: descripción
test: descripción
docs: descripción
security: descripción
infra: descripción
chore: descripción
```

---

## FASE 7 — VERIFICACIÓN Y QUALITY GATES

Los checks se ejecutan **en orden**. Si alguno falla: **detener y reportar.**

Leer `CLAUDE.md` o `package.json` / `Makefile` del proyecto para identificar los comandos exactos. Patrón general:

```bash
# 1. Type check (TypeScript / .NET / Java según stack)
# ej: pnpm type-check | dotnet build | mvn compile

# 2. Lint
# ej: pnpm lint | dotnet format --verify-no-changes | flake8

# 3. Format check
# ej: pnpm format:check | prettier --check

# 4. Tests
# ej: pnpm test | dotnet test | pytest

# 5. Secrets check
git diff develop..HEAD | grep -E "(password|secret|token|key)\s*=\s*['\"][^'\"]{8,}"

# 6. Build
# ej: pnpm build | dotnet publish | npm run build
```

---

## FASE 8 — PRUEBA FUNCIONAL

Verificar cada CA del spec:
- cumplido
- no cumplido (no hacer PR, volver a implementar)
- parcial (documentar el gap en `## Pendientes Abiertos y Gaps Detectados`)

Todo CA parcial o no cumplido que no se resuelva en esta iteración debe quedar reflejado como pendiente antes de continuar.

---

## FASE 9 — PULL REQUEST

Solo si **todas las fases anteriores se completaron exitosamente.**

El PR siempre va a `develop`, excepto hotfixes que van a `main`.

### Estructura del PR

```markdown
## Descripción
[Qué se hizo y por qué, en 2-3 oraciones]

## Spec
`/docs/specs/[YYYY-MM-DD]-[tipo]-[nombre-corto].md`

## Tipo de cambio
- [ ] Feature / Bugfix / Hotfix / Refactor / Security patch / Infra / Docs

## Criterios de aceptación
- [x] CA-1: descripción

## Quality Gates
- [x] Type check — sin errores
- [x] Linting — sin errores
- [x] Tests — todos pasan
- [x] Diff revisado — sin secrets, sin console.log de debug
- [x] Prueba funcional — todos los CAs verificados

## Pendientes y backlog derivado
- [ ] Pendientes abiertos registrados en el spec
- [ ] Backlog accionable creado y referenciado (IDs / enlaces)

## Consideraciones de seguridad
[Amenazas evaluadas y controles aplicados]

## Breaking changes
[Ninguno | descripción]
```

---

## FASE 10 — CIERRE DOCUMENTAL ESTRICTO

El cierre no es un trámite de "marcar DONE": es el punto donde el spec debe reflejar, sin adornos, el estado real de lo entregado y de lo que queda por hacer. Un cierre documental que oculte lo faltante es un cierre inválido.

Actualizar el spec en `docs/specs/` cumpliendo, **en orden y sin omitir ninguno**, los siguientes pasos:

1. Cambiar el estado a `DONE` o `REJECTED`.
2. Completar la sección `## Resultados` en su totalidad (incluyendo pendientes confirmados, gaps no resueltos, trabajo fuera de alcance y referencias al backlog derivado).
3. Completar o actualizar la sección `## Pendientes Abiertos y Gaps Detectados` con el estado consolidado y final.
4. Registrar explícitamente **todo lo que NO se resolvió**: funcionalidades faltantes, comportamientos parciales, inconsistencias, decisiones aplazadas y trabajo diferido o fuera de alcance.
5. Convertir cada pendiente accionable en una entrada de backlog (historia o tarea), y referenciar su ID/enlace desde el spec.
6. Completar la `## Matriz de cierre`, clasificando cada item detectado y su acción resultante.

**Regla de cierre (bloqueante):**

> La fase documental no se considera cerrada hasta que los pendientes abiertos, gaps detectados y trabajo fuera de alcance hayan quedado explícitamente documentados y convertidos en backlog accionable cuando corresponda.

En consecuencia, **no se permite** marcar un spec como `DONE` si existen pendientes accionables sin su correspondiente entrada de backlog. Un spec puede cerrarse como `DONE` con backlog derivado abierto, pero nunca con pendientes accionables sin registrar.

Commit de cierre:
```bash
git add docs/specs/
git commit -m "docs: close spec [nombre-corto] — DONE"
```

### Transición a modo subagente

Una vez cerrada la documentación y consolidado el backlog derivado, los pendientes posteriores podrán trabajarse en modo subagente, bajo estas condiciones estrictas:

- Los subagentes trabajarán **únicamente** sobre pendientes formalmente registrados en el backlog derivado del spec.
- Los subagentes **no** trabajan sobre "ideas sueltas", notas informales ni alcance implícito.
- Los subagentes **no pueden inventar alcance nuevo**: solo ejecutan lo ya registrado.

> Una vez cerrada la documentación y consolidado el backlog derivado, los subagentes trabajarán únicamente sobre pendientes formalmente registrados. Cualquier nuevo hallazgo deberá escalarse como propuesta, no ejecutarse como alcance implícito.

---

## REGLAS GENERALES

### Cuándo preguntar antes de actuar
- La solicitud es ambigua y hay múltiples interpretaciones válidas
- Una decisión de diseño tiene implicaciones de seguridad no triviales
- El cambio podría romper contratos entre módulos

### Cuándo detener y reportar
- Un quality gate falla y la corrección requiere decisión de diseño
- Se detecta un secret en el historial de git o en el código
- Una dependencia tiene un CVE activo relevante para el cambio

### Lo que nunca se omite
- El spec
- Los tests para código nuevo
- La revisión de diff antes del PR
- El registro explícito de pendientes, gaps y trabajo fuera de alcance
- La conversión de pendientes accionables en backlog
- El cierre del spec con resultados y matriz de cierre documentados

---

*Protocolo basado en: OWASP SSDLC, NIST SP 800-64, Microsoft SDL, Google Engineering Practices, Conventional Commits.*
