import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Length } from 'class-validator';

export class CreateAvailableCountryDto {
  @ApiProperty({
    description: 'Country name',
    example: 'United States'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ISO 2-letter country code',
    example: 'US',
    minLength: 2,
    maxLength: 2
  })
  @IsString()
  @Length(2, 2)
  code: string;

  @ApiProperty({
    description: 'Country flag emoji or URL',
    example: '🇺🇸',
    required: false
  })
  @IsOptional()
  @IsString()
  flag?: string;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Whether the country is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAvailableCountryDto {
  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'ISO 2-letter country code',
    example: 'US',
    minLength: 2,
    maxLength: 2,
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  code?: string;

  @ApiProperty({
    description: 'Country flag emoji or URL',
    example: '🇺🇸',
    required: false
  })
  @IsOptional()
  @IsString()
  flag?: string;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Whether the country is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AvailableCountryResponseDto {
  @ApiProperty({
    description: 'Country ID',
    example: 'country-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States'
  })
  name: string;

  @ApiProperty({
    description: 'ISO 2-letter country code',
    example: 'US'
  })
  code: string;

  @ApiProperty({
    description: 'Country flag emoji or URL',
    example: '🇺🇸'
  })
  flag: string | null;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1
  })
  order: number;

  @ApiProperty({
    description: 'Whether the country is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Country creation date',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Country last update date',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}
