import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class DeliveryQuoteInternalDto {
  @ApiProperty({
    description: 'Dropoff address',
    example: '{"street_address":["Av. Quilín 110"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
  })
  @IsNotEmpty()
  @IsString()
  dropoff_address: string;

  @ApiProperty({
    description: 'Pickup address',
    example: '{"street_address":["Av. Quilín 107"],"city":"Santiago","state":"Región Metropolitana","zip_code":"7810000","country":"CL"}',
  })
  @IsNotEmpty()
  @IsString()
  pickup_address: string;

  @ApiProperty({ description: 'Pickup latitude coordinate', example: -33.4865639 })
  @IsNotEmpty()
  @IsNumber()
  pickup_latitude: number;

  @ApiProperty({ description: 'Pickup longitude coordinate', example: -70.6169702 })
  @IsNotEmpty()
  @IsNumber()
  pickup_longitude: number;

  @ApiProperty({ description: 'Dropoff latitude coordinate', example: -33.48657 })
  @IsNotEmpty()
  @IsNumber()
  dropoff_latitude: number;

  @ApiProperty({ description: 'Dropoff longitude coordinate', example: -70.61698 })
  @IsNotEmpty()
  @IsNumber()
  dropoff_longitude: number;

  @ApiPropertyOptional({ description: 'Pickup ready datetime', example: '2025-11-02T15:30:00.000Z' })
  @IsOptional()
  @IsString()
  pickup_ready_dt?: string;

  @ApiPropertyOptional({ description: 'Pickup deadline datetime', example: '2025-11-02T16:00:00.000Z' })
  @IsOptional()
  @IsString()
  pickup_deadline_dt?: string;

  @ApiPropertyOptional({ description: 'Dropoff ready datetime', example: '2025-11-02T15:55:00.000Z' })
  @IsOptional()
  @IsString()
  dropoff_ready_dt?: string;

  @ApiPropertyOptional({ description: 'Dropoff deadline datetime', example: '2025-11-02T16:15:00.000Z' })
  @IsOptional()
  @IsString()
  dropoff_deadline_dt?: string;

  @ApiProperty({ description: 'Pickup phone number', example: '+56912345678' })
  @IsNotEmpty()
  @IsString()
  pickup_phone_number: string;

  @ApiProperty({ description: 'Dropoff phone number', example: '+56987654321' })
  @IsNotEmpty()
  @IsString()
  dropoff_phone_number: string;

  @ApiProperty({ description: 'Total value of manifest items in cents', example: 2500 })
  @IsNotEmpty()
  @IsNumber()
  manifest_total_value: number;

  @ApiProperty({ description: 'External store identifier', example: 'store_12345' })
  @IsNotEmpty()
  @IsString()
  external_store_id: string;
}

