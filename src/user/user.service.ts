// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, User } from '@prisma/client';

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
}
