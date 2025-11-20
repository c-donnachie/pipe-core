#!/bin/bash

# Script para probar el registro de tenant
# Uso: ./scripts/test-register-tenant.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Prueba de Registro de Tenant${NC}\n"

# Verificar que SERVICE_ROLE_SECRET esté configurado
if [ -z "$SERVICE_ROLE_SECRET" ]; then
    echo -e "${RED}❌ ERROR: SERVICE_ROLE_SECRET no está configurado${NC}"
    echo -e "${YELLOW}Configúralo con:${NC}"
    echo "export SERVICE_ROLE_SECRET='tu_secreto_aqui'"
    echo ""
    echo "O agrégalo a tu archivo .env:"
    echo "SERVICE_ROLE_SECRET=tu_secreto_aqui"
    exit 1
fi

echo -e "${GREEN}✅ SERVICE_ROLE_SECRET configurado${NC}"
echo -e "${YELLOW}Token (primeros 10 caracteres): ${SERVICE_ROLE_SECRET:0:10}...${NC}\n"

# Verificar que el servidor esté corriendo
if ! curl -s http://localhost:3000/test > /dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: Servidor no está corriendo en localhost:3000${NC}"
    echo -e "${YELLOW}Inicia el servidor con:${NC}"
    echo "npm run start:dev"
    exit 1
fi

echo -e "${GREEN}✅ Servidor corriendo${NC}\n"

# Datos del tenant de prueba
TENANT_ID="roe"
API_KEY="pk_live_a8sd7f6"
API_SECRET="sk_live_9sd8f76f87df"

echo -e "${YELLOW}📝 Registrando tenant: ${TENANT_ID}${NC}\n"

# Realizar la petición
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/pipecore/internal/register-tenant \
  -H "Authorization: Bearer $SERVICE_ROLE_SECRET" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"apiKey\": \"$API_KEY\",
    \"apiSecret\": \"$API_SECRET\",
    \"services\": {
      \"delivery\": true,
      \"messaging\": true,
      \"payments\": false
    }
  }")

# Separar body y status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo -e "${YELLOW}Status Code: ${HTTP_CODE}${NC}"
echo -e "${YELLOW}Response:${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Verificar resultado
if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Tenant registrado exitosamente!${NC}"
    echo -e "${YELLOW}Verifica en la base de datos que el tenant fue creado.${NC}"
elif [ "$HTTP_CODE" -eq 409 ]; then
    echo -e "${YELLOW}⚠️  El tenant ya existe (esto es normal si ya lo registraste antes)${NC}"
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}❌ ERROR: Token inválido${NC}"
    echo -e "${YELLOW}Verifica que SERVICE_ROLE_SECRET coincida exactamente con el token en el header.${NC}"
else
    echo -e "${RED}❌ ERROR: Código HTTP inesperado${NC}"
fi

