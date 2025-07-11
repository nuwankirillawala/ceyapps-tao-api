import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('🚀 Starting database seeding...');
    await this.createAdminUser();
    this.logger.log('✅ Database seeding completed');
  }

  private async createAdminUser() {
    try {
      this.logger.log('🔍 Checking for existing admin user...');
      
      // Check if admin user already exists
      const existingAdmin = await this.prisma.user.findFirst({
        where: {
          role: Role.ADMIN,
        },
      });

      if (existingAdmin) {
        this.logger.log(`✅ Admin user already exists: ${existingAdmin.email}`);
        return;
      }

      // Create admin user with environment variables or defaults
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@tao.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminName = process.env.ADMIN_NAME || 'System Administrator';

      this.logger.log(`📝 Creating admin user with email: ${adminEmail}`);

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await this.prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: Role.ADMIN,
        },
      });

      this.logger.log(`✅ Admin user created successfully!`);
      this.logger.log(`📧 Email: ${adminEmail}`);
      this.logger.log(`🔑 Password: ${adminPassword}`);
      this.logger.log(`👤 Name: ${adminName}`);
      this.logger.log('⚠️  IMPORTANT: Please change the default password after first login!');
      this.logger.log('🔗 You can login at: /auth/login');
    } catch (error) {
      this.logger.error('❌ Failed to create admin user:', error.message);
      this.logger.error('Stack trace:', error.stack);
    }
  }

  // Method to manually trigger seeding (for testing or manual execution)
  async seedDatabase() {
    this.logger.log('🔄 Manual database seeding triggered...');
    await this.createAdminUser();
    this.logger.log('✅ Manual database seeding completed');
  }
} 