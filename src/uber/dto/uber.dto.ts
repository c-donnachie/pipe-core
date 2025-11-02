import { IsNotEmpty, IsObject, ValidateNested, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({
    description: 'Full address of the location',
    example: '123 Main St, San Francisco, CA 94102',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 37.7749,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: -122.4194,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Name of the person or business at this location',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Phone number for contact',
    example: '+14155551234',
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Special delivery instructions',
    example: 'Ring doorbell twice',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}


export class GenerateTokenDto {
  @ApiPropertyOptional({
    description: 'OAuth 2.0 grant type',
    example: 'client_credentials',
    default: 'client_credentials',
  })
  @IsOptional()
  @IsString()
  grant_type?: string = 'client_credentials';

  @ApiPropertyOptional({
    description: 'OAuth 2.0 scope - permissions requested',
    example: 'eats.deliveries direct.organizations',
    default: 'eats.deliveries direct.organizations',
  })
  @IsOptional()
  @IsString()
  scope?: string = 'eats.deliveries direct.organizations';
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'OAuth 2.0 access token',
    example: 'IA.AQAAAAS4WcalAkTZRafZc9IL8Rx01FZVgVt80e1qjDM2u20n0IJB210dktaekPyPC01goePKLt9L8M4RkMKmdTuXz5vRkBy3xZFkHXcjUVYptN8jxcCaBLzMGfIm7K-KcxCPB86uv1F_SmW75IXie09TTweBM2pLHrUjMfbvD50',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 2592000,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Granted scopes',
    example: 'direct.organizations eats.deliveries',
  })
  scope: string;
}

export class CreateQuoteDto {
  @ApiProperty({
    description: 'Dropoff address',
    example: '{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
    default: '{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
  })
  @IsNotEmpty()
  @IsString()
  dropoff_address: string = '{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}';

  @ApiProperty({
    description: 'Pickup address',
    example: '{"street_address":["Av. Quilín 107"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
    default: '{"street_address":["Av. Quilín 107"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
  })
  @IsNotEmpty()
  @IsString()
  pickup_address: string = '{"street_address":["Av. Quilín 107"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}';

  @ApiProperty({
    description: 'Pickup latitude coordinate',
    example: -33.4865639,
    default: -33.4865639,
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_latitude: number = -33.4865639;

  @ApiProperty({
    description: 'Pickup longitude coordinate',
    example: -70.6169702,
    default: -70.6169702,
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_longitude: number = -70.6169702;

  @ApiProperty({
    description: 'Dropoff latitude coordinate',
    example: -33.48657,
    default: -33.48657,
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_latitude: number = -33.48657;

  @ApiProperty({
    description: 'Dropoff longitude coordinate',
    example: -70.61698,
    default: -70.61698,
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_longitude: number = -70.61698;

  @ApiPropertyOptional({
    description: 'Pickup ready datetime (if not provided, will be generated automatically)',
    example: '2025-11-02T15:30:00.000Z',
    default: '2025-11-02T15:30:00.000Z',
  })
  @IsOptional()
  @IsString()
  pickup_ready_dt?: string = '2025-11-02T15:30:00.000Z';

  @ApiPropertyOptional({
    description: 'Pickup deadline datetime (if not provided, will be generated automatically)',
    example: '2025-11-02T16:00:00.000Z',
    default: '2025-11-02T16:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  pickup_deadline_dt?: string = '2025-11-02T16:00:00.000Z';

  @ApiPropertyOptional({
    description: 'Dropoff ready datetime (if not provided, will be generated automatically)',
    example: '2025-11-02T15:55:00.000Z',
    default: '2025-11-02T15:55:00.000Z',
  })
  @IsOptional()
  @IsString()
  dropoff_ready_dt?: string = '2025-11-02T15:55:00.000Z';

  @ApiPropertyOptional({
    description: 'Dropoff deadline datetime (if not provided, will be generated automatically)',
    example: '2025-11-02T16:15:00.000Z',
    default: '2025-11-02T16:15:00.000Z',
  })
  @IsOptional()
  @IsString()
  dropoff_deadline_dt?: string = '2025-11-02T16:15:00.000Z';

  @ApiProperty({
    description: 'Pickup phone number',
    example: '+56912345678',
    default: '+56912345678',
  })
  @IsNotEmpty()
  @IsString()
  pickup_phone_number: string = '+56912345678';

  @ApiProperty({
    description: 'Dropoff phone number',
    example: '+56987654321',
    default: '+56987654321',
  })
  @IsNotEmpty()
  @IsString()
  dropoff_phone_number: string = '+56987654321';

  @ApiProperty({
    description: 'Total value of manifest items in cents',
    example: 2500,
    default: 2500,
  })
  @IsNotEmpty()
  @IsNumber()
  manifest_total_value: number = 2500;

  @ApiProperty({
    description: 'External store identifier',
    example: 'store_12345',
    default: 'store_12345',
  })
  @IsNotEmpty()
  @IsString()
  external_store_id: string = 'store_12345';
}

export class ListDeliveriesDto {
  @ApiPropertyOptional({
    description: 'Maximum number of deliveries to return',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Number of deliveries to skip',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Filter by delivery status',
    example: 'pending',
    enum: ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by external store ID',
    example: 'store_12345',
  })
  @IsOptional()
  @IsString()
  external_store_id?: string;

  @ApiPropertyOptional({
    description: 'Filter deliveries created after this date',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filter deliveries created before this date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  created_before?: string;
}

export class BarcodeDto {
  @ApiProperty({
    description: 'Barcode value',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiProperty({
    description: 'Barcode type',
    example: 'CODE128',
    enum: ['CODE128', 'CODE39', 'QR', 'EAN13', 'EAN8', 'UPC_A', 'UPC_E'],
  })
  @IsNotEmpty()
  @IsString()
  type: string;
}

export class SignatureRequirementDto {
  @ApiProperty({
    description: 'Whether signature requirement is enabled',
    example: true,
  })
  @IsNotEmpty()
  enabled: boolean;

  @ApiProperty({
    description: 'Whether to collect signer name',
    example: true,
  })
  @IsOptional()
  collect_signer_name?: boolean;

  @ApiProperty({
    description: 'Whether to collect signer relationship',
    example: false,
  })
  @IsOptional()
  collect_signer_relationship?: boolean;
}

export class IdentificationDto {
  @ApiProperty({
    description: 'Minimum age for identification',
    example: 18,
  })
  @IsNotEmpty()
  @IsNumber()
  min_age: number;
}

export class PincodeDto {
  @ApiProperty({
    description: 'Whether pincode is enabled',
    example: true,
  })
  @IsNotEmpty()
  enabled: boolean;
}

export class VerificationDto {
  @ApiProperty({
    description: 'Whether signature is required',
    example: true,
  })
  @IsOptional()
  signature?: boolean;

  @ApiProperty({
    description: 'Signature requirement details',
    type: SignatureRequirementDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SignatureRequirementDto)
  signature_requirement?: SignatureRequirementDto;

  @ApiProperty({
    description: 'List of barcodes to verify',
    type: [BarcodeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BarcodeDto)
  barcodes?: BarcodeDto[];

  @ApiProperty({
    description: 'Pincode verification details',
    type: PincodeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PincodeDto)
  pincode?: PincodeDto;

  @ApiProperty({
    description: 'Identification requirements',
    type: IdentificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IdentificationDto)
  identification?: IdentificationDto;

  @ApiProperty({
    description: 'Whether picture is required',
    example: true,
  })
  @IsOptional()
  picture?: boolean;
}

export class DimensionsDto {
  @ApiProperty({
    description: 'Length of the item',
    example: 30,
  })
  @IsNotEmpty()
  @IsNumber()
  length: number;

  @ApiProperty({
    description: 'Height of the item',
    example: 20,
  })
  @IsNotEmpty()
  @IsNumber()
  height: number;

  @ApiProperty({
    description: 'Depth of the item',
    example: 15,
  })
  @IsNotEmpty()
  @IsNumber()
  depth: number;
}

export class ManifestItemDto {
  @ApiProperty({
    description: 'Name of the item',
    example: 'Pizza Margherita',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Quantity of items',
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'Size of the item',
    example: 'medium',
    enum: ['small', 'medium', 'large', 'xlarge'],
  })
  @IsNotEmpty()
  @IsString()
  size: string;

  @ApiProperty({
    description: 'Dimensions of the item',
    type: DimensionsDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions: DimensionsDto;

  @ApiProperty({
    description: 'Price of the item in cents',
    example: 1500,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Whether item must be kept upright',
    example: true,
  })
  @IsNotEmpty()
  must_be_upright: boolean;

  @ApiProperty({
    description: 'Weight of the item in grams',
    example: 500,
  })
  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @ApiProperty({
    description: 'VAT percentage',
    example: 21,
  })
  @IsNotEmpty()
  @IsNumber()
  vat_percentage: number;
}

export class MerchantAccountDto {
  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  @IsNotEmpty()
  @IsString()
  account_created_at: string;

  @ApiProperty({
    description: 'Merchant email',
    example: 'merchant@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class DeviceDto {
  @ApiProperty({
    description: 'Device ID',
    example: 'device_12345',
  })
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class ExternalUserInfoDto {
  @ApiProperty({
    description: 'Merchant account information',
    type: MerchantAccountDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MerchantAccountDto)
  merchant_account?: MerchantAccountDto;

  @ApiProperty({
    description: 'Device information',
    type: DeviceDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceDto)
  device?: DeviceDto;
}

export class RoboCourierSpecificationDto {
  @ApiProperty({
    description: 'Robo courier mode',
    example: 'auto',
    enum: ['auto', 'manual'],
  })
  @IsNotEmpty()
  @IsString()
  mode: string;
}

export class TestSpecificationsDto {
  @ApiProperty({
    description: 'Robo courier specifications',
    type: RoboCourierSpecificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RoboCourierSpecificationDto)
  robo_courier_specification?: RoboCourierSpecificationDto;
}

export class CreateDeliveryDto {
  @ApiProperty({
    description: 'Dropoff address',
    example: 'Av. Providencia 1200, Providencia, Santiago, Chile',
  })
  @IsNotEmpty()
  @IsString()
  dropoff_address: string;

  @ApiProperty({
    description: 'Dropoff contact name',
    example: 'Carlos González',
  })
  @IsNotEmpty()
  @IsString()
  dropoff_name: string;

  @ApiProperty({
    description: 'Dropoff phone number',
    example: '+56987654321',
  })
  @IsNotEmpty()
  @IsString()
  dropoff_phone_number: string;

  @ApiProperty({
    description: 'List of manifest items',
    type: [ManifestItemDto],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManifestItemDto)
  manifest_items: ManifestItemDto[];

  @ApiProperty({
    description: 'Pickup address',
    example: 'Av. Providencia 1234, Providencia, Santiago, Chile',
  })
  @IsNotEmpty()
  @IsString()
  pickup_address: string;

  @ApiProperty({
    description: 'Pickup contact name',
    example: 'María Rodríguez',
  })
  @IsNotEmpty()
  @IsString()
  pickup_name: string;

  @ApiProperty({
    description: 'Pickup phone number',
    example: '+56912345678',
  })
  @IsNotEmpty()
  @IsString()
  pickup_phone_number: string;

  @ApiProperty({
    description: 'Pickup business name',
    example: 'Pizzería Don Mario',
  })
  @IsOptional()
  @IsString()
  pickup_business_name?: string;

  @ApiProperty({
    description: 'Pickup latitude',
    example: -33.4189,
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_latitude: number;

  @ApiProperty({
    description: 'Pickup longitude',
    example: -70.6069,
  })
  @IsNotEmpty()
  @IsNumber()
  pickup_longitude: number;

  @ApiProperty({
    description: 'Pickup notes',
    example: 'Ring doorbell twice',
  })
  @IsOptional()
  @IsString()
  pickup_notes?: string;

  @ApiProperty({
    description: 'Pickup verification requirements',
    type: VerificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationDto)
  pickup_verification?: VerificationDto;

  @ApiProperty({
    description: 'Dropoff business name',
    example: 'Edificio Corporativo',
  })
  @IsOptional()
  @IsString()
  dropoff_business_name?: string;

  @ApiProperty({
    description: 'Dropoff latitude',
    example: -33.4417,
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_latitude: number;

  @ApiProperty({
    description: 'Dropoff longitude',
    example: -70.6441,
  })
  @IsNotEmpty()
  @IsNumber()
  dropoff_longitude: number;

  @ApiProperty({
    description: 'Dropoff notes',
    example: 'Leave at reception',
  })
  @IsOptional()
  @IsString()
  dropoff_notes?: string;

  @ApiProperty({
    description: 'Dropoff seller notes',
    example: 'Handle with care',
  })
  @IsOptional()
  @IsString()
  dropoff_seller_notes?: string;

  @ApiProperty({
    description: 'Dropoff verification requirements',
    type: VerificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationDto)
  dropoff_verification?: VerificationDto;

  @ApiProperty({
    description: 'Deliverable action',
    example: 'deliverable_action_meet_at_door',
    enum: ['deliverable_action_meet_at_door', 'deliverable_action_leave_at_door'],
  })
  @IsNotEmpty()
  @IsString()
  deliverable_action: string;

  @ApiProperty({
    description: 'Manifest reference',
    example: 'ORDER_12345',
  })
  @IsOptional()
  @IsString()
  manifest_reference?: string;

  @ApiProperty({
    description: 'Total value of manifest in cents',
    example: 3000,
  })
  @IsNotEmpty()
  @IsNumber()
  manifest_total_value: number;

  @ApiProperty({
    description: 'Quote ID from create quote endpoint',
    example: 'quote_abc123xyz',
  })
  @IsOptional()
  @IsString()
  quote_id?: string;

  @ApiProperty({
    description: 'Undeliverable action. Default is "return". Cannot be "leave_at_door" when signature, PIN, or ID verification requirements are applied.',
    example: 'return',
    enum: ['leave_at_door', 'return', 'discard'],
    default: 'return',
  })
  @IsNotEmpty()
  @IsString()
  undeliverable_action: string;

  @ApiPropertyOptional({
    description: 'Pickup ready datetime (if not provided, will be generated automatically)',
    example: '2025-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsString()
  pickup_ready_dt?: string;

  @ApiPropertyOptional({
    description: 'Pickup deadline datetime (if not provided, will be generated automatically)',
    example: '2025-01-15T11:00:00Z',
  })
  @IsOptional()
  @IsString()
  pickup_deadline_dt?: string;

  @ApiPropertyOptional({
    description: 'Dropoff ready datetime (if not provided, will be generated automatically)',
    example: '2025-01-15T11:30:00Z',
  })
  @IsOptional()
  @IsString()
  dropoff_ready_dt?: string;

  @ApiPropertyOptional({
    description: 'Dropoff deadline datetime (if not provided, will be generated automatically)',
    example: '2025-01-15T12:00:00Z',
  })
  @IsOptional()
  @IsString()
  dropoff_deadline_dt?: string;

  @ApiProperty({
    description: 'Whether dropoff signature is required',
    example: true,
  })
  @IsNotEmpty()
  requires_dropoff_signature: boolean;

  @ApiProperty({
    description: 'Whether ID verification is required',
    example: false,
  })
  @IsNotEmpty()
  requires_id: boolean;

  @ApiProperty({
    description: 'Tip amount in cents',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  tip?: number;

  @ApiProperty({
    description: 'Idempotency key for request deduplication',
    example: 'delivery_12345_2025_01_15',
  })
  @IsOptional()
  @IsString()
  idempotency_key?: string;

  @ApiProperty({
    description: 'External store ID',
    example: 'store_santiago_123',
  })
  @IsNotEmpty()
  @IsString()
  external_store_id: string;

  @ApiProperty({
    description: 'Return verification requirements',
    type: VerificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationDto)
  return_verification?: VerificationDto;

  @ApiProperty({
    description: 'External user information',
    type: ExternalUserInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExternalUserInfoDto)
  external_user_info?: ExternalUserInfoDto;

  @ApiProperty({
    description: 'External ID for tracking',
    example: 'ext_delivery_12345',
  })
  @IsOptional()
  @IsString()
  external_id?: string;

  @ApiProperty({
    description: 'Test specifications',
    type: TestSpecificationsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TestSpecificationsDto)
  test_specifications?: TestSpecificationsDto;
}
