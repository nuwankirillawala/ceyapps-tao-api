import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Body, 
  Req, 
  UseGuards,
  NotFoundException,
  ForbiddenException 
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserService } from './user.service';
import { Role } from '.prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findById(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req,
    @Body() updateData: {
      name?: string;
      bio?: string;
      profilePicture?: Buffer;
    },
  ) {
    return this.userService.updateProfile(req.user.userId, updateData);
  }

  @Get(':userId')
  @Roles('ADMIN')
  async getUserDetails(@Param('userId') userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch(':userId/assign-role')
  @Roles('ADMIN')
  async assignRole(
    @Param('userId') userId: string,
    @Body() data: { role: Role },
    @Req() req,
  ) {
    if (userId === req.user.userId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    return this.userService.updateRole(userId, data.role);
  }
}
