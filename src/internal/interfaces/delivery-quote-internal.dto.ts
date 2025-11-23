import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class DeliveryQuoteInternalDto {
  @ApiProperty({
    description: 'Dirección de entrega (dropoff) en formato JSON string',
    type: String,
    example: '{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dropoff_address: string;

  @ApiProperty({
    description: 'Dirección de recogida (pickup) en formato JSON string',
    type: String,
    example: '{"street_address":["Av. Quilín 107"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  pickup_address: string;

  @ApiProperty({ 
    description: 'Latitud de la ubicación de recogida (-90 a 90)',
    type: Number,
    example: -33.4865639,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_latitude: number;

  @ApiProperty({ 
    description: 'Longitud de la ubicación de recogida (-180 a 180)',
    type: Number,
    example: -70.6169702,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_longitude: number;

  @ApiProperty({ 
    description: 'Latitud de la ubicación de entrega (-90 a 90)',
    type: Number,
    example: -33.48657,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_latitude: number;

  @ApiProperty({ 
    description: 'Longitud de la ubicación de entrega (-180 a 180)',
    type: Number,
    example: -70.61698,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_longitude: number;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora en que el pedido estará listo para recogida (ISO 8601). Opcional',
    type: String,
    example: '2025-11-02T15:30:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  pickup_ready_dt?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora límite para completar la recogida (ISO 8601). Opcional',
    type: String,
    example: '2025-11-02T16:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  pickup_deadline_dt?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora en que el pedido estará listo para entrega (ISO 8601). Opcional',
    type: String,
    example: '2025-11-02T15:55:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  dropoff_ready_dt?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora límite para completar la entrega (ISO 8601). Opcional',
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
    description: 'Valor total de los artículos del manifiesto en centavos',
    type: Number,
    example: 2500,
    minimum: 0,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  manifest_total_value: number;

  @ApiProperty({ 
    description: 'Identificador externo de la tienda',
    type: String,
    example: 'store_12345',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  external_store_id: string;
}

