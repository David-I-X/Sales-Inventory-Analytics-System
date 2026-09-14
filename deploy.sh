#!/bin/bash
set -e

echo "=================================================="
echo "?? Iniciando despliegue de SaaS Vertical..."
echo "=================================================="

# 1. Actualizar repositorio si aplica
if [ -d ".git" ]; then
    echo "?? Actualizando código desde Git..."
    git pull origin main || true
fi

# 2. Levantar y compilar contenedores en segundo plano
echo "?? Levantando contenedores Docker..."
docker compose -f docker-compose.prod.yml up -d --build

# 3. Esperar que PostgreSQL esté listo
echo "? Esperando inicio de la base de datos..."
sleep 6

# 4. Sembrar datos iniciales si la base de datos está vacía (tenant demo)
echo "?? Inicializando tenant demo..."
docker compose -f docker-compose.prod.yml exec -T backend python seed_demo.py || true

echo "=================================================="
echo "? Despliegue completado exitosamente!"
echo "?? Abre en tu navegador: http://$(curl -s ifconfig.me)"
echo "=================================================="
