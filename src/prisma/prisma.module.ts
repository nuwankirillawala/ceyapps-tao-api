// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Global()
@Module({
  providers: [PrismaService, SeedService],
  controllers: [SeedController],
  exports: [PrismaService],
})
export class PrismaModule {}
