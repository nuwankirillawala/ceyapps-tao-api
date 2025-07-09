import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Course title',
    example: 'Web Development Fundamentals',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Course description',
    example: 'Learn the basics of web development including HTML, CSS, and JavaScript',
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
} 