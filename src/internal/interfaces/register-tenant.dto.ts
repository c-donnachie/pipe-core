import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServicesDto {
  @ApiProperty({ description: 'Servicio de delivery habilitado', required: false })
  @IsBoolean()
  delivery?: boolean;

  @ApiProperty({ description: 'Servicio de mensajería habilitado', required: false })
  @IsBoolean()
  messaging?: boolean;

  @ApiProperty({ description: 'Servicio de pagos habilitado', required: false })
  @IsBoolean()
  payments?: boolean;
}

export class RegisterTenantDto {
  @ApiProperty({ description: 'ID único del tenant' })
  @IsString()
  tenantId: string;

  @ApiProperty({ description: 'API Key pública del tenant' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'API Secret del tenant (usado para firmar JWT)' })
  @IsString()
  apiSecret: string;

  @ApiProperty({ description: 'Servicios habilitados para el tenant', required: false })
  @IsObject()
  @ValidateNested()
  @Type(() => ServicesDto)
  services?: ServicesDto;
}
