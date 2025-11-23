import { IsNotEmpty, IsObject, ValidateNested, IsOptional, IsString, IsNumber, IsArray, ValidateIf } from 'class-validator';
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
  @ApiPropertyOptional({
    description: 'Length of the item',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiPropertyOptional({
    description: 'Height of the item',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    description: 'Depth of the item',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  depth?: number;
}

export class ManifestItemDto {
  @ApiPropertyOptional({
    description: 'Name of the item',
    example: 'Pizza Margherita',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Quantity of items',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Size of the item',
    example: 'medium',
    enum: ['small', 'medium', 'large', 'xlarge'],
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    description: 'Dimensions of the item',
    type: DimensionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiPropertyOptional({
    description: 'Price of the item in cents',
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Whether item must be kept upright',
    example: true,
  })
  @IsOptional()
  must_be_upright?: boolean;

  @ApiPropertyOptional({
    description: 'Weight of the item in grams',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({
    description: 'VAT percentage',
    example: 21,
  })
  @IsOptional()
  @IsNumber()
  vat_percentage?: number;
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
  @ApiPropertyOptional({
    description: 'Dropoff address',
    example: 'Av. Providencia 1200, Providencia, Santiago, Chile',
  })
  @IsOptional()
  @IsString()
  dropoff_address?: string;

  @ApiPropertyOptional({
    description: 'Dropoff contact name',
    example: 'Carlos González',
  })
  @IsOptional()
  @IsString()
  dropoff_name?: string;

  @ApiPropertyOptional({
    description: 'Dropoff phone number',
    example: '+56987654321',
  })
  @IsOptional()
  @IsString()
  dropoff_phone_number?: string;

  @ApiPropertyOptional({
    description: 'List of manifest items',
    type: [ManifestItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManifestItemDto)
  manifest_items?: ManifestItemDto[];

  @ApiPropertyOptional({
    description: 'Pickup address',
    example: 'Av. Providencia 1234, Providencia, Santiago, Chile',
  })
  @IsOptional()
  @IsString()
  pickup_address?: string;

  @ApiPropertyOptional({
    description: 'Pickup contact name',
    example: 'María Rodríguez',
  })
  @IsOptional()
  @IsString()
  pickup_name?: string;

  @ApiPropertyOptional({
    description: 'Pickup phone number',
    example: '+56912345678',
  })
  @IsOptional()
  @IsString()
  pickup_phone_number?: string;

  @ApiProperty({
    description: 'Pickup business name',
    example: 'Pizzería Don Mario',
  })
  @IsOptional()
  @IsString()
  pickup_business_name?: string;

  @ApiPropertyOptional({
    description: 'Pickup latitude',
    example: -33.4189,
  })
  @IsOptional()
  @IsNumber()
  pickup_latitude?: number;

  @ApiPropertyOptional({
    description: 'Pickup longitude',
    example: -70.6069,
  })
  @IsOptional()
  @IsNumber()
  pickup_longitude?: number;

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

  @ApiPropertyOptional({
    description: 'Dropoff latitude',
    example: -33.4417,
  })
  @IsOptional()
  @IsNumber()
  dropoff_latitude?: number;

  @ApiPropertyOptional({
    description: 'Dropoff longitude',
    example: -70.6441,
  })
  @IsOptional()
  @IsNumber()
  dropoff_longitude?: number;

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

  @ApiPropertyOptional({
    description: 'Deliverable action',
    example: 'deliverable_action_meet_at_door',
    enum: ['deliverable_action_meet_at_door', 'deliverable_action_leave_at_door'],
  })
  @IsOptional()
  @IsString()
  deliverable_action?: string;

  @ApiPropertyOptional({
    description: 'Manifest reference',
    example: 'ORDER_12345',
  })
  @IsOptional()
  @IsString()
  manifest_reference?: string;

  @ApiPropertyOptional({
    description: 'Total value of manifest in cents',
    example: 3000,
  })
  @IsOptional()
  @IsNumber()
  manifest_total_value?: number;

  @ApiProperty({
    description: 'Quote ID from create quote endpoint',
    example: 'quote_abc123xyz',
  })
  @IsOptional()
  @IsString()
  quote_id?: string;

  @ApiPropertyOptional({
    description: 'Undeliverable action. Default is "return". Cannot be "leave_at_door" when signature, PIN, or ID verification requirements are applied.',
    example: 'return',
    enum: ['leave_at_door', 'return', 'discard'],
    default: 'return',
  })
  @ValidateIf((o) => o.undeliverable_action !== undefined && o.undeliverable_action !== null && o.undeliverable_action !== '')
  @IsString()
  undeliverable_action?: string;

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

  @ApiPropertyOptional({
    description: 'Whether dropoff signature is required',
    example: true,
  })
  @IsOptional()
  requires_dropoff_signature?: boolean;

  @ApiPropertyOptional({
    description: 'Whether ID verification is required',
    example: false,
  })
  @IsOptional()
  requires_id?: boolean;

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

  @ApiPropertyOptional({
    description: 'External store ID',
    example: 'store_santiago_123',
  })
  @IsOptional()
  @IsString()
  external_store_id?: string;

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
