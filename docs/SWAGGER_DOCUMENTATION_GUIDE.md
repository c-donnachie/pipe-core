# 📚 Guía de Documentación Swagger - PipeCore

Esta guía explica cómo documentar correctamente los endpoints y DTOs en Swagger para PipeCore, siguiendo las mejores prácticas y estándares del proyecto.

## 📋 Tabla de Contenidos

1. [Principios Generales](#principios-generales)
2. [Documentación de DTOs](#documentación-de-dtos)
3. [Documentación de Endpoints](#documentación-de-endpoints)
4. [Ejemplos Completos](#ejemplos-completos)
5. [Mejores Prácticas](#mejores-prácticas)

## 🎯 Principios Generales

### Campos Obligatorios vs Opcionales

- **Obligatorios**: Usar `@ApiProperty` con `required: true` (o sin especificar, por defecto es `true`)
- **Opcionales**: Usar `@ApiPropertyOptional` (equivalente a `@ApiProperty` con `required: false`)

### Estructura de Descripción

Las descripciones deben seguir este formato:

```typescript
description: `**Campo obligatorio/opcional** - Descripción breve del campo.

**Tipo:** Tipo de dato (String, Number, Boolean, Object, etc.)
**Formato:** Formato específico si aplica (date-time, uuid, email, etc.)
**Valores:** Valores permitidos si aplica
**Valor por defecto:** Valor por defecto si aplica
**Ejemplo:** Ejemplo concreto del valor
**Validación:** Reglas de validación aplicadas
**Nota:** Información adicional importante
**Error:** Códigos de error relacionados si aplica`
```

## 📝 Documentación de DTOs

### Campo Obligatorio (String)

```typescript
@ApiProperty({ 
  description: `**Campo obligatorio** - API Key pública del tenant.
  
**Tipo:** String
**Formato:** Prefijo recomendado \`pk_live_\` o \`pk_test_\` seguido de caracteres alfanuméricos
**Ejemplo:** "pk_live_a8sd7f6a9sd8f76f87df"
**Validación:** 
- Debe ser único en la base de datos (no puede haber duplicados)
- Se usa para identificar al tenant en las peticiones
- Puede exponerse públicamente (no es información sensible)
**Error 409:** Si ya existe un tenant con esta API Key`,
  type: String,
  example: 'pk_live_a8sd7f6a9sd8f76f87df',
  required: true
})
@IsString()
apiKey: string;
```

### Campo Opcional (String)

```typescript
@ApiPropertyOptional({ 
  description: `**Campo opcional** - Nombre del tenant.
  
**Tipo:** String (máximo 255 caracteres)
**Origen:** Se obtiene de la tabla \`tenants.name\` en Supabase
**Ejemplo:** "Mi Tenant" o "ROE - Restaurante Online Express"
**Nota:** Si no se proporciona, se guarda como \`null\` en la base de datos`,
  type: String,
  example: 'Mi Tenant',
  maxLength: 255
})
@IsString()
@IsOptional()
name?: string;
```

### Campo Numérico

```typescript
@ApiProperty({ 
  description: `**Campo obligatorio** - Valor total de los artículos en centavos.
  
**Tipo:** Number
**Unidad:** Centavos (unidad más pequeña de la moneda)
**Ejemplo:** 2500 (representa $25.00 CLP)
**Validación:** 
- Debe ser mayor o igual a 0
- Solo números enteros (no decimales)
**Nota:** El valor se especifica en la unidad más pequeña de la moneda`,
  type: Number,
  example: 2500,
  minimum: 0,
  required: true
})
@IsNotEmpty()
@IsNumber()
manifest_total_value: number;
```

### Campo con Formato Específico (Date-Time)

```typescript
@ApiPropertyOptional({ 
  description: `**Campo opcional** - Fecha y hora en que el pedido estará listo para recogida.
  
**Tipo:** String
**Formato:** ISO 8601 (date-time)
**Ejemplo:** "2025-11-02T15:30:00.000Z"
**Zona horaria:** UTC (indicado por la 'Z' al final)
**Comportamiento:** Si no se proporciona, se genera automáticamente basado en la hora actual + 20 minutos
**Nota:** Debe ser una fecha futura`,
  type: String,
  example: '2025-11-02T15:30:00.000Z',
  format: 'date-time'
})
@IsOptional()
@IsString()
pickup_ready_dt?: string;
```

### Campo con Patrón (Phone Number)

```typescript
@ApiProperty({ 
  description: `**Campo obligatorio** - Número de teléfono de contacto para la recogida.
  
**Tipo:** String
**Formato:** Formato internacional E.164 (debe comenzar con +)
**Patrón:** \`^\\+[1-9]\\d{1,14}$\`
**Ejemplo:** "+56912345678" (Chile) o "+14155552671" (EE.UU.)
**Validación:** 
- Debe comenzar con el símbolo +
- Seguido del código de país (1-9)
- Luego de 1 a 14 dígitos
**Nota:** No incluir espacios, guiones u otros caracteres especiales`,
  type: String,
  example: '+56912345678',
  pattern: '^\\+[1-9]\\d{1,14}$',
  required: true
})
@IsNotEmpty()
@IsString()
pickup_phone_number: string;
```

### Campo Boolean

```typescript
@ApiPropertyOptional({ 
  description: `**Campo opcional** - Servicio de delivery habilitado.
  
**Tipo:** Boolean
**Valores:** \`true\` (habilitado) o \`false\` (deshabilitado)
**Valor por defecto:** \`false\`
**Ejemplo:** \`true\`
**Descripción:** Indica si el tenant tiene acceso al servicio de entregas/delivery`,
  type: Boolean,
  example: true,
  default: false
})
@IsBoolean()
@IsOptional()
delivery?: boolean;
```

### Campo Object (Nested DTO)

```typescript
@ApiPropertyOptional({ 
  description: `**Campo opcional** - Servicios habilitados para el tenant.
  
**Tipo:** Object (ServicesDto)
**Estructura:** Objeto con propiedades booleanas para cada servicio
**Campos disponibles:**
- \`delivery\` (Boolean): Servicio de entregas/delivery
- \`messaging\` (Boolean): Servicio de mensajería (SMS/WhatsApp)
- \`payments\` (Boolean): Servicio de pagos
**Ejemplo:** 
\`\`\`json
{
  "delivery": true,
  "messaging": true,
  "payments": false
}
\`\`\`
**Valor por defecto:** Si no se proporciona, se guarda como objeto vacío \`{}\`
**Nota:** Estos valores se almacenan en formato JSONB en la base de datos`,
  type: ServicesDto,
  example: {
    delivery: true,
    messaging: true,
    payments: false
  }
})
@IsObject()
@ValidateNested()
@Type(() => ServicesDto)
@IsOptional()
services?: ServicesDto;
```

## 🔌 Documentación de Endpoints

### Headers

```typescript
@ApiHeader({ 
  name: 'x-tenant-id', 
  description: `UUID del tenant (generado automáticamente al registrar).
  
**Tipo:** String (UUID)
**Formato:** UUID v4
**Ejemplo:** "c8b743f2-365b-4855-8ee1-9604d521c373"
**Origen:** Retornado por el endpoint \`POST /internal/register-tenant\`
**Uso:** Se usa para identificar al tenant en las peticiones`,
  required: true,
  example: 'c8b743f2-365b-4855-8ee1-9604d521c373'
})
```

### Operación (Operation)

```typescript
@ApiOperation({
  summary: 'Crear cotización de entrega',
  description: `Endpoint que valida las credenciales del tenant y maneja tokens de Uber automáticamente.

**Flujo:**
1. Valida las credenciales del tenant (\`x-tenant-id\`, \`x-tenant-key\`, \`x-tenant-secret\`)
2. Verifica si existe un token activo de Uber en la base de datos
3. Si no hay token activo, genera uno nuevo automáticamente
4. Guarda el token en la tabla \`uber_direct_tokens\`
5. Usa el token para crear la cotización en Uber Direct API
6. Retorna la cotización con todos los detalles

**Autenticación:** No requiere \`SERVICE_ROLE_SECRET\`, solo las credenciales del tenant.`
})
```

### Respuestas (Responses)

#### Respuesta Exitosa (200/201)

```typescript
@ApiResponse({ 
  status: 201, 
  description: 'Tenant registrado exitosamente',
  schema: {
    type: 'object',
    properties: {
      success: { 
        type: 'boolean',
        example: true,
        description: 'Indica si el registro fue exitoso'
      },
      id: { 
        type: 'string',
        format: 'uuid',
        example: 'c8b743f2-365b-4855-8ee1-9604d521c373',
        description: 'UUID generado automáticamente para el tenant'
      },
    },
  },
})
```

#### Respuesta de Error

```typescript
@ApiResponse({ 
  status: 400, 
  description: `Bad Request - Headers faltantes o datos inválidos.

**Causas comunes:**
- Faltan headers requeridos (\`x-tenant-id\`, \`x-tenant-key\`, \`x-tenant-secret\`)
- Datos del body inválidos o mal formateados
- Validación de campos fallida`,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      message: { 
        type: 'string', 
        example: 'Headers requeridos: x-tenant-id, x-tenant-key, x-tenant-secret' 
      },
      error: { type: 'string', example: 'Bad Request' }
    }
  }
})
```

## 📖 Ejemplos Completos

### Ejemplo 1: DTO Completo

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({ 
    description: `**Campo obligatorio** - Dirección de entrega en formato JSON string.
    
**Tipo:** String (JSON)
**Formato:** JSON stringificado con estructura de dirección
**Ejemplo:** \`'{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}'\`
**Validación:** 
- Debe ser un JSON válido
- Debe contener al menos: \`street_address\`, \`city\`, \`country\`
**Nota:** Las direcciones se pasan como strings JSON, no como objetos`,
    type: String,
    example: '{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dropoff_address: string;

  @ApiPropertyOptional({ 
    description: `**Campo opcional** - Fecha y hora límite para completar la entrega.
    
**Tipo:** String
**Formato:** ISO 8601 (date-time)
**Ejemplo:** "2025-11-02T16:15:00.000Z"
**Comportamiento:** Si no se proporciona, se genera automáticamente basado en \`dropoff_ready_dt\` + 20 minutos
**Validación:** Debe ser posterior a \`dropoff_ready_dt\``,
    type: String,
    example: '2025-11-02T16:15:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  dropoff_deadline_dt?: string;
}
```

### Ejemplo 2: Endpoint Completo

```typescript
@Post('delivery-quotes')
@HttpCode(HttpStatus.OK)
@ApiHeader({ 
  name: 'x-tenant-id', 
  description: `UUID del tenant (generado automáticamente al registrar).
  
**Tipo:** String (UUID)
**Formato:** UUID v4
**Ejemplo:** "c8b743f2-365b-4855-8ee1-9604d521c373"
**Origen:** Retornado por el endpoint \`POST /internal/register-tenant\`
**Uso:** Se usa para identificar al tenant en las peticiones`,
  required: true,
  example: 'c8b743f2-365b-4855-8ee1-9604d521c373'
})
@ApiOperation({
  summary: 'Crear cotización de entrega',
  description: `Endpoint que valida las credenciales del tenant y maneja tokens de Uber automáticamente.

**Flujo:**
1. Valida las credenciales del tenant
2. Verifica si existe un token activo de Uber
3. Genera nuevo token si es necesario
4. Crea la cotización en Uber Direct API
5. Retorna la cotización con todos los detalles`
})
@ApiResponse({
  status: 200,
  description: 'Cotización creada exitosamente',
  schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', example: 'delivery_quote' },
      id: { type: 'string', example: 'dqt_MTRWwBCKTY2dPW0acltKyg' },
      fee: { type: 'number', example: 251500 },
      currency: { type: 'string', example: 'clp' }
    }
  }
})
@ApiResponse({ 
  status: 401, 
  description: 'No autorizado - Credenciales inválidas o tenant inactivo',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Tenant no encontrado o credenciales inválidas' }
    }
  }
})
async createDeliveryQuote(@Body() dto: CreateDeliveryDto) {
  // Implementación...
}
```

## ✅ Mejores Prácticas

### 1. Siempre Especificar Tipo

```typescript
// ✅ Correcto
@ApiProperty({ type: String, ... })

// ❌ Incorrecto
@ApiProperty({ ... }) // Sin type
```

### 2. Usar Ejemplos Reales

```typescript
// ✅ Correcto
example: 'pk_live_a8sd7f6a9sd8f76f87df'

// ❌ Incorrecto
example: 'string' // Demasiado genérico
```

### 3. Documentar Validaciones

```typescript
// ✅ Correcto
description: `**Campo obligatorio** - API Key.
**Validación:** 
- Debe ser único en la base de datos
- Formato: pk_live_ o pk_test_ seguido de caracteres alfanuméricos`

// ❌ Incorrecto
description: 'API Key' // Sin detalles de validación
```

### 4. Indicar Comportamiento por Defecto

```typescript
// ✅ Correcto
description: `**Campo opcional** - Nombre del tenant.
**Valor por defecto:** Si no se proporciona, se guarda como \`null\`
**Comportamiento:** Se genera automáticamente si no se especifica`

// ❌ Incorrecto
description: 'Nombre del tenant' // Sin mencionar comportamiento por defecto
```

### 5. Documentar Errores Relacionados

```typescript
// ✅ Correcto
description: `**Campo obligatorio** - API Key.
**Error 409:** Si ya existe un tenant con esta API Key
**Error 400:** Si el formato es inválido`

// ❌ Incorrecto
description: 'API Key' // Sin mencionar errores posibles
```

### 6. Usar Formato Markdown en Descripciones

```typescript
// ✅ Correcto - Usa markdown para mejor legibilidad
description: `**Campo obligatorio** - Descripción.

**Tipo:** String
**Ejemplo:** "valor"
**Nota:** Información adicional`

// ❌ Incorrecto - Texto plano sin formato
description: 'Campo obligatorio. Tipo String. Ejemplo: "valor". Nota: Información adicional'
```

## 📚 Referencias

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

## 🔍 Checklist de Documentación

Antes de considerar un endpoint completamente documentado, verifica:

- [ ] Todos los campos tienen `type` especificado
- [ ] Campos obligatorios usan `@ApiProperty` con `required: true`
- [ ] Campos opcionales usan `@ApiPropertyOptional`
- [ ] Todos los campos tienen `example` con valores realistas
- [ ] Las descripciones incluyen tipo, formato, validaciones y notas
- [ ] Los headers están documentados con `@ApiHeader`
- [ ] La operación tiene `summary` y `description` detallada
- [ ] Todas las respuestas posibles están documentadas con `@ApiResponse`
- [ ] Los esquemas de respuesta incluyen propiedades con tipos y ejemplos
- [ ] Los errores están documentados con ejemplos de mensajes

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0

