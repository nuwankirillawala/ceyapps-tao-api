import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({
    description: 'Lesson title',
    example: 'Introduction to HTML',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Lesson content',
    example: 'HTML is the standard markup language for creating web pages...',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Video ID from Cloudflare Stream',
    example: 'video-uuid-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  videoId?: string;

  @ApiProperty({
    description: 'Array of material IDs to associate with this lesson',
    example: ['material-uuid-1', 'material-uuid-2'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  materialIds?: string[];
} 