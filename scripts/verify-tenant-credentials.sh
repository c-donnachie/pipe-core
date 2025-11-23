#!/bin/bash

# Script para verificar credenciales de un tenant
# Uso: ./scripts/verify-tenant-credentials.sh <tenant_id> [api_key] [api_secret]

set -e

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

TENANT_ID=$1
API_KEY=$2
API_SECRET=$3

if [ -z "$TENANT_ID" ]; then
  echo "❌ ERROR: Debes proporcionar el tenant_id"
  echo "Uso: ./scripts/verify-tenant-credentials.sh <tenant_id> [api_key] [api_secret]"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL no está configurada"
  exit 1
fi

echo "🔍 Verificando credenciales del tenant: $TENANT_ID"
echo ""

# Consultar tenant
psql "$DATABASE_URL" <<EOF
SELECT 
    tenant_id,
    api_key,
    LEFT(api_secret, 30) || '...' as api_secret_preview,
    status,
    created_at
FROM tenants
WHERE tenant_id = '$TENANT_ID';
EOF

echo ""

if [ -n "$API_KEY" ] && [ -n "$API_SECRET" ]; then
  echo "🔐 Verificando credenciales..."
  
  # Verificar si las credenciales coinciden
  RESULT=$(psql "$DATABASE_URL" -t -c "
    SELECT 
      CASE 
        WHEN api_key = '$API_KEY' AND api_secret = '$API_SECRET' AND status = 'active' 
        THEN 'VALID'
        ELSE 'INVALID'
      END as validation
    FROM tenants
    WHERE tenant_id = '$TENANT_ID';
  " | xargs)

  if [ "$RESULT" = "VALID" ]; then
    echo "✅ Credenciales válidas"
  else
    echo "❌ Credenciales inválidas o tenant inactivo"
    
    # Mostrar qué está mal
    psql "$DATABASE_URL" -t -c "
      SELECT 
        CASE WHEN api_key = '$API_KEY' THEN '✅' ELSE '❌' END || ' API Key',
        CASE WHEN api_secret = '$API_SECRET' THEN '✅' ELSE '❌' END || ' API Secret',
        CASE WHEN status = 'active' THEN '✅' ELSE '❌' END || ' Status'
      FROM tenants
      WHERE tenant_id = '$TENANT_ID';
    "
  fi
fi

