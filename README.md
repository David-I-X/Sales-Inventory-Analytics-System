# SaaS Vertical 🚀

[![CI/CD Pipeline](https://github.com/David-I-X/Sales-Inventory-Analytics-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/David-I-X/Sales-Inventory-Analytics-System/actions/workflows/deploy.yml)

Plataforma SaaS multi-tenant diseñada para la gestión empresarial: CRM, Facturación Electrónica DIAN con Factus API V2, Motor de Machine Learning (Lead Scoring y Forecast de Demanda), Contabilidad e Inventarios.

## 🛠️ Stack Tecnológico

- **Backend:** FastAPI, Python 3.11, SQLModel, Alembic, PostgreSQL 15
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Proxy Inverso:** Caddy (SSL automático / compresión)
- **CI/CD:** GitHub Actions (Deploy automático hacia Oracle Cloud)
- **Integraciones:** Factus API V2 (DIAN Colombia)

## 🚀 Despliegue Continuo (CI/CD)

Cada `git push` a la rama `main` ejecuta automáticamente:
1. **Validación:** Compilación y linting del frontend con TypeScript y Vite.
2. **Validación Backend:** Verificación de sintaxis de Python.
3. **Deploy:** Conexión SSH a Oracle Cloud, actualización del repositorio y recreación sin caída del contenedor backend.
