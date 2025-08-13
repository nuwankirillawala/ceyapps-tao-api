import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HelpCategory {
  GENERAL = 'GENERAL',
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  COURSE_ACCESS = 'COURSE_ACCESS',
  PAYMENT = 'PAYMENT',
  ACCOUNT = 'ACCOUNT',
  OTHER = 'OTHER'
}

export class ContactSupportDto {
  @ApiProperty({
    description: 'Subject of the support request',
    example: 'Payment Issue'
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Message content',
    example: 'I am having trouble with my payment method...'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Category of the support request',
    enum: HelpCategory,
    example: HelpCategory.BILLING
  })
  @IsEnum(HelpCategory)
  category: HelpCategory;

  @ApiPropertyOptional({
    description: 'User email for response',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Additional contact information',
    example: '+1234567890'
  })
  @IsOptional()
  @IsString()
  contactInfo?: string;
}

export class FaqQueryDto {
  @ApiPropertyOptional({
    description: 'Search query for FAQ',
    example: 'payment method'
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'FAQ category filter',
    enum: HelpCategory,
    example: HelpCategory.BILLING
  })
  @IsOptional()
  @IsEnum(HelpCategory)
  category?: HelpCategory;
}
