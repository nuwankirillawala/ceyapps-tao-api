import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMaterialDto {
  @ApiProperty({
    description: 'Material title',
    example: 'Advanced HTML Reference',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Material file URL',
    example: 'https://example.com/advanced-html-reference.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;
} 