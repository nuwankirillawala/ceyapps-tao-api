import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async getAllRoles() {
    return this.rolesService.getAllRolesWithSystem();
  }

  @Get('system')
  async getSystemRoles() {
    return this.rolesService.getSystemRoles();
  }

  @Get('custom')
  async getCustomRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':roleId')
  async getRoleById(@Param('roleId') roleId: string) {
    return this.rolesService.getRoleWithStats(roleId);
  }

  @Post()
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Patch(':roleId')
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(roleId, updateRoleDto);
  }

  @Delete(':roleId')
  async deleteRole(@Param('roleId') roleId: string) {
    return this.rolesService.deleteRole(roleId);
  }
} 