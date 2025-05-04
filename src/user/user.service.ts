// src/user/user.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '.prisma/client';
import type { User } from '.prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ✅ Create a user in DB
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  // 🔍 Find a user by email
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      profilePicture?: Buffer;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async resetPassword(data: {
    email: string;
    currentPassword?: string;
    newPassword?: string;
    userId?: string;
  }): Promise<{ message: string }> {
    const user = await this.findByEmail(data.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If userId is provided (user is logged in), verify it matches
    if (data.userId && data.userId !== user.id) {
      throw new ForbiddenException('Cannot reset password for another user');
    }

    // If both passwords provided, it's a password change
    if (data.currentPassword && data.newPassword) {
      const isPasswordValid = await bcrypt.compare(
        data.currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password updated successfully' };
    }

    // If no passwords provided, initiate password reset
    // Here you would typically:
    // 1. Generate a reset token
    // 2. Send it via email
    // 3. Save the token in the database
    return { message: 'Password reset instructions sent to email' };
  }

  async toggleMfa(userId: string, enabled: boolean): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: enabled },
    });
  }

  async updateRole(userId: string, role: Role): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
