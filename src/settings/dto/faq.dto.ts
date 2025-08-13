import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({
    description: 'FAQ title',
    example: 'How to reset password?'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'FAQ question',
    example: 'I forgot my password, how can I reset it?'
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'FAQ answer',
    example: 'You can reset your password by clicking on the "Forgot Password" link on the login page.'
  })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({
    description: 'FAQ display order (index)',
    example: 1,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  index: number;

  @ApiProperty({
    description: 'Whether the FAQ is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFaqDto {
  @ApiProperty({
    description: 'FAQ title',
    example: 'How to reset password?',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    description: 'FAQ question',
    example: 'I forgot my password, how can I reset it?',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  question?: string;

  @ApiProperty({
    description: 'FAQ answer',
    example: 'You can reset your password by clicking on the "Forgot Password" link on the login page.',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  answer?: string;

  @ApiProperty({
    description: 'FAQ display order (index)',
    example: 1,
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  index?: number;

  @ApiProperty({
    description: 'Whether the FAQ is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FaqResponseDto {
  @ApiProperty({
    description: 'FAQ ID',
    example: 'faq-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'FAQ title',
    example: 'How to reset password?'
  })
  title: string;

  @ApiProperty({
    description: 'FAQ question',
    example: 'I forgot my password, how can I reset it?'
  })
  question: string;

  @ApiProperty({
    description: 'FAQ answer',
    example: 'You can reset your password by clicking on the "Forgot Password" link on the login page.'
  })
  answer: string;

  @ApiProperty({
    description: 'FAQ display order (index)',
    example: 1
  })
  index: number;

  @ApiProperty({
    description: 'Whether the FAQ is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'FAQ creation date',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'FAQ last update date',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}
