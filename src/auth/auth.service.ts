// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RegionService } from 'src/region/region.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private regionService: RegionService,
  ) {}

  // ✅ Register a new user
  async register(email: string, password: string, name: string, role: Role) {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.createUser({
      email,
      password: hashedPassword,
      name,
      role,
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }

  // ✅ Login user and return JWT token
  async login(email: string, password: string, request?: any) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Detect user region if request is provided
    if (request) {
      try {
        const ip = this.regionService.extractIpFromRequest(request);
        if (ip) {
          const regionInfo = await this.regionService.getRegionFromIp(ip);
          if (regionInfo) {
            // Update user with region information
            await this.userService.updateUserRegion(user.id, {
              country: regionInfo.country,
              region: regionInfo.region,
              city: regionInfo.city,
              timezone: regionInfo.timezone,
              lastLoginAt: new Date(),
              lastLoginIp: ip,
            });
          }
        }
      } catch (error) {
        // Log error but don't fail login
        console.error('Error detecting user region:', error);
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return { access_token: token, user: user };
  }
}
