import { IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Level, Category } from '../enums/course.enums';

export class CreatePricingDto {
  @ApiProperty({
    description: 'Price amount',
    example: 99.99,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Country code for pricing',
    example: 'US',
  })
  @IsString()
  country: string;
}

export class CreateCourseDto {
  @ApiProperty({
    description: 'Course title',
    example: 'Advanced Bartending Techniques',
  })
  @IsString()
  title: string;

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
    description: 'Demo video ID from Cloudflare Stream (optional)',
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
    required: true,
  })
  @IsEnum(Level)
  level: Level;

  @ApiProperty({
    description: 'Course Category',
    enum: Category,
    example: Category.BARTENDING,
    required: true,
  })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({
    description: 'Course pricing options',
    type: [CreatePricingDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePricingDto)
  @IsOptional()
  pricing?: CreatePricingDto[];
} 