import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AssignRoleDto {
  @ApiProperty({
    description: 'User role to assign',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  role: Role;
} 