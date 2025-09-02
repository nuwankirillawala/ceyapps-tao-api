import {
  IsEnum,
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AdminCreateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User contact number',
    example: '+2348123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
  
  @ApiProperty({
    description: 'User role',
    example: Role.STUDENT,
    required: false,
    default: Role.STUDENT,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    required: true,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User profile image URL (optional)',
    example: 'https://example.com/profile-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profileImage?: string;
} 