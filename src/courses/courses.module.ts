import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { LessonsController } from './lessons.controller';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudflareService } from '../cloudflare/cloudflare.service';

@Module({
  controllers: [CoursesController, LessonsController],
  providers: [CoursesService, PrismaService, CloudflareService],
  exports: [CoursesService],
})
export class CoursesModule {} 