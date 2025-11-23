import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsBoolean, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ServicesDto {
  @ApiPropertyOptional({ 
    description: 'Servicio de delivery habilitado',
    type: Boolean,
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  delivery?: boolean;

  @ApiPropertyOptional({ 
    description: 'Servicio de mensajería habilitado',
    type: Boolean,
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  messaging?: boolean;

  @ApiPropertyOptional({ 
    description: 'Servicio de pagos habilitado',
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
    description: 'Nombre del tenant. Se obtiene de la tabla tenants.name en Supabase',
    type: String,
    example: 'Mi Tenant',
    maxLength: 255
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Descripción del tenant',
    type: String,
    example: 'Tenant para pruebas de desarrollo'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'API Key pública del tenant. Debe ser único en la base de datos.',
    type: String,
    example: 'example_key',
    required: true
  })
  @IsString()
  apiKey: string;

  @ApiProperty({ 
    description: 'API Secret del tenant usado para firmar JWT. ⚠️ NUNCA debe exponerse al frontend.',
    type: String,
    example: 'demo_123',
    required: true
  })
  @IsString()
  apiSecret: string;

  @ApiPropertyOptional({ 
    description: 'Servicios habilitados para el tenant',
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
