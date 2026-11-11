---
name: brandingwork
description: Pipeline universal de diseño de producto y branding FigCraft-first con auditoría adversarial Elephanfish (Google Elephant-Goldfish Model / EGM). Diseña y audita en FigCraft ANTES de tocar código y ejecuta auditoría visual fría sin sesgo. Activar con "ejecútalo con brandingwork", "brandingwork" o "ejecutalo con brandingwork".
---

# 🎨 brandingwork — Pipeline Universal de Branding FigCraft-First & Elephanfish (EGM)

Cuando el usuario indique **"ejecútalo con brandingwork"** (o "brandingwork" / "ejecutalo con brandingwork"), asume el rol de **Design Systems Lead & Principal Product Designer** y ejecuta rigurosamente este pipeline de 6 fases.

Este pipeline combina:
1. **Enfoque FigCraft-First:** Prohibido programar pantallas en código sin antes haber creado, exportado y aprobado el board visual en **FigCraft**.
2. **Metodología Elephanfish (EGM):** Basada en el framework de código abierto de Google (`google/elephant-goldfish-model`), separa al **Elefante** (el agente constructor con contexto) del **Pez Dorado / Goldfish** (un subagente efímero sin sesgo que audita de forma fría y adversarial las capturas visuales reales).

```
  FASE 0         FASE 1         FASE 2         FASE 3         FASE 4         FASE 5         FASE 6
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ SOURCES  │──▶│ STRATEGY │──▶│ IDEATION │──▶│ FIGCRAFT │──▶│ CODE UI  │──▶│ EGM FISH │──▶│ SHIP     │
│ Tokens   │   │ System   │   │ Stitch   │   │ Board 1st│   │ Frontend │   │ Aud. Fria│   │ Delivery │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## Fase 0 — Fuentes de Verdad de Marca (Obligatorio)

Antes de proponer o generar cualquier activo:
1. **Lectura de Tokens y Guías:**
   - Buscar y leer el archivo de diseño del proyecto (`DESIGN.md` en la raíz o en carpeta de diseño).
   - Leer tokens estructurados si existen (e.g. `brand-tokens.json` o variables CSS).
2. **Inspección del Logotipo Oficial:**
   - Localizar el archivo de logo oficial en el proyecto (e.g., en `assets/`, `public/` o `brand-workspace/assets-in/`).
   - **Regla Inmutable:** Utilizar el archivo de imagen oficial tal cual. Prohibido redibujar el logo con formas geométricas arbitrarias, cambiar tipografías del isotipo o desarmar el lockup oficial.
3. **Tipografías del Sistema:**
   - Identificar las fuentes declaradas en el proyecto (Display/Títulos, Sans/Cuerpo, Mono/Datos).
   - Verificar que se carguen correctamente con sus fallbacks correspondientes.
4. **Líneas de Servicio y Restricciones de Copy:**
   - Identificar la paleta semántica y el tono de voz de la marca (formal, técnico, audaz, sobrio).

---

## Fase 1 — Estrategia y Sistema de Tokens

1. **Jerarquía Visual y Accesibilidad:**
   - Validar que todos los colores principales y de superficie cumplan con el ratio de contraste **WCAG 2.2 AA (mínimo 4.5:1 para texto normal y 3:1 para elementos gráficos/interactivos)**.
2. **Escala de Espaciado y Radios:**
   - Definir escala consistente de espaciado (múltiplos de 4px / 8px).
   - Mantener coherencia en el lenguaje de bordes redondeados (sharp, soft, rounded).
3. **Sincronización:**
   - Si se ajusta algún color o token, documentarlo inmediatamente en `DESIGN.md` antes de continuar.

---

## Fase 2 — Ideación y Exploración de UI (Opcional)

1. **Exploración Generativa:**
   - Si se cuenta con herramientas generativas (como **Google Stitch MCP**), sincronizar `DESIGN.md` para generar variantes conceptuales de pantallas desktop y mobile.
2. **Selección del Enfoque:**
   - Evaluar las variantes y definir la composición definitiva que mejor responda a los requerimientos del usuario.

---

## Fase 3 — Diseño FigCraft-First (OBLIGATORIO antes de Código)

> [!CAUTION]
> **Prohibido saltar esta fase:** Ningún archivo `.tsx`, `.jsx`, `.html` o `.css` se modifica sin tener primero el board visual aprobado en FigCraft.

1. **Construcción de Boards:**
   - Utilizar las herramientas de **FigCraft** (o herramienta de maquetado vectorial local) para construir los boards de diseño:
     - Versión Desktop: resolución base `1440 x 900 px`.
     - Versión Móvil: resolución base `390 x 844 px`.
   - Incorporar el logotipo oficial, paleta de colores, tipografías y componentes reales con datos verídicos (no lorem ipsum genérico).
2. **Exportación e Inspección Previa:**
   - Exportar los boards a imágenes PNG/JPG en la carpeta de auditoría (e.g., `brand-workspace/deliverables/audit/`).
   - Inspeccionar la imagen: verificar alineaciones, padding de contenedores, legibilidad y ausencia de colisiones entre elementos.
3. **Persistencia:**
   - Guardar el archivo fuente de diseño (e.g. `.figcraft`) como la fuente única de verdad para los desarrolladores.

---

## Fase 4 — Implementación en Código

Una vez aprobado el board en FigCraft:
1. **Traslado Fiel al Frontend:**
   - Trasladar el diseño exactamente al framework del proyecto (Next.js, React, Vue, Svelte, Tailwind CSS o estilos nativos).
   - Respetar los espaciados, colores de token y jerarquía tipográfica definidos en el board de FigCraft.
2. **Componentes Oficiales de Marca:**
   - Emplear componentes de marca centralizados para logos y botones principales, evitando estilos inline dispersos.
3. **Compilación y Linters:**
   - Ejecutar la verificación estricta de tipos y linters del proyecto:
     ```bash
     npm run lint && npx tsc --noEmit
     ```

---

## Fase 5 — Auditoría Multimodal Cerrada con Elephanfish (EGM)

Para erradicar el **sesgo de confirmación** del agente que construyó la interfaz (el Elefante), la auditoría se delega a un **subagente efímero sin memoria histórica (el Goldfish)** bajo el estándar de `google/elephant-goldfish-model`:

```
   AGENTE CONSTRUCTOR (Elefante)                  SUBAGENTE AUDITOR (Goldfish)
┌─────────────────────────────────┐            ┌────────────────────────────────┐
│  • Conoce el historial de chat  │            │  • Cero memoria de la charla   │
│  • Construyó el código y board  │──Captura──▶│  • Solo recibe reglas + imagen │
│  • Captura con Playwright/Tool  │            │  • Auditoría visual adversarial│
└─────────────────────────────────┘            └────────────────────────────────┘
                 ▲                                              │
                 │                                      Drift Report (PASS/FAIL)
                 │                                              │
                 └──────────── Corregir si es FAIL ─────────────┘
```

### Protocolo Elephanfish:
1. **Captura Real Multimodal:**
   - Tomar capturas de pantalla reales de la interfaz renderizada en el navegador (desktop 1440px y móvil 390px) mediante Playwright, Puppeteer o herramienta de captura.
2. **Invocación del Subagente Goldfish (Stateless Auditor):**
   - Lanzar un subagente efímero (vía `invoke_subagent` o sesión aislada) con el rol de **Auditor Visual Adversarial**.
   - **Aislamiento Estricto:** El Goldfish recibe **exclusivamente**:
     - Las capturas del navegador y el board de FigCraft original.
     - Las reglas de diseño inmutables (`DESIGN.md`): contraste WCAG AA, uso exacto del logo, tipografías y espaciado.
     - **CERO historial de conversación previa** para garantizar un juicio objetivo e imparcial.
3. **Emisión del EGM Drift Report:**
   - El Goldfish evalúa la imagen píxel a píxel y emite su reporte formal:
     - **Veredicto:** `[PASS]` o `[FAIL]`.
     - Lista de discrepancias visuales, textos con bajo contraste o elementos desalineados.
4. **Bucle Cerrado de Corrección:**
   - Si el veredicto es `FAIL`, el Elefante (agente constructor) **debe corregir el código CSS/HTML inmediatamente** y volver a someterlo a la auditoría del Goldfish hasta obtener un `PASS` limpio.

---

## Fase 6 — Cierre y Trazabilidad

1. **Generación del Artefacto de Entrega:**
   - Crear un informe de entrega de marca (e.g. `brandingwork_entrega.md`) que incluya:
     - Comparativa visual: Board FigCraft vs Implementación Real en Navegador.
     - Certificación del reporte `EGM Drift Report` en estado `PASS`.
     - Archivos y componentes creados o modificados.
     - Verificaciones de linting y accesibilidad superadas.
2. **Commits de Marca:**
   - Realizar commits atómicos con Conventional Commits (e.g. `style(brand): implement updated hero section from figcraft board`).
