// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { HealthController } from './health.controller';

@Global()
@Module({
  providers: [PrismaService, SeedService],
  controllers: [SeedController, HealthController],
  exports: [PrismaService],
})
export class PrismaModule {}
