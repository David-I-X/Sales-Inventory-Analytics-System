# 🎨 DESIGN.md — Especificación del Sistema de Diseño y Marca: **Vertical**

Este documento es la fuente única de verdad visual para **Vertical**. Ningún componente, pantalla o board de diseño debe apartarse de estos tokens y reglas.

---

## 1. Identidad, Posicionamiento y Filosofía Visual

- **Nombre Oficial de Marca:** **Vertical** (uso exclusivo en logotipo, header, sidebar y título de aplicación).
  - *Descriptores externos permitidos únicamente en subtítulos o landing:* `Vertical OS` / `Vertical ERP`.
- **Propuesta de Valor:** Panel de control predictivo para PyMEs colombianas en crecimiento (comercio, distribución, retail y servicios técnicos) que unifica CRM, inventarios, facturación electrónica DIAN/Factus y proyecciones de Machine Learning en una interfaz sin fricción.
- **Estilo Visual:** **Bimodal Equilibrado (Ultra-Clean Monochrome)**.
  - **Light Mode (Default Operativo):** Superficies `#FFFFFF` / `#FAFAFA` diseñadas para jornadas extensas de tablas, conciliación contable y facturación DIAN.
  - **Dark Mode (Alta Ingeniería):** Superficies `#09090B` / `#111114` estilo Linear/Raycast con bordes finos de `1px` y **cero sombras pesadas**.
- **Tono de Voz:** Sobrio, directo y confiable (estilo Linear / Stripe). Microcopy corto, accionable y preciso en procesos críticos de facturación electrónica y analítica predictiva.

### Regla de Oro de Composición (`85 / 10 / 5`)
- **85%** superficies blancas o grises neutros (escala Zinc).
- **10%** tipografía y bordes estructurales de `1px` (`border-subtle` / `border-strong`).
- **5% máximo** distribuido entre el **Verde Esmeralda** (acciones principales y énfasis de marca) y el **Violeta Índigo** (insights y proyecciones del motor ML).

---

## 2. Paleta de Colores (Tokens) & Auditoría WCAG 2.2 AA

> [!IMPORTANT]
> Todos los pares texto/fondo han sido auditados matemáticamente para cumplir **WCAG 2.2 AA** ($\ge 4.5:1$ en texto normal y $\ge 3.0:1$ en elementos gráficos/interactivos).

### 2.1 Light Mode (Default Operativo)

| Rol Semántico | Token CSS | Código HEX | Uso Permitido | Contraste Verificado |
| :--- | :--- | :--- | :--- | :--- |
| **Fondo Principal (Canvas)** | `--bg-canvas` | `#FFFFFF` | Fondo de página y tablas principales | Base |
| **Superficie (Surface)** | `--bg-surface` | `#FAFAFA` | Sidebar, header y tarjetas KPI | `1.04:1` estructural |
| **Superficie Sutil** | `--bg-subtle` | `#F4F4F5` | Hover de filas, inputs secundarios, encabezados tabla | `1.09:1` estructural |
| **Borde Sutil** | `--border-subtle` | `#E4E4E7` | Divisores `1px` de tarjetas y tablas | Estructural |
| **Borde Fuerte** | `--border-strong` | `#D4D4D8` | Bordes de inputs y controles interactivos | Estructural |
| **Texto Principal** | `--text-primary` | `#09090B` | Títulos, cifras KPI y texto primario | `19.90:1` (**AAA**) sobre `#FFFFFF` |
| **Texto Secundario** | `--text-secondary` | `#52525B` | Etiquetas de formulario, subtítulos y celdas secundarias | `7.73:1` (**AAA**) sobre `#FFFFFF` |
| **Texto Atenuado (Muted)** | `--text-muted` | `#63636E` | Placeholders, timestamps, metadatos *(ajustado desde `#71717A` para cumplir AA sobre `#F4F4F5`)* | `5.40:1` (**AA**) sobre `#F4F4F5` / `5.93:1` sobre `#FFFFFF` |
| **Brand Accent (Gráficos/Bordes)** | `--brand-primary` | `#059669` | Íconos activos, indicadores de navegación, foco | `3.77:1` (**AA UI/Gráficos** $\ge 3:1$) |
| **Brand Solid (Botón Primario)** | `--brand-solid` | `#047857` | Relleno sólido de botones primarios con texto `#FFFFFF` y links esmeralda | `5.48:1` (**AA**) con `#FFFFFF` |
| **Brand Hover** | `--brand-primary-hover` | `#065F46` | Estado hover de botón primario sólido | `7.29:1` (**AAA**) con `#FFFFFF` |
| **Brand Subtle** | `--brand-subtle` | `#ECFDF5` | Fondo de ítem activo en sidebar y badges DIAN | Base badge |
| **Brand Border** | `--brand-border` | `#A7F3D0` | Borde fino `1px` para highlights de marca | Estructural |
| **Motor ML (Accent)** | `--ml-accent` | `#7C3AED` | Gráficas predictivas, chips de IA y Lead Scoring | `5.70:1` (**AA**) sobre `#FFFFFF` y con `#FFFFFF` |
| **Motor ML (Subtle)** | `--ml-subtle` | `#F5F3FF` | Fondo de tarjetas o banners de insights ML | Base badge ML |
| **DIAN / Éxito** | `--status-success-text` / `bg` | `#065F46` / `#ECFDF5` | Badges de factura validada DIAN (con borde `#A7F3D0`) | `7.29:1` (**AAA**) |
| **Advertencia / Stock Bajo** | `--status-warning-text` / `bg` | `#92400E` / `#FFFBEB` | Alertas de stock mínimo o pendiente de envío | `6.84:1` (**AA**) |
| **Error / Riesgo** | `--status-danger-text` / `bg` | `#991B1B` / `#FEF2F2` | Errores de validación, rechazo DIAN o Churn Risk | `7.60:1` (**AAA**) |

### 2.2 Dark Mode (Alta Ingeniería)

| Rol Semántico | Token CSS | Código HEX / Alpha | Uso Permitido | Contraste Verificado |
| :--- | :--- | :--- | :--- | :--- |
| **Fondo Principal (Canvas)** | `--bg-canvas` | `#09090B` | Fondo base de la aplicación | Base |
| **Superficie (Surface)** | `--bg-surface` | `#111114` | Tarjetas KPI, sidebar y contenedores | Estructural |
| **Superficie Sutil** | `--bg-subtle` | `#18181B` | Hover de filas, encabezados de tabla | Estructural |
| **Borde Sutil** | `--border-subtle` | `#27272A` | Divisores `1px` de tarjetas y paneles | Estructural |
| **Borde Fuerte** | `--border-strong` | `#3F3F46` | Bordes de inputs y controles activos | Estructural |
| **Texto Principal** | `--text-primary` | `#FAFAFA` | Títulos, cifras KPI y texto primario | `19.06:1` (**AAA**) sobre `#09090B` |
| **Texto Secundario** | `--text-secondary` | `#A1A1AA` | Subtítulos, labels y texto secundario | `7.76:1` (**AAA**) sobre `#09090B` |
| **Texto Atenuado (Muted)** | `--text-muted` | `#8E8E98` | Metadatos y timestamps *(ajustado desde `#71717A` para superar `4.5:1` sobre `#18181B`)* | `5.46:1` (**AA**) sobre `#18181B` / `6.13:1` sobre `#09090B` |
| **Brand Accent / Solid** | `--brand-primary` | `#10B981` | Relleno de botones primarios, íconos y énfasis | `7.84:1` (**AAA**) sobre `#09090B` |
| **Texto sobre Botón Brand** | `--brand-on-primary` | `#09090B` | **OBLIGATORIO** dentro de botones `#10B981` *(nunca `#FFFFFF` = 2.54:1 FAIL)* | `7.84:1` (**AAA**) |
| **Brand Hover** | `--brand-primary-hover` | `#34D399` | Hover de botón primario y texto esmeralda en dark | `10.35:1` (**AAA**) sobre `#09090B` |
| **Brand Subtle** | `--brand-subtle` | `rgba(16, 185, 129, 0.12)` | Fondo de ítem activo en sidebar y badges DIAN | `8.34:1` (**AAA**) con texto `#34D399` |
| **Brand Border** | `--brand-border` | `rgba(16, 185, 129, 0.28)` | Borde fino `1px` en badges e ítems activos | Estructural |
| **Motor ML (Accent)** | `--ml-accent` | `#8B5CF6` | Líneas de predicción ML, íconos y acentos | `4.70:1` (**AA**) sobre `#09090B` |
| **Motor ML (Texto Dark)** | `--ml-text` | `#C4B5FD` | Texto de badges/insights ML sobre `--ml-subtle` | `9.30:1` (**AAA**) |
| **Motor ML (Subtle)** | `--ml-subtle` | `rgba(139, 92, 246, 0.12)` | Fondo de badges y bloques predictivos IA | Base badge ML |

### 2.3 Regla de Diferenciación: Acciones Primarias vs. Estados DIAN vs. Motor ML
1. **Botones de Acción Primaria:** Usan relleno sólido Esmeralda (`--brand-solid` `#047857` con texto `#FFFFFF` en Light; `--brand-primary` `#10B981` con texto `#09090B` en Dark).
2. **Validaciones DIAN / Factus:** Usan **badges sutiles** con borde fino (`1px solid var(--brand-border)`), fondo translúcido (`--status-success-bg` / `--brand-subtle`), texto de alto contraste (`#065F46` en Light / `#34D399` en Dark) e ícono de verificación. Nunca usan relleno sólido saturado.
3. **Motor ML & IA:** Reservado estrictamente al **Violeta Índigo** (`#7C3AED` en Light / `#8B5CF6` y `#C4B5FD` en Dark) para curvas de pronóstico, scores de probabilidad y alertas inteligentes.

---

## 3. Tipografía y Regla Numérica

- **Interfaz y Encabezados (Sans):** `'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
  - Pesos: `400 Regular`, `500 Medium`, `600 SemiBold`, `700 Bold`.
  - Tracking en títulos (`h1`/`h2`): `-0.025em` (`tracking-tight`).
- **Datos Financieros y Telemetría (Mono):** `'Geist Mono', 'JetBrains Mono', monospace`
  - Pesos: `400 Regular`, `500 Medium`, `600 SemiBold`.
  - **Regla Obligatoria (`tabular-nums`):** Toda cifra en pesos colombianos (`$ 14.850.000`), porcentaje de margen (`+18.4%`), cantidad de inventario, SKU o código CUFE debe aplicar:
    ```css
    font-family: 'Geist Mono', monospace;
    font-variant-numeric: tabular-nums;
    ```

### Escala Modular
- `text-xs`: `12px` (`0.75rem`) — Badges, metadatos, timestamps, ejes de gráfica.
- `text-sm`: `14px` (`0.875rem`) — Celdas de tabla, ítems de navegación, botones.
- `text-base`: `16px` (`1rem`) — Cuerpo de lectura general.
- `text-lg`: `18px` (`1.125rem`) — Títulos de tarjetas y paneles.
- `text-xl`: `20px` (`1.25rem`) — Subtítulos de sección.
- `text-2xl`: `24px` (`1.5rem`) — Encabezado principal de vista (`Dashboard Ejecutivo`) y valores KPI.
- `text-3xl`: `30px` (`1.875rem`) — KPIs destacados de ingresos/proyección.

---

## 4. Reglas Inmutables del Logotipo

- **Concepto:** Isotipo geométrico modular compuesto por **tres barras verticales ascendentes** que, mediante alineación diagonal, construyen una **"V"** minimalista en monocromo puro (`#09090B` sobre claro / `#FAFAFA` sobre oscuro).
- **Archivos Oficiales (Fuente de Verdad):**
  - Lockup completo claro: `brand-workspace/assets-in/vertical-logo-light.svg`
  - Lockup completo oscuro: `brand-workspace/assets-in/vertical-logo-dark.svg`
  - Isotipo solo claro (sidebar colapsada / favicon): `brand-workspace/assets-in/vertical-mark-light.svg`
  - Isotipo solo oscuro: `brand-workspace/assets-in/vertical-mark-dark.svg`
  - Favicon adaptativo: `brand-workspace/assets-in/vertical-favicon.svg`
- **Reglas de Uso:**
  1. Utilizar exclusivamente los archivos oficiales o el componente centralizado `<BrandLogo />`. Prohibido sustituir el logo por íconos genéricos de librería (ej. `IconBuildingStore`).
  2. Mantener **monocromo puro** (`#09090B` o `#FAFAFA`) en el isotipo y wordmark. Prohibido colorear el isotipo en esmeralda o violeta dentro de la interfaz principal.
  3. **Zona de Seguridad:** Margen libre mínimo equivalente al `50%` de la altura del isotipo (`16px` en lockups estándar).
  4. **Tamaño Mínimo:** Isotipo solo $\ge 16\text{px}$; Lockup completo $\ge 24\text{px}$ de altura.

---

## 5. Espaciado, Bordes y Geometría

- **Cuadrícula Base:** Múltiplos de `4px` (`4, 8, 12, 16, 20, 24, 32px`).
- **Padding Estándar de Tarjetas:** `20px` (`p-5`) en desktop, `16px` (`p-4`) en móvil.
- **Border Radius:**
  - Badges / Tags: `6px` (`rounded-md`)
  - Botones / Inputs / Ítems Sidebar: `8px` (`rounded-lg`)
  - Tarjetas / Paneles / Modales: `12px` (`rounded-xl`)
- **Elevación y Bordes:**
  - Cero sombras pesadas (`box-shadow: none` en tarjetas estándar; la jerarquía se logra mediante `1px solid var(--border-subtle)` y contraste entre `--bg-canvas` y `--bg-surface`).
  - Sombras permitidas únicamente en popovers/dropdowns flotantes en Light Mode (`0 4px 12px rgba(9, 9, 11, 0.06)`).
