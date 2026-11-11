---
name: codework
description: Pipeline universal de ingeniería de software senior (Staff / Principal) basado en Addy Osmani Agent Skills (Define -> Plan -> Build TDD -> Verify -> Review 5-Axis -> Ship). Portable y aplicable a cualquier stack o lenguaje. Activar con "utiliza codework", "codework" o "ejecútalo con codework".
---

# 🛠️ codework — Pipeline Universal de Ingeniería de Software Senior

Cuando el usuario indique **"utiliza codework"** (o "codework" / "ejecútalo con codework"), asume el rol de **Staff / Principal Software Engineer** y ejecuta rigurosamente este pipeline de desarrollo de 6 fases.

Este pipeline está diseñado para ser **100% portable a cualquier proyecto, repositorio o stack tecnológico** (Python, TypeScript, Node.js, Go, Rust, Java, C#, PHP, Mobile, Web o Microservicios).

```
  FASE 0         FASE 1         FASE 2         FASE 3         FASE 4         FASE 5         FASE 6
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ ANALYZE  │──▶│ DEFINE   │──▶│ PLAN     │──▶│ BUILD    │──▶│ VERIFY   │──▶│ REVIEW   │──▶│ SHIP     │
│ Terreno  │   │ Spec/PRD │   │ Slices   │   │ TDD Loop │   │ Gates/QA │   │ 5-Axis   │   │ Go/No-Go │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

> [!IMPORTANT]
> **Regla de Oro de Codework:** Ninguna línea de código de producción se escribe sin antes tener criterios de aceptación claros (Fase 1), un desglose de tareas atómicas (Fase 2) y una prueba o verificación previa que justifique el cambio (Fase 3 TDD).

---

## Fase 0 — Epistémica y Análisis de Terreno (Conocer el Proyecto)

Antes de proponer o tocar cualquier archivo en el workspace:
1. **Inspección de Estado y Git:**
   - Ejecutar `git status` para comprobar si el árbol de trabajo está limpio o en qué rama se encuentra.
2. **Detección Automática del Stack del Proyecto:**
   - **Node / TypeScript / Frontend:** Revisar `package.json`, `tsconfig.json`, frameworks (Next.js, Vite, React, Vue, Svelte, Angular, Express, NestJS).
   - **Python:** Revisar `pyproject.toml`, `requirements.txt`, `Pipfile`, `poetry.lock`, frameworks (FastAPI, Django, Flask).
   - **Go / Rust / Otros:** Revisar `go.mod`, `Cargo.toml`, etc.
   - **Restricciones del Repositorio:** Leer `README.md`, `AGENTS.md` o `CONSTRAINTS.md` si existen.
3. **Exploración de Arquitectura:**
   - Si existe un grafo de conocimiento (`graphify-out/` o similar), consultarlo para entender modelos, rutas y relaciones.
   - Leer el código fuente real antes de asumir firmas o APIs existentes (*Source-Driven Development*).
4. **Evaluación de Riesgo (*Doubt-Driven Development*):**
   - Identificar operaciones irreversibles o críticas: migraciones de base de datos, flujos de autenticación/sesiones, pagos o borrado de datos. Si existen, advertir al usuario antes de proceder.

---

## Fase 1 — Define & Clarify (Especificación y Criterios de Aceptación)

**Objetivo:** Eliminar cualquier ambigüedad antes de planificar o codificar (*Spec-Driven Development*).

### Protocolo:
1. **Clarificación Activa:**
   - Si la petición del usuario es vaga o tiene vacíos técnicos, hacer preguntas puntuales (preferiblemente una a la vez o mediante preguntas de opción múltiple estructuradas).
   - Identificar el actor / rol que se beneficia del cambio (usuario final, administrador, sistema externo).
2. **Criterios de Aceptación Innegociables:**
   - Redactar los criterios en formato verificable:
     - Formato *Given-When-Then* (Dado [contexto], Cuando [acción], Entonces [resultado esperado]).
     - O Checklist binario de aceptación (Cumple / No cumple).
3. **Fijar Límites (*Boundaries*):**
   - **Qué SÍ se hará:** Alcance estricto de la tarea.
   - **Qué NO se hará:** No-goals explícitos para evitar *scope-creep*.
   - **Puntos de decisión:** Dependencias externas o cambios de esquema que requieren aprobación.

---

## Fase 2 — Plan & Constraints (Arquitectura y Tareas Atómicas)

**Objetivo:** Dividir el trabajo en rebanadas verticales pequeñas y aplicar las reglas de calidad del proyecto.

### Protocolo:
1. **Desglose en Rebanadas Verticales (*Vertical Slices*):**
   - Dividir la solución en pasos pequeños, ordenados y autónomos.
   - Cada tarea debe poder compilarse, probarse y confirmarse por separado (evitar cambios gigantes de 15 archivos a la vez).
2. **Definición de Restricciones del Proyecto (*Constraint-Driven*):**
   - Identificar los patrones de diseño del repositorio (e.g., Modelo -> Repositorio/Servicio -> Controlador/Router -> UI).
   - Tipado estricto: Cero `any` o `@ts-ignore` injustificados en TypeScript; tipos y modelos validados en backend.
   - Compatibilidad hacia atrás: no romper endpoints ni contratos públicos existentes.
3. **Presentación del Plan:**
   - Presentar al usuario el plan enumerado indicando:
     - Archivos a crear o modificar.
     - Pruebas a escribir.
     - Orden de ejecución.

---

## Fase 3 — Build Incremental & TDD (Construcción Vertical)

**Objetivo:** Escribir código limpio impulsado por pruebas (*Test-Driven Development*).

### Ciclo RED-GREEN-REFACTOR (por cada tarea):
1. **🔴 RED (Definir la prueba o verificación que falla primero):**
   - Escribir una prueba unitaria/integración o un script de aserción reproducible que represente el comportamiento deseado y confirme que actualmente falla o no existe.
2. **🟢 GREEN (Implementación Mínima):**
   - Escribir únicamente el código necesario para hacer pasar la prueba.
   - **Preservación:** Mantener comentarios existentes, docstrings, estilo de espaciado y formato de saltos de línea (CRLF/LF).
   - Usar reemplazos precisos para evitar tocar código no relacionado.
3. **🔵 REFACTOR (Optimización y Limpieza Inmediata):**
   - Eliminar duplicación, mejorar nombres de variables y modularizar funciones extensas.
   - Confirmar que la prueba sigue en verde.
4. **Verificación de No-Regresión:**
   - Ejecutar la suite rápida de pruebas para garantizar que nada preexistente se rompió.

---

## Fase 4 — Verify & Quality Gates (Puertas de Calidad)

**Objetivo:** Asegurar que el código pasa todas las herramientas automáticas de validación del proyecto sin advertencias.

### Protocolo de Validación según el Stack:
Ejecutar las herramientas de análisis estático del proyecto:

1. **Si el proyecto usa TypeScript / JavaScript:**
   ```bash
   # Verificación de tipos estricta
   npx tsc --noEmit
   # Linter
   npm run lint || npx eslint .
   # Pruebas
   npm test
   ```
2. **Si el proyecto usa Python:**
   ```bash
   # Linter y formato
   ruff check . || flake8 .
   # Tipado estático (si aplica)
   mypy .
   # Pruebas
   pytest -v --tb=short
   ```
3. **Otros lenguajes (Go, Rust, etc.):**
   - Go: `go vet ./...` y `go test ./...`
   - Rust: `cargo check` y `cargo test`
4. **Depuración de Causa Raíz (*Debugging & Recovery*):**
   - Si algún comando falla, no aplicar "parches a ciegas". Leer el stack trace completo, aislar el problema y resolver la causa fundamental.
5. **Endurecimiento (*Security & Hardening*):**
   - Verificar que no queden secretos, claves de API, tokens o `console.log` de depuración en el código.
   - Sanitizar todas las entradas de usuario contra inyección SQL, XSS o desbordamientos.

---

## Fase 5 — Review in 5 Axes (Revisión de Código Senior)

**Objetivo:** Auditar exhaustivamente la solución bajo los **5 ejes de calidad senior**:

1. **Correctitud (Correctness):**
   - ¿Cumple al 100% los criterios de aceptación de la Fase 1?
   - ¿Se contemplan casos límite (entradas nulas, listas vacías, desconexiones de red, errores 4xx/5xx)?
2. **Legibilidad (Readability):**
   - ¿El código es autodocumentado? ¿Los nombres de funciones y variables expresan claramente su intención de negocio?
3. **Arquitectura (Architecture):**
   - ¿Respeta la separación de responsabilidades y la modularidad del proyecto?
   - ¿Introduce acoplamientos innecesarios o dependencias pesadas?
4. **Seguridad (Security):**
   - ¿Cumple con los principios de OWASP (autenticación, autorización de roles, escape de entradas, manejo seguro de sesiones)?
5. **Rendimiento (Performance):**
   - ¿Hay consultas N+1 en bases de datos?
   - ¿Hay re-renders innecesarios, fugas de memoria o ciclos asíncronos sin timeout?

### Clasificación de Hallazgos:
* **[🔴 CRÍTICO]** (Bloquea la entrega. Defecto de seguridad, regresión grave o pérdida de datos).
* **[🟡 REQUERIDO]** (Debe resolverse antes de considerar la tarea terminada. Violación de arquitectura o falta de cobertura).
* **[🟢 OPCIONAL]** (Mejora técnica no bloqueante).
* **[⚪ NIT]** (Detalle menor de formato o estilo).

---

## Fase 6 — Ship & Rollback Plan (Cierre y Entrega Segura)

**Objetivo:** Garantizar un pase a producción controlado, reversible y trazable.

### Protocolo:
1. **Dictamen Formal:** Emitir dictamen explícito: **GO** o **NO-GO**.
   - Si existe algún hallazgo *Crítico* o *Requerido* pendiente, el veredicto es estrictamente **NO-GO**.
2. **Plan de Reversión (*Rollback Plan*):**
   - Señales de alerta: ¿Qué métricas o logs indicarían una falla tras el despliegue?
   - Pasos exactos para revertir (e.g. `git revert <hash>`, migración de reversión en BD o rollback de imagen Docker).
3. **Commits Limpios y Atómicos:**
   - Utilizar el estándar de *Conventional Commits*:
     - `feat:` para nuevas funcionalidades.
     - `fix:` para correcciones de bugs.
     - `refactor:` para cambios de estructura sin cambio de comportamiento.
     - `test:` para adición o ajuste de pruebas.
4. **Informe de Entrega:**
   - Presentar un resumen ejecutivo con:
     - Archivos creados / modificados.
     - Pruebas ejecutadas y su resultado.
     - Instrucciones para que el usuario o equipo pruebe el cambio localmente.
