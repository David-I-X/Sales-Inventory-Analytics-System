# 📦 Entrega Oficial de Marca — `brandingwork` (**Vertical**)

- **Fecha:** 2026-11-12
- **Marca:** **Vertical** (`Vertical OS / Vertical ERP` como descriptor externo)
- **Estado de Certificación EGM:** **`PASS`** (ver [EGM_DRIFT_REPORT.md](file:///C:/Users/DAVID/Documents/sas-vertical/brand-workspace/deliverables/EGM_DRIFT_REPORT.md))

---

## 1. Fuentes de Verdad y Activos Creados (Fase 0 y Fase 1)

* **Especificación Maestra:** [DESIGN.md](file:///C:/Users/DAVID/Documents/sas-vertical/DESIGN.md)
* **Tokens W3C:** [brand-tokens.json](file:///C:/Users/DAVID/Documents/sas-vertical/brand-workspace/brand-tokens.json)
* **Logotipos Oficiales SVG (`brand-workspace/assets-in/` y `frontend/public/brand/`):**
  * `vertical-logo-light.svg` / `vertical-logo-dark.svg`
  * `vertical-mark-light.svg` / `vertical-mark-dark.svg`
  * `vertical-favicon.svg` (copiado a `frontend/public/favicon.svg`)

---

## 2. Comparativa Visual: Board de Referencia vs. Implementación Real en Navegador

| Vista | Board Aprobado (Fase 3) | Implementación Compilada (Fase 5) |
| :--- | :--- | :--- |
| **Brand Sheet (`1440×900`)** | `board-brand-sheet-1440x900.png` | N/A (Especificación base) |
| **Login Light (`1440×900`)** | Tokens Zinc + `<BrandLogo />` | `real-login-light-1440x900.png` |
| **Dashboard Desktop Light (`1440×900`)** | `board-desktop-light-1440x900.png` | `real-dashboard-desktop-light-1440x900.png` |
| **Dashboard Desktop Dark (`1440×900`)** | `board-desktop-dark-1440x900.png` | `real-dashboard-desktop-dark-1440x900.png` |
| **Dashboard Mobile Light (`390×844`)** | `board-mobile-light-390x844.png` | `real-dashboard-mobile-light-390x844.png` |

---

## 3. Archivos Creados / Modificados en Frontend (Fase 4)

* [frontend/index.html](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/index.html) — Idioma `es`, fuentes `Geist` + `Geist Mono`, favicon adaptativo y pre-inicialización de tema Light por defecto.
* [frontend/src/main.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/main.tsx) — Unificación de entrada CSS (`./styles/index.css`).
* [frontend/src/styles/index.css](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/styles/index.css) — Sistema completo de tokens bimodales Zinc + Esmeralda + Violeta ML en `:root` y `[data-theme='dark'], .dark`, `@layer base` limpio y `@custom-variant dark`.
* [frontend/src/styles/components.css](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/styles/components.css) — Componentes encapsulados en `@layer components` con bordes `1px`, cero sombras pesadas y tipografía `Geist Mono` `tabular-nums`.
* [frontend/src/components/brand/BrandLogo.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/components/brand/BrandLogo.tsx) — Componente centralizado oficial del isotipo y wordmark.
* [frontend/src/components/ui/ThemeToggle.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/components/ui/ThemeToggle.tsx) — Default operativo Light Mode + sincronización `data-theme` y clase `.dark`.
* [frontend/src/components/layout/Sidebar.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/components/layout/Sidebar.tsx) — Lockup oficial, secciones `Operación` / `Sistema` y drawer responsive móvil.
* [frontend/src/components/layout/Header.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/components/layout/Header.tsx) — Breadcrumb `Vertical / ...`, acceso móvil y CTA primario Esmeralda.
* [frontend/src/components/layout/AppLayout.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/components/layout/AppLayout.tsx) — Control de drawer móvil y layout limpio.
* [frontend/src/pages/Login.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/pages/Login.tsx) — Pantalla de acceso minimalista con `<BrandLogo />`.
* [frontend/src/pages/Dashboard.tsx](file:///C:/Users/DAVID/Documents/sas-vertical/frontend/src/pages/Dashboard.tsx) — KPIs tabulares, gráfica SVG Históricos vs. Proyección ML, Lead Scoring Predictivo y tabla de facturas DIAN/Factus.

---

## 4. Verificaciones Técnicas Superadas

* **`oxlint` (`npm run lint`):** `0 errors` (6 warnings preexistentes en `api.ts`, `Invoices.tsx`, `AuthContext.tsx`, `Quotes.tsx`, `Accounting.tsx`; 0 warnings en los archivos editados).
* **`tsc -b && vite build` (`npm run build`):** Compilación limpia sin errores (`../backend/app/static/spa/assets/index-BZ_JX7Sz.js`, `index-CTMWi36Y.css`).
* **Auditoría Elephanfish (Goldfish):** **`[PASS]`** en las 4 vistas reales (`Login`, `Desktop Light`, `Desktop Dark`, `Mobile 390×844`).


---

## Extensión de Entrega: Login & Onboarding (`codework` + `brandingwork`)

1. **Tablero FigCraft-Style & Auditoría Multimodal:**
   - Tablero maestro: `brand-workspace/deliverables/boards/vertical-login-board.html` (`1440×900` Light/Dark + `390×844` Mobile Light).
   - Certificación Goldfish Ronda 3 (`egm-brand-visual`): **`[PASS]`** (`0 BLOCKER`, `0 MAJOR`, `2 MINOR`) documentada en `brand-workspace/deliverables/EGM_DRIFT_REPORT.md`.

2. **Implementación Frontend (`frontend/`):**
   - `frontend/src/pages/Login.tsx`: Pantalla split B2B alineada a `DESIGN.md` con pestañas `Iniciar Sesión` / `Crear Empresa`, alternador de tema (`useTheme`), toggle mostrar/ocultar contraseña, checkbox accesible de persistencia (`Mantener sesión iniciada`) y botón único de autocompletado Demo (`admin@demo.com`).
   - `frontend/src/hooks/useTheme.ts` & `frontend/src/components/ui/ThemeToggle.tsx`: Hook compartido para tema bimodal (`light`/`dark`) sincronizado con `localStorage`, `data-theme` y `.dark`.
   - `frontend/src/services/tokenManager.ts`, `authService.ts`, `AuthContext.tsx`, `types/index.ts`, `components/layout/Sidebar.tsx`, `styles/components.css`: Persistencia selectiva (`localStorage`/`sessionStorage`), registro self-service de empresa (`signupCompany`), y nombre real de tenant (`tenant_name`) en el menú lateral.

3. **Corrección e Ingeniería Backend (`backend/`):**
   - Estandarización de datetimes timezone-aware (`get_utc_now()` / `datetime.now(timezone.utc)`) en modelos SQLModel (`user.py`, `tenant.py`, `contact.py`, `supplier.py`, `purchase.py`, `ml_alert.py`, `transaction.py`), `backend/app/core/auth.py` (`_ensure_utc`, búsqueda case-insensitive por email) y `backend/app/api/auth.py`, resolviendo el HTTP 500 en `refresh_tokens`.
   - Nuevo endpoint `POST /api/v1/auth/signup-company` + campo `tenant_name` en `GET /api/v1/auth/me` (`backend/app/schemas/user.py`, `backend/app/api/auth.py`).
   - Servicio seguro de activos estáticos raíz en `serve_spa` (`backend/app/main.py`) respetando rutas SPA.
   - Pruebas unitarias (`backend/tests/test_auth.py`, `test_modules_pure.py`, `test_quotes_pure.py`): `31 passed`.
