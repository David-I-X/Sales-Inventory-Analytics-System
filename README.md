# Sistema de Análisis de Ventas y Gestión de Inventarios

Este proyecto es una práctica individual que tiene como objetivo desarrollar un sistema de análisis de ventas y gestión de inventarios utilizando herramientas de Microsoft como SQL Server, SSIS, SSAS, Power BI, SSRS y Power Apps. Los datos utilizados son ficticios o tomados de un dataset público, y el sistema simula un entorno empresarial para fines de aprendizaje.

## Objetivos del Proyecto

1. **Práctica de Herramientas**: Utilizar SQL Server, SSIS, SSAS, Power BI, SSRS y Power Apps en un proyecto integral.
2. **Análisis de Datos**: Crear un sistema que permita analizar ventas y gestionar inventario.
3. **Visualización y Reportes**: Desarrollar dashboards interactivos en Power BI y reportes automatizados en SSRS.
4. **Aplicación Móvil**: Crear una aplicación en Power Apps para registrar ventas y consultar inventario.

## Herramientas Utilizadas

- **SQL Server**: Para la base de datos y el Datawarehouse.
- **SSIS (SQL Server Integration Services)**: Para el proceso ETL (Extracción, Transformación y Carga).
- **SSAS (SQL Server Analysis Services)**: Para el análisis multidimensional.
- **Power BI**: Para la visualización de datos y dashboards interactivos.
- **SSRS (SQL Server Reporting Services)**: Para la generación de reportes estáticos.
- **Power Apps**: Para la aplicación de registro de ventas y consulta de inventario.

## Arquitectura del Sistema

El sistema sigue una arquitectura completa que integra todas las herramientas mencionadas. A continuación, se describe el flujo de datos:

1. **Extracción de Datos**: Los datos ficticios o de un dataset público se cargan en archivos CSV o una base de datos temporal.
2. **Transformación y Carga (ETL)**: Los datos se limpian, transforman y cargan en el Datawarehouse en SQL Server utilizando SSIS.
3. **Almacenamiento en Datawarehouse**: Los datos se estructuran en tablas de hechos (ventas) y dimensiones (productos, clientes, tiempo).
4. **Análisis Multidimensional**: Se crea un modelo multidimensional en SSAS para análisis avanzados.
5. **Visualización de Datos**: Power BI se conecta al Datawarehouse o a SSAS para crear dashboards interactivos.
6. **Generación de Reportes**: SSRS se conecta al Datawarehouse para generar reportes estáticos.
7. **Aplicación de Registro de Ventas**: Power Apps se conecta directamente a SQL Server para permitir el registro de ventas y la consulta de inventario.

### Diagrama de Flujo

```
[Datos Ficticios o Dataset] 
        ↓
     [SSIS] (ETL: Extracción, Transformación, Carga)
        ↓
[SQL Server] (Datawarehouse: Tablas de Hechos y Dimensiones)
        ↓
     [SSAS] (Modelo Multidimensional para Análisis)
        ↓
   [Power BI] (Dashboards Interactivos)
        ↓
    [SSRS] (Reportes Estáticos)
        ↓
 [Power Apps] (Aplicación de Registro de Ventas)
```

## Pasos para Ejecutar el Proyecto

1. **Configurar SQL Server y Crear el Datawarehouse**:
   - Instalar SQL Server.
   - Crear la base de datos para el Datawarehouse.
   - Diseñar las tablas de hechos (ventas) y dimensiones (productos, clientes, tiempo).

2. **Implementar el Proceso ETL con SSIS**:
   - Crear un paquete SSIS para extraer datos de un archivo CSV o dataset.
   - Transformar los datos (limpieza, conversión de formatos, etc.).
   - Cargar los datos en el Datawarehouse.

3. **Crear el Modelo Multidimensional en SSAS**:
   - Configurar SSAS.
   - Crear un cubo OLAP con medidas (ventas, inventario) y dimensiones (productos, clientes, tiempo).

4. **Conectar Power BI al Datawarehouse o SSAS**:
   - Crear dashboards interactivos en Power BI.
   - Visualizar KPIs como ventas por región, niveles de inventario, etc.

5. **Generar Reportes con SSRS**:
   - Diseñar reportes estáticos en SSRS.
   - Configurar la distribución automática de reportes (opcional).

6. **Desarrollar la Aplicación en Power Apps**:
   - Crear una aplicación sencilla en Power Apps.
   - Conectar la aplicación a SQL Server para registrar ventas y consultar inventario.

## Requisitos

- **SQL Server**: Instalado y configurado.
- **SSIS, SSAS, SSRS**: Instalados y configurados.
- **Power BI**: Instalado y configurado.
- **Power Apps**: Cuenta de Microsoft para desarrollar la aplicación.

## Datos Utilizados

Los datos son ficticios o tomados de un dataset público. Puedes generar datos ficticios utilizando herramientas como [Mockaroo](https://mockaroo.com/) o descargar datasets de plataformas como [Kaggle](https://www.kaggle.com/).

## Contribuciones

Este proyecto es una práctica individual, pero si deseas contribuir o hacer sugerencias, ¡no dudes en contactarme!

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
