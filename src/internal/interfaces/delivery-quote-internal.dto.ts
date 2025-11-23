import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class DeliveryQuoteInternalDto {
  @ApiProperty({
    description: `**Campo obligatorio** - Dirección de entrega (dropoff) en formato JSON string.
    
**Tipo:** String (JSON stringificado)
**Formato:** JSON válido con estructura de dirección de Uber Direct
**Estructura requerida:**
- \`street_address\` (Array): Array de strings con las líneas de dirección
- \`city\` (String): Ciudad
- \`state\` (String): Estado/Región
- \`zip_code\` (String): Código postal
- \`country\` (String): Código de país (ISO 3166-1 alpha-2, ej: "CL", "US")
**Ejemplo:** \`'{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}'\`
**Nota:** Las direcciones se pasan como strings JSON, no como objetos. Debe ser un JSON válido.`,
    type: String,
    example: '{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dropoff_address: string;

  @ApiProperty({
    description: `**Campo obligatorio** - Dirección de recogida (pickup) en formato JSON string.
    
**Tipo:** String (JSON stringificado)
**Formato:** JSON válido con estructura de dirección de Uber Direct
**Estructura requerida:**
- \`street_address\` (Array): Array de strings con las líneas de dirección
- \`city\` (String): Ciudad
- \`state\` (String): Estado/Región
- \`zip_code\` (String): Código postal
- \`country\` (String): Código de país (ISO 3166-1 alpha-2, ej: "CL", "US")
**Ejemplo:** \`'{"street_address":["Av. Quilín 107"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}'\`
**Nota:** Las direcciones se pasan como strings JSON, no como objetos. Debe ser un JSON válido.`,
    type: String,
    example: '{"street_address":["Av. Quilín 107"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  pickup_address: string;

  @ApiProperty({ 
    description: `**Campo obligatorio** - Latitud de la ubicación de recogida.
    
**Tipo:** Number (decimal)
**Rango:** -90 a 90 (grados)
**Precisión:** Coordenadas GPS en formato decimal
**Ejemplo:** -33.4865639 (Santiago, Chile)
**Validación:** Debe ser un número válido entre -90 y 90
**Nota:** Debe corresponder con la dirección especificada en \`pickup_address\``,
    type: Number,
    example: -33.4865639,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_latitude: number;

  @ApiProperty({ 
    description: `**Campo obligatorio** - Longitud de la ubicación de recogida.
    
**Tipo:** Number (decimal)
**Rango:** -180 a 180 (grados)
**Precisión:** Coordenadas GPS en formato decimal
**Ejemplo:** -70.6169702 (Santiago, Chile)
**Validación:** Debe ser un número válido entre -180 y 180
**Nota:** Debe corresponder con la dirección especificada en \`pickup_address\``,
    type: Number,
    example: -70.6169702,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_longitude: number;

  @ApiProperty({ 
    description: `**Campo obligatorio** - Latitud de la ubicación de entrega.
    
**Tipo:** Number (decimal)
**Rango:** -90 a 90 (grados)
**Precisión:** Coordenadas GPS en formato decimal
**Ejemplo:** -33.48657 (Santiago, Chile)
**Validación:** Debe ser un número válido entre -90 y 90
**Nota:** Debe corresponder con la dirección especificada en \`dropoff_address\``,
    type: Number,
    example: -33.48657,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_latitude: number;

  @ApiProperty({ 
    description: `**Campo obligatorio** - Longitud de la ubicación de entrega.
    
**Tipo:** Number (decimal)
**Rango:** -180 a 180 (grados)
**Precisión:** Coordenadas GPS en formato decimal
**Ejemplo:** -70.61698 (Santiago, Chile)
**Validación:** Debe ser un número válido entre -180 y 180
**Nota:** Debe corresponder con la dirección especificada en \`dropoff_address\``,
    type: Number,
    example: -70.61698,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_longitude: number;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora en que el pedido estará listo para recogida (ISO 8601). Si no se proporciona, se genera automáticamente',
    type: String,
    example: '2025-11-02T15:30:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  pickup_ready_dt?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora límite para completar la recogida (ISO 8601). Si no se proporciona, se genera automáticamente',
    type: String,
    example: '2025-11-02T16:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  pickup_deadline_dt?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora en que el pedido estará listo para entrega (ISO 8601). Si no se proporciona, se genera automáticamente',
    type: String,
    example: '2025-11-02T15:55:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  dropoff_ready_dt?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora límite para completar la entrega (ISO 8601). Si no se proporciona, se genera automáticamente',
    type: String,
    example: '2025-11-02T16:15:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  dropoff_deadline_dt?: string;

  @ApiProperty({ 
    description: 'Número de teléfono de contacto para la recogida (formato internacional con +)',
    type: String,
    example: '+56912345678',
    pattern: '^\\+[1-9]\\d{1,14}$',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  pickup_phone_number: string;

  @ApiProperty({ 
    description: 'Número de teléfono de contacto para la entrega (formato internacional con +)',
    type: String,
    example: '+56987654321',
    pattern: '^\\+[1-9]\\d{1,14}$',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dropoff_phone_number: string;

  @ApiProperty({ 
    description: `**Campo obligatorio** - Valor total de los artículos del manifiesto en centavos.
    
**Tipo:** Number (entero)
**Unidad:** Centavos (unidad más pequeña de la moneda)
**Ejemplo:** 2500 (representa $25.00 CLP o $25.00 USD según la moneda)
**Validación:** 
- Debe ser mayor o igual a 0
- Solo números enteros (no decimales)
- Representa el valor total de todos los artículos del pedido
**Nota:** El valor se especifica en la unidad más pequeña de la moneda (centavos para CLP/USD)`,
    type: Number,
    example: 2500,
    minimum: 0,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  manifest_total_value: number;

  @ApiProperty({ 
    description: `**Campo obligatorio** - Identificador externo de la tienda.
    
**Tipo:** String
**Formato:** Identificador único de la tienda en el sistema del tenant
**Ejemplo:** "store_12345" o "tienda-santiago-centro"
**Uso:** Se usa para identificar la tienda que realiza el pedido
**Validación:** 
- Debe ser un string no vacío
- Se pasa tal cual a Uber Direct API
**Nota:** Este identificador debe ser único dentro del contexto del tenant`,
    type: String,
    example: 'store_12345',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  external_store_id: string;
}

