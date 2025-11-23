import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsBoolean, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ServicesDto {
  @ApiPropertyOptional({ 
    description: `**Campo opcional** - Servicio de delivery habilitado.
    
**Tipo:** Boolean
**Valores:** \`true\` (habilitado) o \`false\` (deshabilitado)
**Valor por defecto:** \`false\`
**Ejemplo:** \`true\`
**Descripción:** Indica si el tenant tiene acceso al servicio de entregas/delivery (Uber Direct, Rappi, etc.)`,
    type: Boolean,
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  delivery?: boolean;

  @ApiPropertyOptional({ 
    description: `**Campo opcional** - Servicio de mensajería habilitado.
    
**Tipo:** Boolean
**Valores:** \`true\` (habilitado) o \`false\` (deshabilitado)
**Valor por defecto:** \`false\`
**Ejemplo:** \`true\`
**Descripción:** Indica si el tenant tiene acceso al servicio de mensajería (SMS, WhatsApp via Twilio, Resend, etc.)`,
    type: Boolean,
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  messaging?: boolean;

  @ApiPropertyOptional({ 
    description: `**Campo opcional** - Servicio de pagos habilitado.
    
**Tipo:** Boolean
**Valores:** \`true\` (habilitado) o \`false\` (deshabilitado)
**Valor por defecto:** \`false\`
**Ejemplo:** \`false\`
**Descripción:** Indica si el tenant tiene acceso al servicio de pagos (MercadoPago, Transbank, etc.)`,
    type: Boolean,
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  payments?: boolean;
}

export class RegisterTenantDto {
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

  @ApiPropertyOptional({ 
    description: `**Campo opcional** - Descripción del tenant.
    
**Tipo:** String (texto sin límite)
**Ejemplo:** "Tenant para pruebas de desarrollo" o "Restaurante especializado en comida rápida"
**Nota:** Campo de texto libre para describir el propósito o características del tenant`,
    type: String,
    example: 'Tenant para pruebas de desarrollo'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: `**Campo obligatorio** - API Key pública del tenant.
    
**Tipo:** String
**Formato:** Prefijo recomendado \`pk_live_\` o \`pk_test_\` seguido de caracteres alfanuméricos
**Ejemplo:** "example_key"
**Validación:** 
- Debe ser único en la base de datos (no puede haber duplicados)
- Se usa para identificar al tenant en las peticiones
- Puede exponerse públicamente (no es información sensible)
**Error 409:** Si ya existe un tenant con esta API Key`,
    type: String,
    example: 'example_key',
    required: true
  })
  @IsString()
  apiKey: string;

  @ApiProperty({ 
    description: `**Campo obligatorio** - API Secret del tenant usado para firmar JWT.
    
**Tipo:** String
**Formato:** Prefijo recomendado \`sk_live_\` o \`sk_test_\` seguido de caracteres alfanuméricos
**Ejemplo:** "demo_123"
**Seguridad:** 
- ⚠️ **NUNCA** debe exponerse al frontend o en logs públicos
- Se usa para firmar y validar tokens JWT
- Debe almacenarse de forma segura en Supabase
- Si se compromete, debe regenerarse inmediatamente
**Uso:** PipeCore usa este secreto para validar los tokens JWT enviados por el tenant`,
    type: String,
    example: 'demo_123',
    required: true
  })
  @IsString()
  apiSecret: string;

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
}
