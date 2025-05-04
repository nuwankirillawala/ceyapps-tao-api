import { ApiProperty } from '@nestjs/swagger';
import { Role } from '.prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role: Role;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ required: false, example: 'oldPassword123' })
  currentPassword?: string;

  @ApiProperty({ required: false, example: 'newPassword123' })
  newPassword?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token?: string;

  @ApiProperty({
    example: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'STUDENT'
    }
  })
  user?: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
} 