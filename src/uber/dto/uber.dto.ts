import { IsNotEmpty, IsObject, ValidateNested, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
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

export class ManifestItemDto {
  @ApiProperty({
    description: 'Name or description of the item',
    example: 'Pizza',
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

  @ApiPropertyOptional({
    description: 'Size of the item (small, medium, large, xlarge)',
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  size?: string;
}

export class CreateDeliveryDto {
  @ApiProperty({
    description: 'Pickup location details',
    type: LocationDto,
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  @ApiProperty({
    description: 'Dropoff location details',
    type: LocationDto,
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  dropoff: LocationDto;

  @ApiPropertyOptional({
    description: 'List of items being delivered',
    type: [ManifestItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManifestItemDto)
  manifest?: ManifestItemDto[];

  @ApiPropertyOptional({
    description: 'Unix timestamp (seconds) when the package will be ready for pickup',
    example: 1640000000,
  })
  @IsOptional()
  @IsNumber()
  pickup_ready_dt?: number;

  @ApiPropertyOptional({
    description: 'Unix timestamp (seconds) for dropoff deadline',
    example: 1640003600,
  })
  @IsOptional()
  @IsNumber()
  dropoff_deadline_dt?: number;
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
