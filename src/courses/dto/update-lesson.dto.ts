import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLessonDto {
  @ApiProperty({
    description: 'Lesson title',
    example: 'Advanced HTML Concepts',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Lesson content',
    example: 'Advanced HTML features including semantic elements...',
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
} 