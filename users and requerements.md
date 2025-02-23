# Requisitos del Proyecto: Sistema de Análisis de Ventas y Gestión de Inventarios

## Usuarios y Requisitos

### 1. Gerencia
- **Dashboard de Ventas**:
  - Ventas totales por mes, trimestre y año.
  - Ventas por región y categoría de producto.
  - Margen de beneficio por producto.
- **Reportes Automatizados**:
  - Reporte diario de ventas.
  - Reporte mensual de rentabilidad.

### 2. Equipo de Ventas
- **Dashboard de Ventas por Vendedor**:
  - Desempeño de cada vendedor.
  - Comparación de ventas por región.
- **Alertas**:
  - Notificaciones al alcanzar metas de ventas.

### 3. Equipo de Inventario
- **Dashboard de Inventario**:
  - Niveles de inventario en tiempo real.
  - Identificación de productos con bajo stock o sobrestock.
  - Rotación de inventario.
- **Alertas**:
  - Notificaciones de productos por agotarse.

### 4. Equipo de TI
- **Integración de Datos**:
  - Actualización automática de datos cada noche.
  - Escalabilidad y seguridad del sistema.
- **Soporte**:
  - Interfaz sencilla para solución de problemas técnicos.

## Requisitos Técnicos
- Base de datos en SQL Server.
- Proceso ETL con SSIS.
- Datawarehouse con tablas de hechos y dimensiones.
- Modelo multidimensional en SSAS.
- Dashboards interactivos en Power BI.
- Reportes estáticos en SSRS.
- Aplicación de registro de ventas en Power Apps.
