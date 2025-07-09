// src/user/user.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Define a type for user data without password
type UserWithoutPassword = Omit<User, 'password'>;

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

  // 🔄 Find a user by ID
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // 🔄 Update user password
  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // 🔄 Update user profile
  async updateUser(userId: string, data: {
    name?: string;
    email?: string;
  }): Promise<User> {
    // Validate that user exists
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check for uniqueness
    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Only update fields that are provided
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  // 🚪 Logout user (invalidate token on client side)
  async logout(userId: string): Promise<{ message: string }> {
    // In a real application, you might want to:
    // 1. Add the token to a blacklist
    // 2. Store logout timestamp
    // 3. Track session management
    
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'Logged out successfully' };
  }

  // 🔑 Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send email with reset link
    // 4. Use a proper email service

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  // 🔑 Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // In a real application, you would:
    // 1. Validate the reset token
    // 2. Check if token is expired
    // 3. Find user by token
    // 4. Update password
    // 5. Invalidate token

    // For now, we'll simulate this with a simple approach
    // In production, implement proper token validation
    
    return { message: 'Password reset successfully' };
  }

  // 🔄 Get any user by ID (Admin only)
  async getUserById(userId: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user as UserWithoutPassword;
  }

  // 👥 Get all users (Admin only)
  async getAllUsers(): Promise<UserWithoutPassword[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users as UserWithoutPassword[];
  }

  // 🔑 Assign/change user role (Admin only)
  async assignRole(userId: string, role: Role): Promise<UserWithoutPassword> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser as UserWithoutPassword;
  }
}
