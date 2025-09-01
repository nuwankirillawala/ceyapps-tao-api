import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsUUID, IsDateString, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementType, AnnouncementPriority, AnnouncementCategory, AnnouncementDisplayType } from '../enums/announcement.enums';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Title of the announcement',
    example: 'New Course Available'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Content of the announcement',
    example: 'We have added a new advanced mixology course. Check it out!'
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Type of announcement',
    enum: AnnouncementType,
    example: AnnouncementType.ALL_USERS
  })
  @IsEnum(AnnouncementType)
  type: AnnouncementType;

  @ApiPropertyOptional({
    description: 'Priority level of the announcement',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.P1
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority = AnnouncementPriority.P3;

  @ApiPropertyOptional({
    description: 'Category of the announcement',
    enum: AnnouncementCategory,
    example: AnnouncementCategory.GENERAL
  })
  @IsOptional()
  @IsEnum(AnnouncementCategory)
  category?: AnnouncementCategory = AnnouncementCategory.GENERAL;

  @ApiPropertyOptional({
    description: 'Display type for the announcement',
    enum: AnnouncementDisplayType,
    example: AnnouncementDisplayType.BANNER
  })
  @IsOptional()
  @IsEnum(AnnouncementDisplayType)
  displayType?: AnnouncementDisplayType = AnnouncementDisplayType.IN_APP;

  @ApiPropertyOptional({
    description: 'Course ID for COURSE_STUDENTS type announcements',
    example: 'course-uuid-123'
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Target roles for SPECIFIC_ROLES type announcements',
    example: ['ADMIN', 'INSTRUCTOR']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @ApiPropertyOptional({
    description: 'Target user IDs for SPECIFIC_USERS type announcements',
    example: ['user-uuid-1', 'user-uuid-2']
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  targetUserIds?: string[];

  @ApiPropertyOptional({
    description: 'Whether the announcement is active',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Expiration date for the announcement',
    example: '2024-12-31T23:59:59.000Z'
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Start date for the announcement (when it should become visible)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startsAt?: Date;

  @ApiPropertyOptional({
    description: 'Action URL for clickable announcements',
    example: 'https://example.com/course/123'
  })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'Action text for clickable announcements',
    example: 'View Course'
  })
  @IsOptional()
  @IsString()
  actionText?: string;

  @ApiPropertyOptional({
    description: 'Whether to send email notification',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether to show as banner on homepage',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  showAsBanner?: boolean = false;

  @ApiPropertyOptional({
    description: 'Image URL for the announcement',
    example: 'https://example.com/announcement-image.jpg'
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing announcements',
    example: ['new-course', 'mixology', 'advanced']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreatePublicAnnouncementDto {
  @ApiProperty({
    description: 'Title of the announcement',
    example: 'Welcome to Tao Platform'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Content of the announcement',
    example: 'Welcome to our bartending and mixology learning platform!'
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Priority level of the announcement',
    enum: AnnouncementPriority,
    example: AnnouncementPriority.P2
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority = AnnouncementPriority.P3;

  @ApiPropertyOptional({
    description: 'Category of the announcement',
    enum: AnnouncementCategory,
    example: AnnouncementCategory.GENERAL
  })
  @IsOptional()
  @IsEnum(AnnouncementCategory)
  category?: AnnouncementCategory = AnnouncementCategory.GENERAL;

  @ApiPropertyOptional({
    description: 'Display type for the announcement',
    enum: AnnouncementDisplayType,
    example: AnnouncementDisplayType.BANNER
  })
  @IsOptional()
  @IsEnum(AnnouncementDisplayType)
  displayType?: AnnouncementDisplayType = AnnouncementDisplayType.BANNER;

  @ApiPropertyOptional({
    description: 'Action URL for clickable announcements',
    example: 'https://example.com/courses'
  })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'Action text for clickable announcements',
    example: 'Browse Courses'
  })
  @IsOptional()
  @IsString()
  actionText?: string;

  @ApiPropertyOptional({
    description: 'Whether to show as banner on homepage',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  showAsBanner?: boolean = true;

  @ApiPropertyOptional({
    description: 'Image URL for the announcement',
    example: 'https://example.com/welcome-banner.jpg'
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing announcements',
    example: ['welcome', 'general']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
} 