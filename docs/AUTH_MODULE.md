# 🔐 Módulo de Autenticación - PipeCore

## Descripción

El módulo de autenticación maneja:
- ✅ Registro de tenants desde Supabase
- ✅ Validación de JWT firmados con `api_secret` del tenant
- ✅ Protección de endpoints internos con `SERVICE_ROLE_SECRET`

## Arquitectura

### Flujo de Autenticación

```
1. Supabase crea tenant → Genera api_key y api_secret
2. Supabase llama a POST /pipecore/internal/register-tenant
   Headers:
     - Authorization: Bearer <SERVICE_ROLE_SECRET>
   Body:
     {
       "tenantId": "roe",
       "apiKey": "pk_live_...",
       "apiSecret": "sk_live_...",
       "services": {"delivery": true}
     }
3. PipeCore registra el tenant en su BD PostgreSQL
4. Cuando Supabase llama a PipeCore para operaciones:
   Headers:
     - Authorization: Bearer <JWT_firmado_con_api_secret>
     - X-Tenant-Id: roe
5. PipeCore valida:
   - Lee X-Tenant-Id del header
   - Busca api_secret en BD
   - Verifica JWT usando api_secret
   - Ejecuta la operación
```

## Endpoints

### POST `/pipecore/internal/register-tenant`

**Descripción:** Endpoint interno protegido para registrar tenants desde Supabase.

**Autenticación:** Requiere `SERVICE_ROLE_SECRET` en el header `Authorization`.

**Request:**
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

**Response:**
```json
{
  "success": true,
  "tenantId": "roe"
}
```

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
- `X-Tenant-Id: <tenant_id>`

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

Obtiene el `api_secret` de un tenant para validar JWT.

#### `validateTenant(tenantId: string)`

Verifica si un tenant existe y está activo.

## Estructura de Base de Datos

### Tabla `tenants`

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    services JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Ejemplo de Uso Completo

### 1. Supabase registra tenant en PipeCore

```typescript
// En Supabase Edge Function
const response = await fetch('https://pipecore.railway.app/pipecore/internal/register-tenant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PIPECORE_SERVICE_ROLE_SECRET}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tenantId: 'roe',
    apiKey: 'pk_live_a8sd7f6',
    apiSecret: 'sk_live_9sd8f76f87df',
    services: { delivery: true },
  }),
});
```

### 2. Supabase genera JWT y llama a PipeCore

```typescript
// En Supabase Edge Function
import * as jwt from 'jsonwebtoken';

const apiSecret = 'sk_live_9sd8f76f87df'; // Del tenant en Supabase
const token = jwt.sign(
  { tenantId: 'roe' },
  apiSecret,
  { expiresIn: '1h' }
);

const response = await fetch('https://pipecore.railway.app/uber/create-delivery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Id': 'roe',
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
    const tenantId = req.user.tenantId; // Validado por JwtDynamicGuard
    // Procesar delivery...
  }
}
```

## Variables de Entorno

Ver `docs/RAILWAY_SETUP.md` para la configuración completa.

## Seguridad

- ✅ `api_secret` nunca se expone al frontend
- ✅ JWT se firma con `api_secret` del tenant
- ✅ Endpoints internos protegidos con `SERVICE_ROLE_SECRET`
- ✅ Validación de tenant activo en cada request
- ✅ Logs de todas las operaciones de autenticación

