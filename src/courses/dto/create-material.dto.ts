import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Material title',
    example: 'HTML Cheat Sheet',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Material file URL',
    example: 'https://example.com/html-cheatsheet.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;
} 