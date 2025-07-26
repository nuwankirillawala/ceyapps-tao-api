import {
  IsEnum,
  IsEmail,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User contact Number',
    example: '+2348123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
  
  @ApiProperty({
    description: 'User role',
    example: Role.ADMIN,
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({
    description: 'User Password',   
    example: 'password',
    required: false,
  })
  @IsString()
  password: string;
}
