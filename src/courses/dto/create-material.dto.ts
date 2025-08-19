import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Material title',
    example: 'HTML Cheat Sheet',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Course ID that this material belongs to',
    example: 'course-uuid-123',
  })
  @IsString()
  @IsUUID()
  courseId: string;

  @ApiProperty({
    description: 'Lesson ID that this material belongs to (optional for course-level materials)',
    example: 'lesson-uuid-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiProperty({
    description: 'Material file URL',
    example: 'https://example.com/html-cheatsheet.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;
} 