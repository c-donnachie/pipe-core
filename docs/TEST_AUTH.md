# 🧪 Pruebas del Módulo de Autenticación

## Prueba 1: Registrar un Tenant

### Endpoint
```
POST http://localhost:3000/internal/register-tenant
```

### Headers
```
Authorization: Bearer <SERVICE_ROLE_SECRET>
Content-Type: application/json
```

### Body
```json
{
  "name": "Mi Tenant",
  "description": "Descripción del tenant",
  "apiKey": "pk_live_a8sd7f6",
  "apiSecret": "sk_live_9sd8f76f87df",
  "services": {
    "delivery": true,
    "messaging": true,
    "payments": false
  }
}
```

**Nota:** Los campos `name` y `description` son opcionales. El `name` debe obtenerse de la tabla `tenants.name` en Supabase.

### Comando cURL
```bash
curl -X POST http://localhost:3000/internal/register-tenant \
  -H "Authorization: Bearer $SERVICE_ROLE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Tenant",
    "description": "Descripción del tenant",
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
  "id": "c8b743f2-365b-4855-8ee1-9604d521c373"
}
```

**Nota:** El `id` es un UUID generado automáticamente por la base de datos.

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
  "message": "El tenant con esta API Key ya está registrado"
}
```

**Nota:** La verificación de duplicados se hace por `api_key`, no por `tenant_id`.

## Prueba 2: Validar JWT con Tenant

### Endpoint de Prueba (crear uno)
Necesitamos crear un endpoint de prueba que use `JwtDynamicGuard` para validar el JWT.

### Headers Requeridos
```
Authorization: Bearer <JWT_firmado_con_api_secret>
x-tenant-id: <uuid-del-tenant>
```

### Generar JWT de Prueba
```javascript
// En Node.js o en Supabase Edge Function
const jwt = require('jsonwebtoken');

const apiSecret = 'sk_live_9sd8f76f87df'; // Del tenant registrado
const tenantId = 'c8b743f2-365b-4855-8ee1-9604d521c373'; // UUID retornado al registrar
const token = jwt.sign(
  { tenantId },  // UUID del tenant
  apiSecret,
  { expiresIn: '1h' }
);

console.log('JWT:', token);
```

## Prueba 3: Verificar Tenant en Base de Datos

### Query SQL
```sql
SELECT 
  id,
  name,
  api_key,
  LEFT(api_secret, 10) || '...' as api_secret_preview,
  status,
  services,
  created_at
FROM tenants
WHERE id = 'c8b743f2-365b-4855-8ee1-9604d521c373';
```

**Nota:** Ahora se usa `id` (UUID) en lugar de `tenant_id` para identificar tenants.

## Checklist de Pruebas

- [ ] Servidor corriendo en `localhost:3000`
- [ ] Variable `SERVICE_ROLE_SECRET` configurada
- [ ] Variable `DATABASE_URL` configurada y conectando
- [ ] Tabla `tenants` existe en la base de datos
- [ ] Endpoint `/internal/register-tenant` responde
- [ ] Guard `InternalApiGuard` protege el endpoint
- [ ] Tenant se registra correctamente en BD
- [ ] Log se crea en tabla `tenant_logs`
- [ ] Intentar registrar el mismo tenant devuelve 409
- [ ] JWT se puede generar y validar con `api_secret`

