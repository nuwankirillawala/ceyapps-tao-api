import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  @Get('me')
  getMe(@Req() req) {
    return req.user;
  }

  @Get('admin-only')
  @Roles('ADMIN')
  getAdminOnly() {
    return { message: 'Only admins can see this' };
  }
}
