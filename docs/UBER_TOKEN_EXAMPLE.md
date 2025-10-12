# Endpoint de Generación de Token Uber OAuth

## Descripción
Se ha integrado exitosamente el endpoint `/uber/generate-token` que replica exactamente la funcionalidad mostrada en la imagen de Postman para generar tokens OAuth de Uber.

## Configuración
El endpoint está configurado para usar:
- **URL**: `https://login.uber.com/oauth/v2/token`
- **Método**: `POST`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Scope por defecto**: `eats.deliveries direct.organizations`

## Variables de Entorno Requeridas
```bash
UBER_DIRECT_CLIENT_ID=tu_client_id_aqui
UBER_DIRECT_CLIENT_SECRET=tu_client_secret_aqui
UBER_DIRECT_CUSTOMER_ID=tu_customer_id_aqui
UBER_AUTH_URL=https://login.uber.com/oauth/v2/token
```

## Uso del Endpoint

### Request
```http
POST /uber/generate-token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "scope": "eats.deliveries direct.organizations"
}
```

### Response
```json
{
  "access_token": "IA.AQAAAAS4WcalAkTZRafZc9IL8Rx01FZVgVt80e1qjDM2u20n0IJB210dktaekPyPC01goePKLt9L8M4RkMKmdTuXz5vRkBy3xZFkHXcjUVYptN8jxcCaBLzMGfIm7K-KcxCPB86uv1F_SmW75IXie09TTweBM2pLHrUjMfbvD50",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "scope": "direct.organizations eats.deliveries"
}
```

## Ejemplo con cURL
```bash
curl -X POST http://localhost:3000/uber/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "scope": "eats.deliveries direct.organizations"
  }'
```

## Documentación Swagger
Una vez que inicies el servidor, podrás ver la documentación completa en:
`http://localhost:3000/api`

## Características Implementadas
- ✅ Endpoint POST `/uber/generate-token`
- ✅ DTOs para request y response
- ✅ Validación de parámetros
- ✅ Documentación Swagger completa
- ✅ Manejo de errores
- ✅ Logging detallado
- ✅ Scope configurado correctamente
- ✅ URL de autenticación actualizada

## Integración con el Sistema Existente
El nuevo endpoint se integra perfectamente con el sistema existente:
- Utiliza el mismo `UberAuthService` que ya existía
- Mantiene compatibilidad con el endpoint de creación de entregas
- Preserva la funcionalidad de caché de tokens
- Usa las mismas variables de entorno configuradas
