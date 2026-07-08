# Spec: Seguridad e higiene del repositorio (E1)

## Metadata
- **Tipo:** infra / security-patch
- **Complejidad:** M
- **Fecha:** 2026-07-07
- **Estado:** IN PROGRESS

## Historia
Como responsable técnico quiero retirar secretos y artefactos del control de versiones y establecer higiene de repo, para eliminar la exposición de credenciales (hoy explotable) y dejar una base limpia sobre la cual continuar el desarrollo.

## Contexto
El repo no tiene `.gitignore`; están versionados `Base_Datos_StyleB/.env` (con `JWT_SECRET`, `JWT_REFRESH_TOKEN`), `node_modules/` (~42k archivos) y `build/`. Además, `ADMIN_SECRET` no está definido en `.env`, lo que provoca escalada de privilegios en el registro (ver [known-issues K01](../known-issues.md#K01)).

## Criterios de Aceptación
- [ ] CA-1: Existe `.gitignore` en la raíz que excluye `node_modules/`, `build/`, `.env*`, `logs/`.
- [ ] CA-2: `Base_Datos_StyleB/.env`, `node_modules/`, `build/` y `logs/` dejan de estar rastreados por git.
- [ ] CA-3: Existe `Base_Datos_StyleB/.env.example` con todas las variables (incl. `ADMIN_SECRET`) sin valores reales.
- [ ] CA-4: Los secretos (`JWT_SECRET`, `JWT_REFRESH_TOKEN`) se rotan y se define `ADMIN_SECRET`.
- [ ] CA-5: El backend sigue arrancando leyendo su `.env` local no versionado.

## Consideraciones de Seguridad
- Amenazas STRIDE: **Information Disclosure** (secretos en repo), **Elevation of Privilege** (K01).
- Controles: gitignore, purga del índice, rotación de secretos, `.env.example`.
- Nota de trazabilidad: `git rm --cached` **no** elimina los secretos del **historial**. Mitigación real = **rotar** los secretos (obligatorio); opcional: reescritura de historial (`git filter-repo`).

## Dependencias
- Internas: `authController` (usa `ADMIN_SECRET`, `JWT_SECRET`, `JWT_REFRESH_TOKEN`).
- Externas: acceso al entorno para rotar y redeplegar secretos.

## Decisiones de Diseño
- Untrackeo dirigido (`git rm --cached` de rutas concretas) en lugar de `git rm -r --cached .`, para no re-stagear cambios de trabajo no relacionados ya presentes en el working tree.
- No se reescribe el historial en esta iteración (se difiere); la rotación cubre el riesgo operativo.

## Pendientes Abiertos y Gaps Detectados
- Funcionalidades faltantes: rotación efectiva de secretos y `ADMIN_SECRET` (requiere acción humana).
- Comportamientos inconsistentes: `db.conf.js` ignora `MONGODB_URI` (K02) — fuera de alcance de E1, va a E3.
- Gaps FE/BE: no aplica en E1.
- Persistencia pendiente de migrar: no aplica en E1.
- Decisiones aplazadas: reescritura de historial de git (`filter-repo`).
- Trabajo fuera de alcance en esta iteración: F1.3 (tokenización de tarjetas), corrección de la lógica de rol admin en código (F2.3, va a E2).
- Riesgos que requieren seguimiento: secretos permanecen en el historial hasta rotación.
- Items que deben convertirse en backlog: F2.3 (rol admin), F3.6 (URI env), F1.3 (PCI).

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
- Referencias a historias/tareas creadas:

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| `.gitignore` + untrackeo | Confirmado | Cerrar |
| Rotación de secretos + `ADMIN_SECRET` | Requiere seguimiento | Backlog / acción humana |
| Secretos en historial | Riesgo | Backlog (decisión: rotar vs reescribir historial) |
| `db.conf.js` ignora env (K02) | Fuera de alcance | Backlog (E3) |
