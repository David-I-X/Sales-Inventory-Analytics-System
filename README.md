# SaaS Vertical 🚀

Plataforma SaaS multi-tenant diseñada para la gestión empresarial: CRM, Facturación Electrónica DIAN con Factus API V2, Motor de Machine Learning (Lead Scoring y Forecast de Demanda), Contabilidad e Inventarios.

## 🛠️ Stack Tecnológico

- **Backend:** FastAPI, Python 3.11, SQLModel, Alembic, PostgreSQL 15
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Proxy Inverso:** Caddy (SSL automático / compresión)
- **CI/CD:** GitHub Actions (Deploy automático hacia Oracle Cloud)
- **Integraciones:** Factus API V2 (DIAN Colombia)

## 🚀 Despliegue

El despliegue está automatizado mediante GitHub Actions en cada push a `main`.

Para ejecutar localmente con Docker Compose:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
