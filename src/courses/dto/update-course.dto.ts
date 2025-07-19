import { IsString, IsOptional, IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Level, Category } from '@prisma/client';
import { CreatePricingDto } from './create-course.dto';

export class UpdateCourseDto {
  @ApiProperty({
    description: 'Course title',
    example: 'Advanced Bartending Techniques',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Course description',
    example: 'Master advanced bartending techniques and cocktail preparation',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Instructor user ID (optional if instructorName is provided)',
    example: 'a1c8add5-4cec-4d31-b9db-a1469cfc521d',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  instructorId?: string;

  @ApiProperty({
    description: 'Instructor name (optional if instructorId is provided)',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  instructorName?: string;

  @ApiProperty({
    description: 'Demo video ID from Cloudflare Stream',
    example: 'video-uuid-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  demoVideoId?: string;

  @ApiProperty({
    description: 'Course duration in hours',
    example: '10 hours',
    required: false,
  })
  @IsString()
  @IsOptional()
  courseDuration?: string;

  @ApiProperty({
    description: 'Course level',
    enum: Level,
    example: Level.BEGINNER,
    required: false,
  })
  @IsEnum(Level)
  @IsOptional()
  level?: Level;

  @ApiProperty({
    description: 'Course Category',
    enum: Category,
    example: Category.BARTENDING,
    required: false,
  })
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiProperty({
    description: 'Course pricing options to replace existing pricing',
    type: [CreatePricingDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePricingDto)
  @IsOptional()
  pricing?: CreatePricingDto[];
} 