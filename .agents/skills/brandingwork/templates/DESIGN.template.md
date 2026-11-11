# 🎨 DESIGN.md — Especificación del Sistema de Diseño y Marca

Este documento es la fuente de verdad visual para la aplicación. Ningún componente debe apartarse de estos tokens.

---

## 1. Identidad y Filosofía Visual
- **Nombre de Marca:** [Nombre del Proyecto / Empresa]
- **Estilo Visual:** [e.g. Dark Immersive / Clean Minimalist / Enterprise Professional]
- **Tono de Voz:** [e.g. Técnico, Confiable, Seguro, Moderno]

---

## 2. Paleta de Colores (Tokens)

| Rol Semántico | Token CSS / Variable | Código HEX | Ratio Contraste WCAG |
| :--- | :--- | :--- | :--- |
| **Fondo Principal (Background)** | `--bg-primary` | `#0B0F17` | Base |
| **Superficie / Tarjetas (Surface)** | `--bg-surface` | `#161F2E` | 1.3:1 sobre fondo |
| **Color Primario (Brand/Accent)** | `--color-primary` | `#6366F1` | 4.6:1 (AA) sobre fondo |
| **Color Secundario** | `--color-secondary` | `#06B6D4` | 7.2:1 (AAA) sobre fondo |
| **Texto Principal** | `--text-primary` | `#F8FAFC` | 15.5:1 (AAA) |
| **Texto Secundario (Muted)** | `--text-muted` | `#94A3B8` | 5.8:1 (AA) |
| **Éxito (Success)** | `--color-success` | `#10B981` | 6.1:1 (AA) |
| **Error / Peligro (Destructive)** | `--color-error` | `#EF4444` | 4.8:1 (AA) |

---

## 3. Tipografía

- **Títulos / Display:** `[e.g. Archivo, Inter, Poppins, Outfit]` (Weights: 600 SemiBold, 700 Bold)
- **Cuerpo / Textos:** `[e.g. Geist, Inter, Roboto]` (Weights: 400 Regular, 500 Medium)
- **Código / Telemetría:** `[e.g. Geist Mono, JetBrains Mono]` (Weight: 400 Regular)

### Escala Modular:
- `text-xs`: 12px (0.75rem)
- `text-sm`: 14px (0.875rem)
- `text-base`: 16px (1rem)
- `text-lg`: 18px (1.125rem)
- `text-xl`: 20px (1.25rem)
- `text-2xl`: 24px (1.5rem)
- `text-4xl`: 36px (2.25rem)

---

## 4. Reglas Inmutables del Logotipo

1. **Uso del Archivo Oficial:** Utilizar siempre el archivo en su ruta oficial (e.g. `assets/logo.png` o componente `<BrandLogo />`).
2. **Prohibido aislar o alterar el isotipo:** No separar el símbolo gráfico de la tipografía a menos que la guía de marca lo permita explícitamente en modo ícono.
3. **Zona de Seguridad:** Mantener un margen libre equivalente a la mitad de la altura del logo a su alrededor.
4. **Fondo:** Colocar únicamente sobre fondos con contraste adecuado.

---

## 5. Espaciado y Radios de Borde
- **Border Radius:**
  - Botones / Inputs: `8px` (`rounded-lg`)
  - Tarjetas / Modales: `16px` (`rounded-2xl`)
- **Espaciado:** Cuadrícula base de 4px (padding: 4, 8, 12, 16, 24, 32px).
