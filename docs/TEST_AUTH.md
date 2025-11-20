# 🧪 Pruebas del Módulo de Autenticación

## Prueba 1: Registrar un Tenant

### Endpoint
```
POST http://localhost:3000/pipecore/internal/register-tenant
```

### Headers
```
Authorization: Bearer <SERVICE_ROLE_SECRET>
Content-Type: application/json
```

### Body
```json
{
  "tenantId": "roe",
  "apiKey": "pk_live_a8sd7f6",
  "apiSecret": "sk_live_9sd8f76f87df",
  "services": {
    "delivery": true,
    "messaging": true,
    "payments": false
  }
}
```

### Comando cURL
```bash
curl -X POST http://localhost:3000/pipecore/internal/register-tenant \
  -H "Authorization: Bearer $SERVICE_ROLE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "roe",
    "apiKey": "pk_live_a8sd7f6",
    "apiSecret": "sk_live_9sd8f76f87df",
    "services": {
      "delivery": true,
      "messaging": true,
      "payments": false
    }
  }'
```

### Respuesta Esperada (201)
```json
{
  "success": true,
  "tenantId": "roe"
}
```

### Respuesta de Error (401)
```json
{
  "statusCode": 401,
  "message": "Token de servicio inválido"
}
```

### Respuesta de Error (409)
```json
{
  "statusCode": 409,
  "message": "El tenant roe ya está registrado"
}
```

## Prueba 2: Validar JWT con Tenant

### Endpoint de Prueba (crear uno)
Necesitamos crear un endpoint de prueba que use `JwtDynamicGuard` para validar el JWT.

### Headers Requeridos
```
Authorization: Bearer <JWT_firmado_con_api_secret>
X-Tenant-Id: roe
```

### Generar JWT de Prueba
```javascript
// En Node.js o en Supabase Edge Function
const jwt = require('jsonwebtoken');

const apiSecret = 'sk_live_9sd8f76f87df'; // Del tenant registrado
const token = jwt.sign(
  { tenantId: 'roe' },
  apiSecret,
  { expiresIn: '1h' }
);

console.log('JWT:', token);
```

## Prueba 3: Verificar Tenant en Base de Datos

### Query SQL
```sql
SELECT 
  tenant_id,
  name,
  api_key,
  LEFT(api_secret, 10) || '...' as api_secret_preview,
  status,
  services,
  created_at
FROM tenants
WHERE tenant_id = 'roe';
```

## Checklist de Pruebas

- [ ] Servidor corriendo en `localhost:3000`
- [ ] Variable `SERVICE_ROLE_SECRET` configurada
- [ ] Variable `DATABASE_URL` configurada y conectando
- [ ] Tabla `tenants` existe en la base de datos
- [ ] Endpoint `/pipecore/internal/register-tenant` responde
- [ ] Guard `InternalApiGuard` protege el endpoint
- [ ] Tenant se registra correctamente en BD
- [ ] Log se crea en tabla `tenant_logs`
- [ ] Intentar registrar el mismo tenant devuelve 409
- [ ] JWT se puede generar y validar con `api_secret`

