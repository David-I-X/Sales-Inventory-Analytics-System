# 📋 CONSTRAINTS.md — Restricciones de Calidad y Arquitectura del Proyecto

Este documento establece el contrato de calidad innegociable para este proyecto. Ningún cambio de código debe reducir estos umbrales ni saltarse estas restricciones.

---

## 1. Stack Tecnológico & Versiones
- **Lenguaje Principal:** [e.g. TypeScript 5.x / Python 3.12 / Go 1.22]
- **Framework:** [e.g. Next.js 15 / FastAPI / Express / React]
- **Base de Datos / ORM:** [e.g. PostgreSQL 16 con Prisma / SQLModel / SQLAlchemy]
- **Gestor de Paquetes:** [e.g. pnpm / npm / poetry / pip]

---

## 2. Puertas de Calidad (Quality Gates)
Antes de considerar cualquier tarea como completada, se deben ejecutar y pasar sin errores:

```bash
# 1. Chequeo de Tipos (cero advertencias o errores)
[Comando de tipos, e.g.: npx tsc --noEmit / mypy .]

# 2. Linter & Formato
[Comando de lint, e.g.: npm run lint / ruff check .]

# 3. Pruebas Unitarias & Integración
[Comando de tests, e.g.: npm test / pytest]
```

---

## 3. Restricciones de Arquitectura y Código
- **Prohibido silenciar el linter:** No se permiten `@ts-ignore`, `eslint-disable`, o comentarios `# noqa` sin una justificación documentada y aprobada.
- **Separación de Capas:** 
  - La lógica de negocio no debe vivir en controladores/rutas ni en componentes de interfaz.
  - Los esquemas de entrada/salida de la API deben ser independientes de los modelos de base de datos.
- **Seguridad:**
  - Todas las entradas de usuario deben validarse en el backend (Zod, Pydantic, etc.).
  - Prohibido dejar secretos, claves de API o tokens en código fuente.
- **Rendimiento:**
  - Evitar consultas N+1 en bases de datos mediante relaciones eager/joins adecuados.
  - No generar re-renders masivos ni fugas de memoria en suscripciones asíncronas.
