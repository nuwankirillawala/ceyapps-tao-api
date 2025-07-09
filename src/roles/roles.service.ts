import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // 👥 Get all custom roles
  async getAllRoles() {
    return this.prisma.roleManagement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 🔍 Get custom role by ID
  async getRoleById(roleId: string) {
    const role = await this.prisma.roleManagement.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role;
  }

  // ➕ Create new custom role
  async createRole(createRoleDto: CreateRoleDto) {
    // Check if role name already exists
    const existingRole = await this.prisma.roleManagement.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new BadRequestException(`Role with name '${createRoleDto.name}' already exists`);
    }

    return this.prisma.roleManagement.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions || [],
        isActive: createRoleDto.isActive ?? true,
      },
    });
  }

  // �� Update custom role
  async updateRole(roleId: string, updateRoleDto: UpdateRoleDto) {
    // Check if role exists
    const existingRole = await this.getRoleById(roleId);

    // If name is being updated, check for uniqueness
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const roleWithSameName = await this.prisma.roleManagement.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (roleWithSameName) {
        throw new BadRequestException(`Role with name '${updateRoleDto.name}' already exists`);
      }
    }

    return this.prisma.roleManagement.update({
      where: { id: roleId },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        permissions: updateRoleDto.permissions,
        isActive: updateRoleDto.isActive,
      },
    });
  }

  // 🗑️ Delete custom role (soft delete)
  async deleteRole(roleId: string) {
    // Check if role exists
    await this.getRoleById(roleId);

    // Soft delete by setting isActive to false
    return this.prisma.roleManagement.update({
      where: { id: roleId },
      data: { isActive: false },
    });
  }

  // 📊 Get system roles (enum-based)
  async getSystemRoles() {
    return [
      { name: 'ADMIN', description: 'Full system access', permissions: ['read', 'write', 'delete', 'admin'] },
      { name: 'INSTRUCTOR', description: 'Can create and manage courses', permissions: ['read', 'write', 'create_courses'] },
      { name: 'STUDENT', description: 'Can view and enroll in courses', permissions: ['read', 'enroll'] },
    ];
  }

  // 📊 Get all roles (system + custom)
  async getAllRolesWithSystem() {
    const customRoles = await this.getAllRoles();
    const systemRoles = await this.getSystemRoles();

    return {
      system: systemRoles,
      custom: customRoles,
    };
  }

  // 🔍 Get role with usage statistics
  async getRoleWithStats(roleId: string) {
    const role = await this.prisma.roleManagement.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Get user count for this custom role (if it's being used)
    const userCount = await this.prisma.user.count({
      where: {
        // Note: This would need to be implemented if you want to track custom role usage
        // For now, we'll return 0 as custom roles are separate from the enum system
      },
    });

    return {
      ...role,
      userCount,
      type: 'custom',
    };
  }
} 