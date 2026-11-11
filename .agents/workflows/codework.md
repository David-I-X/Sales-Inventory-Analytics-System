---
name: codework
description: Pipeline universal de ingeniería de software senior (Staff / Principal) basado en Addy Osmani Agent Skills (Define -> Plan -> Build TDD -> Verify -> Review 5-Axis -> Ship).
---

# Workflow: codework

Ejecuta rigurosamente el pipeline universal de ingeniería de software senior definido en `.agents/skills/codework/SKILL.md`:

```
  FASE 0         FASE 1         FASE 2         FASE 3         FASE 4         FASE 5         FASE 6
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ ANALYZE  │──▶│ DEFINE   │──▶│ PLAN     │──▶│ BUILD    │──▶│ VERIFY   │──▶│ REVIEW   │──▶│ SHIP     │
│ Terreno  │   │ Spec/PRD │   │ Slices   │   │ TDD Loop │   │ Gates/QA │   │ 5-Axis   │   │ Go/No-Go │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

1. **Fase 0 - Epistémica y Análisis de Terreno:** Inspección de git status, stack tecnológico (FastAPI, React 19, Vite, PostgreSQL multi-tenant) y evaluación de riesgos.
2. **Fase 1 - Define & Clarify:** Criterios de aceptación claros (GIVEN / WHEN / THEN) antes de tocar código.
3. **Fase 2 - Plan & Constraints:** Desglose en vertical slices atómicas y dependencias.
4. **Fase 3 - Build Incremental & TDD:** Ciclo Red-Green-Refactor. Código de producción justificado por verificación previa.
5. **Fase 4 - Verify & Quality Gates:** Tests, linter y comprobaciones de compilación.
6. **Fase 5 - Review in 5 Axes:** Auditoría formal en Correctitud, Legibilidad, Arquitectura, Seguridad y Rendimiento.
7. **Fase 6 - Ship & Rollback:** Dictamen formal GO/NO-GO y plan de reversión.
