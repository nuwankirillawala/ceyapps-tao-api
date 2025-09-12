import { Module } from '@nestjs/common';
import { CourseReviewsController } from './course-reviews.controller';
import { CourseReviewsService } from './course-reviews.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseReviewsController],
  providers: [CourseReviewsService],
  exports: [CourseReviewsService],
})
export class CourseReviewsModule {}
