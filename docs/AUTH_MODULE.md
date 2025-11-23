# 🔐 Módulo de Autenticación - PipeCore

## Descripción

El módulo de autenticación maneja:
- ✅ Registro de tenants desde Supabase
- ✅ Validación de JWT firmados con `api_secret` del tenant
- ✅ Protección de endpoints internos con `SERVICE_ROLE_SECRET`
- ✅ Validación de estado de tenant usando campo `status` (active/inactive/suspended)
- ✅ Scripts de utilidad para desarrollo y testing

## Cambios Recientes

### Actualización del Esquema (v3.0)

- **Eliminación de `tenant_id`**: La tabla `tenants` ahora usa únicamente `id` (UUID) como identificador único
- **Generación automática de ID**: El `id` se genera automáticamente como UUID en la base de datos
- **Campo `name` opcional**: El registro de tenant ahora acepta `name` y `description` como campos opcionales
- **Simplificación del esquema**: El módulo ahora usa únicamente el campo `status` para validar el estado del tenant (eliminada compatibilidad con `is_active`)
- **Logs opcionales**: El registro en `tenant_logs` es opcional y no bloquea el registro del tenant
- **Mejor manejo de errores**: Mensajes de error más descriptivos y logging mejorado

## Arquitectura

### Flujo de Autenticación

```
1. Supabase crea tenant → Genera api_key y api_secret
2. Supabase llama a POST /internal/register-tenant
   Headers:
     - Authorization: Bearer <SERVICE_ROLE_SECRET>
   Body:
     {
       "name": "Mi Tenant",  // opcional
       "description": "Descripción del tenant",  // opcional
       "apiKey": "pk_live_...",
       "apiSecret": "sk_live_...",
       "services": {"delivery": true}  // opcional
     }
3. PipeCore registra el tenant en su BD PostgreSQL y genera un UUID automáticamente
4. PipeCore retorna: { "success": true, "id": "<uuid-generado>" }
5. Cuando Supabase llama a PipeCore para operaciones:
   Headers:
     - Authorization: Bearer <JWT_firmado_con_api_secret>
     - x-tenant-id: <uuid-del-tenant>
5. PipeCore valida:
   - Lee x-tenant-id del header (UUID)
   - Busca api_secret en BD usando el UUID
   - Verifica JWT usando api_secret
   - Ejecuta la operación
```

## Endpoints

### POST `/internal/register-tenant`

**Descripción:** Endpoint interno protegido para registrar tenants desde Supabase.

**Autenticación:** Requiere `SERVICE_ROLE_SECRET` en el header `Authorization`.

**Request:**
```json
{
  "name": "Mi Tenant",  // opcional
  "description": "Descripción del tenant",  // opcional
  "apiKey": "pk_live_a8sd7f6",
  "apiSecret": "sk_live_9sd8f76f87df",
  "services": {  // opcional
    "delivery": true,
    "messaging": true,
    "payments": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "id": "c8b743f2-365b-4855-8ee1-9604d521c373"
}
```

**Notas:**
- El `id` se genera automáticamente como UUID en la base de datos
- El `name` se obtiene de la tabla `tenants.name` en Supabase (si está disponible)
- Si no se proporciona `name`, se guarda como `null`
- La verificación de duplicados se hace por `api_key`, no por `tenant_id`

**Errores:**
- `401`: Token inválido o faltante
- `409`: El tenant ya existe
- `500`: Error interno

## Guards

### `JwtDynamicGuard`

**Uso:** Protege endpoints que requieren autenticación con JWT firmado por el tenant.

**Cómo usar:**
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtDynamicGuard } from '../auth/guards/jwt-dynamic.guard';

@Controller('delivery')
export class DeliveryController {
  @Get()
  @UseGuards(JwtDynamicGuard)
  async getDeliveries(@Request() req) {
    // req.user.tenantId contiene el tenantId validado
    const tenantId = req.user.tenantId;
    // ...
  }
}
```

**Headers requeridos:**
- `Authorization: Bearer <JWT>`
- `x-tenant-id: <uuid-del-tenant>`

**Validación:**
- Verifica que el tenant existe en la base de datos usando el UUID
- Verifica que el tenant tiene `status = 'active'`
- Valida el JWT usando el `api_secret` del tenant
- Compara el `tenantId` del JWT con el header `x-tenant-id`

### `InternalApiGuard`

**Uso:** Protege endpoints internos (como `/pipecore/internal/*`).

**Cómo usar:**
```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiGuard } from '../auth/guards/internal-api.guard';

@Controller('internal')
export class InternalController {
  @Post('register-tenant')
  @UseGuards(InternalApiGuard)
  async registerTenant() {
    // Solo accesible con SERVICE_ROLE_SECRET
  }
}
```

**Headers requeridos:**
- `Authorization: Bearer <SERVICE_ROLE_SECRET>`

## Servicios

### `AuthService`

#### `registerTenant(registerTenantDto: RegisterTenantDto)`

Registra un nuevo tenant en la base de datos.

#### `getTenantSecret(tenantId: string)`

Obtiene el `api_secret` de un tenant activo para validar JWT. Solo retorna el secreto si el tenant tiene `status = 'active'`.

**Retorna:** `string | null` - El `api_secret` del tenant o `null` si no existe o no está activo.

#### `validateTenant(tenantId: string)`

Verifica si un tenant existe y está activo (`status = 'active'`).

**Retorna:** `boolean` - `true` si el tenant existe y está activo, `false` en caso contrario.

**Nota:** La validación usa únicamente el campo `status`, no `is_active`.

## Estructura de Base de Datos

### Tabla `tenants`

El esquema estándar de la tabla `tenants` es:

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    description TEXT,
    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    settings JSONB DEFAULT '{}',
    services JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tenants_api_key ON tenants(api_key);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Trigger para updated_at automático
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Notas importantes:**
- El campo `id` se genera automáticamente como UUID (no se envía en el request)
- El campo `status` solo acepta valores: `'active'`, `'inactive'`, `'suspended'`
- Los campos `name` y `description` son opcionales
- El campo `name` debe obtenerse de la tabla `tenants.name` en Supabase
- Los campos `settings` y `services` son JSONB y se inicializan con objetos vacíos por defecto
- El trigger actualiza automáticamente `updated_at` en cada actualización
- La verificación de duplicados se hace por `api_key`, no por `tenant_id`

Para eliminar la columna `tenant_id` (si existe), ejecuta:
```bash
psql $DATABASE_URL -f db/pipecore/remove-tenant-id-column.sql
```

## Ejemplo de Uso Completo

### 1. Supabase registra tenant en PipeCore

```typescript
// En Supabase Edge Function
// Primero obtener el tenant desde Supabase para obtener el name
const { data: tenant } = await supabase
  .from('tenants')
  .select('id, name, api_key, api_secret, services')
  .eq('id', tenantId)
  .single();

const response = await fetch('https://pipecore.railway.app/internal/register-tenant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PIPECORE_SERVICE_ROLE_SECRET}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: tenant.name,  // ✅ Enviar name desde la tabla tenants
    apiKey: tenant.api_key,
    apiSecret: tenant.api_secret,
    services: tenant.services || { delivery: true },
  }),
});

const { id } = await response.json(); // UUID generado por PipeCore
```

### 2. Supabase genera JWT y llama a PipeCore

```typescript
// En Supabase Edge Function
import * as jwt from 'jsonwebtoken';

const apiSecret = 'sk_live_9sd8f76f87df'; // Del tenant en Supabase
const tenantId = 'c8b743f2-365b-4855-8ee1-9604d521c373'; // UUID retornado por PipeCore
const token = jwt.sign(
  { tenantId },
  apiSecret,
  { expiresIn: '1h' }
);

const response = await fetch('https://pipecore.railway.app/uber/create-delivery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId,  // UUID del tenant
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // datos del delivery
  }),
});
```

### 3. PipeCore valida y procesa

```typescript
// En PipeCore Controller
@Controller('uber')
export class UberController {
  @Post('create-delivery')
  @UseGuards(JwtDynamicGuard)
  async createDelivery(@Request() req, @Body() dto: CreateDeliveryDto) {
    const tenantId = req.user.tenantId; // UUID validado por JwtDynamicGuard
    // Procesar delivery...
  }
}
```

## Registro de Tenants de Prueba

Para desarrollo y testing, puedes registrar tenants de prueba usando los scripts incluidos:

### Opción 1: Script Bash (Recomendado)

```bash
# Asegúrate de que el servidor esté corriendo primero
npm run start:dev

# En otra terminal, ejecuta:
./scripts/register-test-tenant-simple.sh test-demo
```

### Opción 2: Script Node.js

```bash
node scripts/register-test-tenant.js test-demo
```

### Opción 3: cURL Directo

```bash
export SERVICE_ROLE_SECRET="tu_secreto_aqui"

curl -X POST http://localhost:3000/internal/register-tenant \
  -H "Authorization: Bearer $SERVICE_ROLE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Demo Tenant",
    "description": "Tenant de prueba",
    "apiKey": "pk_test_123",
    "apiSecret": "sk_test_456",
    "services": {
      "delivery": true,
      "messaging": true,
      "payments": true
    }
  }'
```

### Generar JWT de Prueba

Una vez registrado el tenant, puedes generar un JWT de prueba usando el endpoint de desarrollo:

```bash
curl -X GET http://localhost:3000/auth-test/generate-jwt \
  -H "X-Tenant-Id: test-demo" \
  -H "X-Api-Secret: sk_test_456"
```

### Probar Autenticación

```bash
# Usar el JWT generado para acceder a un endpoint protegido
curl -X GET http://localhost:3000/auth-test/protected \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "X-Tenant-Id: test-demo"
```

## Endpoints de Prueba

El módulo incluye endpoints de desarrollo para facilitar las pruebas:

### `GET /auth-test/generate-jwt`

Genera un JWT de prueba para un tenant.

**Headers requeridos:**
- `X-Tenant-Id`: ID del tenant
- `X-Api-Secret`: API Secret del tenant

### `GET /auth-test/protected`

Endpoint protegido para probar la autenticación JWT.

**Headers requeridos:**
- `Authorization: Bearer <JWT>`
- `x-tenant-id: <uuid-del-tenant>`

### `GET /auth-test/validate-tenant/:tenantId`

Verifica si un tenant existe y está activo.

## Variables de Entorno

Ver `docs/RAILWAY_SETUP.md` para la configuración completa.

**Variables requeridas:**
- `SERVICE_ROLE_SECRET`: Secreto para proteger endpoints internos
- `DATABASE_URL`: URL de conexión a PostgreSQL

## Manejo de Errores

El módulo incluye manejo robusto de errores:

- **Errores de validación**: Se retornan con código `400` y mensajes descriptivos
- **Tenant duplicado**: Se retorna `409 Conflict` con mensaje claro
- **Errores de base de datos**: Se loggean y se retorna `500` con mensaje genérico (por seguridad)
- **Logs opcionales**: El registro en `tenant_logs` es opcional y no bloquea el registro del tenant si falla

## Seguridad

- ✅ `api_secret` nunca se expone al frontend
- ✅ JWT se firma con `api_secret` del tenant
- ✅ Endpoints internos protegidos con `SERVICE_ROLE_SECRET`
- ✅ Validación de tenant activo en cada request usando `status = 'active'`
- ✅ Logs de todas las operaciones de autenticación (opcional, no crítico)
- ✅ Validación estricta del campo `status` con CHECK constraint
- ✅ Índices optimizados para búsquedas rápidas por `tenant_id`, `api_key` y `status`

