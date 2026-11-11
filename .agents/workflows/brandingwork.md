---
name: brandingwork
description: Pipeline universal de diseño de producto y branding FigCraft-first con auditoría adversarial Elephanfish (EGM).
---

# Workflow: brandingwork

Ejecuta rigurosamente el pipeline universal de diseño y branding definido en `.agents/skills/brandingwork/SKILL.md`:

```
  FASE 0         FASE 1         FASE 2         FASE 3         FASE 4         FASE 5         FASE 6
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ SOURCES  │──▶│ STRATEGY │──▶│ IDEATION │──▶│ FIGCRAFT │──▶│ CODE UI  │──▶│ EGM FISH │──▶│ SHIP     │
│ Tokens   │   │ System   │   │ Stitch   │   │ Board 1st│   │ Frontend │   │ Aud. Fria│   │ Delivery │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

1. **Fase 0 - Fuentes de Verdad de Marca:** Lectura de tokens y guías de diseño en `DESIGN.md`.
2. **Fase 1 - Estrategia y Sistema de Tokens:** Jerarquía visual, contraste WCAG 2.2 AA (mínimo 4.5:1), escala de espaciado y radios.
3. **Fase 2 - Ideación y Wireframing:** Bocetos y variantes antes de implementación.
4. **Fase 3 - FigCraft Board First:** Prohibido programar pantallas en código sin antes haber creado y aprobado el board visual en FigCraft (desktop 1440px y móvil 390px).
5. **Fase 4 - Implementación Frontend:** Trasladar el board aprobado a código limpio en React / Tailwind / CSS tokens.
6. **Fase 5 - Auditoría Adversarial Elephanfish (Goldfish):** Invocar un subagente efímero sin sesgo para auditar capturas de pantalla reales contra las reglas visuales y tokens.
7. **Fase 6 - Ship & Delivery:** Aprobación formal PASS y reporte de conformidad.
