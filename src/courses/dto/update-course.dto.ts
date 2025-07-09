import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiProperty({
    description: 'Course title',
    example: 'Advanced Web Development',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Course description',
    example: 'Advanced web development concepts and frameworks',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Instructor user ID',
    example: 'a1c8add5-4cec-4d31-b9db-a1469cfc521d',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  instructorId?: string;

  @ApiProperty({
    description: 'Instructor name',
    example: 'Jane Smith',
    required: false,
  })
  @IsString()
  @IsOptional()
  instructorName?: string;

  @ApiProperty({
    description: 'Course image URL',
    example: 'https://example.com/course-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Demo video ID from Cloudflare Stream',
    example: 'video-uuid-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  demoVideoId?: string;
} 