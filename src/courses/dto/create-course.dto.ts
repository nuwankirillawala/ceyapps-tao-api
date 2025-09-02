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

  @ApiProperty({
    description: 'Currency code (e.g., USD, EUR)',
    example: 'USD',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Region for pricing (optional)',
    example: 'North America',
    required: false,
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Is this pricing active?',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Pricing valid from date',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  validFrom?: Date;

  @ApiProperty({
    description: 'Pricing valid to date',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  validTo?: Date;

  @ApiProperty({
    description: 'Discount amount (optional)',
    example: 10.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiProperty({
    description: 'Original price before discount (optional)',
    example: 120.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @ApiProperty({
    description: 'Pricing tier (optional)',
    example: 'PREMIUM',
    required: false,
  })
  @IsOptional()
  @IsString()
  pricingTier?: string;
  
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
    description: 'Course thumbnail URL (optional)',
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({
    description: 'Course profile image URL (optional)',
    example: 'https://example.com/profile-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profileImage?: string;

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