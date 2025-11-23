import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Reutilizar los DTOs de Uber para mantener consistencia
export class ManifestItemInternalDto {
  @ApiProperty({ 
    description: 'Nombre del artículo',
    type: String,
    example: 'Pizza Margherita',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Cantidad de artículos',
    type: Number,
    example: 2,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ 
    description: 'Tamaño del artículo',
    type: String,
    example: 'medium',
    enum: ['small', 'medium', 'large', 'xlarge']
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ 
    description: 'Precio del artículo en centavos',
    type: Number,
    example: 1500
  })
  @IsOptional()
  @IsNumber()
  price?: number;
}

export class VerificationInternalDto {
  @ApiPropertyOptional({ 
    description: 'Si se requiere firma',
    type: Boolean,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  signature?: boolean;

  @ApiPropertyOptional({ 
    description: 'Requisitos de firma',
    type: Object,
    example: { enabled: true, collect_signer_name: true }
  })
  @IsOptional()
  signature_requirement?: {
    enabled: boolean;
    collect_signer_name?: boolean;
    collect_signer_relationship?: boolean;
  };

  @ApiPropertyOptional({ 
    description: 'Lista de códigos de barras para verificar',
    type: Array,
    example: [{ value: '123456789', type: 'ean13' }]
  })
  @IsOptional()
  @IsArray()
  barcodes?: Array<{
    value: string;
    type: string;
  }>;

  @ApiPropertyOptional({ 
    description: 'Requisitos de identificación',
    type: Object,
    example: { min_age: 18 }
  })
  @IsOptional()
  identification?: {
    min_age: number;
  };

  @ApiPropertyOptional({ 
    description: 'Si se requiere foto',
    type: Boolean,
    example: false
  })
  @IsOptional()
  @IsBoolean()
  picture?: boolean;

  @ApiPropertyOptional({ 
    description: 'Requisitos de PIN',
    type: Object,
    example: { enabled: true }
  })
  @IsOptional()
  pincode?: {
    enabled: boolean;
  };
}

export class DeliveryInternalDto {
  @ApiProperty({
    description: 'Dirección de entrega (dropoff)',
    type: String,
    example: 'Av. Providencia 1200, Providencia, Santiago, Chile',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dropoff_address: string;

  @ApiProperty({
    description: 'Nombre del contacto de entrega',
    type: String,
    example: 'Carlos González',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dropoff_name: string;

  @ApiProperty({
    description: 'Número de teléfono de entrega',
    type: String,
    example: '+56987654321',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  dropoff_phone_number: string;

  @ApiProperty({
    description: 'Lista de artículos del manifiesto',
    type: [ManifestItemInternalDto],
    required: true
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManifestItemInternalDto)
  manifest_items: ManifestItemInternalDto[];

  @ApiProperty({
    description: 'Dirección de recogida (pickup)',
    type: String,
    example: 'Av. Providencia 1234, Providencia, Santiago, Chile',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  pickup_address: string;

  @ApiProperty({
    description: 'Nombre del contacto de recogida',
    type: String,
    example: 'María Rodríguez',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  pickup_name: string;

  @ApiProperty({
    description: 'Número de teléfono de recogida',
    type: String,
    example: '+56912345678',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  pickup_phone_number: string;

  @ApiPropertyOptional({
    description: 'Nombre del negocio de recogida',
    type: String,
    example: 'Pizzería Don Mario'
  })
  @IsOptional()
  @IsString()
  pickup_business_name?: string;

  @ApiProperty({
    description: 'Latitud de la ubicación de recogida (-90 a 90)',
    type: Number,
    example: -33.4189,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_latitude: number;

  @ApiProperty({
    description: 'Longitud de la ubicación de recogida (-180 a 180)',
    type: Number,
    example: -70.6069,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_longitude: number;

  @ApiPropertyOptional({
    description: 'Notas de recogida',
    type: String,
    example: 'Ring doorbell twice'
  })
  @IsOptional()
  @IsString()
  pickup_notes?: string;

  @ApiPropertyOptional({
    description: 'Requisitos de verificación de recogida',
    type: VerificationInternalDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationInternalDto)
  pickup_verification?: VerificationInternalDto;

  @ApiPropertyOptional({
    description: 'Nombre del negocio de entrega',
    type: String,
    example: 'Edificio Corporativo'
  })
  @IsOptional()
  @IsString()
  dropoff_business_name?: string;

  @ApiProperty({
    description: 'Latitud de la ubicación de entrega (-90 a 90)',
    type: Number,
    example: -33.4417,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_latitude: number;

  @ApiProperty({
    description: 'Longitud de la ubicación de entrega (-180 a 180)',
    type: Number,
    example: -70.6441,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_longitude: number;

  @ApiPropertyOptional({
    description: 'Notas de entrega',
    type: String,
    example: 'Leave at reception'
  })
  @IsOptional()
  @IsString()
  dropoff_notes?: string;

  @ApiPropertyOptional({
    description: 'Notas del vendedor para entrega',
    type: String,
    example: 'Handle with care'
  })
  @IsOptional()
  @IsString()
  dropoff_seller_notes?: string;

  @ApiPropertyOptional({
    description: 'Requisitos de verificación de entrega',
    type: VerificationInternalDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationInternalDto)
  dropoff_verification?: VerificationInternalDto;

  @ApiProperty({
    description: 'Acción cuando es entregable',
    type: String,
    example: 'deliverable_action_meet_at_door',
    enum: ['deliverable_action_meet_at_door', 'deliverable_action_leave_at_door'],
    required: true
  })
  @IsNotEmpty()
  @IsString()
  deliverable_action: string;

  @ApiPropertyOptional({
    description: 'Referencia del manifiesto',
    type: String,
    example: 'ORDER_12345'
  })
  @IsOptional()
  @IsString()
  manifest_reference?: string;

  @ApiProperty({
    description: 'Valor total del manifiesto en centavos',
    type: Number,
    example: 3000,
    required: true
  })
  @IsNotEmpty()
  @IsNumber()
  manifest_total_value: number;

  @ApiPropertyOptional({
    description: 'ID de cotización del endpoint create quote',
    type: String,
    example: 'quote_abc123xyz'
  })
  @IsOptional()
  @IsString()
  quote_id?: string;

  @ApiProperty({
    description: 'Acción cuando no es entregable. Default es "return"',
    type: String,
    example: 'return',
    enum: ['leave_at_door', 'return', 'discard'],
    default: 'return',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  undeliverable_action: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que el pedido estará listo para recogida (ISO 8601). Opcional',
    type: String,
    example: '2025-01-15T10:30:00Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  pickup_ready_dt?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora límite para completar la recogida (ISO 8601). Opcional',
    type: String,
    example: '2025-01-15T11:00:00Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  pickup_deadline_dt?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que el pedido estará listo para entrega (ISO 8601). Opcional',
    type: String,
    example: '2025-01-15T11:30:00Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  dropoff_ready_dt?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora límite para completar la entrega (ISO 8601). Opcional',
    type: String,
    example: '2025-01-15T12:00:00Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsString()
  dropoff_deadline_dt?: string;

  @ApiProperty({
    description: 'Si se requiere firma en la entrega',
    type: Boolean,
    example: true,
    required: true
  })
  @IsNotEmpty()
  @IsBoolean()
  requires_dropoff_signature: boolean;

  @ApiProperty({
    description: 'Si se requiere verificación de identificación',
    type: Boolean,
    example: false,
    required: true
  })
  @IsNotEmpty()
  @IsBoolean()
  requires_id: boolean;

  @ApiPropertyOptional({
    description: 'Monto de propina en centavos',
    type: Number,
    example: 500
  })
  @IsOptional()
  @IsNumber()
  tip?: number;

  @ApiPropertyOptional({
    description: 'Clave de idempotencia para deduplicación de solicitudes',
    type: String,
    example: 'delivery_12345_2025_01_15'
  })
  @IsOptional()
  @IsString()
  idempotency_key?: string;

  @ApiProperty({
    description: 'ID externo de la tienda',
    type: String,
    example: 'store_santiago_123',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  external_store_id: string;

  @ApiPropertyOptional({
    description: 'Requisitos de verificación de retorno',
    type: VerificationInternalDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationInternalDto)
  return_verification?: VerificationInternalDto;
}

