// src/auth/auth.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '.prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { 
  RegisterDto, 
  LoginDto, 
  ResetPasswordDto, 
  ChangePasswordDto,
  AuthResponseDto 
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() body: RegisterDto) {
    const { email, password, name, role } = body;
    return this.authService.register(email, password, name, role);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() body: LoginDto) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged out',
    type: AuthResponseDto 
  })
  async logout(@Req() req) {
    return this.authService.logout(req.user.userId);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Request password reset or reset password' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset instructions sent or password updated',
    type: AuthResponseDto 
  })
  async resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (for logged-in users)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password successfully changed',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Req() req,
    @Body() data: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.userId, data);
  }
}
