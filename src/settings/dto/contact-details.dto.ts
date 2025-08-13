import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';

export enum ContactType {
  MOBILE = 'MOBILE',
  EMAIL = 'EMAIL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  ADDRESS = 'ADDRESS',
  PHONE = 'PHONE',
  WEBSITE = 'WEBSITE'
}

export class CreateContactDetailsDto {
  @ApiProperty({
    description: 'Type of contact detail',
    enum: ContactType,
    example: ContactType.EMAIL
  })
  @IsEnum(ContactType)
  type: ContactType;

  @ApiProperty({
    description: 'Label for the contact detail',
    example: 'Support Email'
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'Value of the contact detail',
    example: 'support@example.com'
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: 'Icon class or URL for the contact detail',
    example: 'fas fa-envelope',
    required: false
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Whether the contact detail is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateContactDetailsDto {
  @ApiProperty({
    description: 'Type of contact detail',
    enum: ContactType,
    example: ContactType.EMAIL,
    required: false
  })
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @ApiProperty({
    description: 'Label for the contact detail',
    example: 'Support Email',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @ApiProperty({
    description: 'Value of the contact detail',
    example: 'support@example.com',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  value?: string;

  @ApiProperty({
    description: 'Icon class or URL for the contact detail',
    example: 'fas fa-envelope',
    required: false
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Whether the contact detail is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ContactDetailsResponseDto {
  @ApiProperty({
    description: 'Contact detail ID',
    example: 'contact-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Type of contact detail',
    enum: ContactType,
    example: ContactType.EMAIL
  })
  type: ContactType;

  @ApiProperty({
    description: 'Label for the contact detail',
    example: 'Support Email'
  })
  label: string;

  @ApiProperty({
    description: 'Value of the contact detail',
    example: 'support@example.com'
  })
  value: string;

  @ApiProperty({
    description: 'Icon class or URL for the contact detail',
    example: 'fas fa-envelope'
  })
  icon: string | null;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1
  })
  order: number;

  @ApiProperty({
    description: 'Whether the contact detail is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Contact detail creation date',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Contact detail last update date',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}
