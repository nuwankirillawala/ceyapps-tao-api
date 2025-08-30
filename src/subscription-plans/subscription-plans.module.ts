import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { StripeCheckoutService } from '../stripe/stripe-checkout.service';
import { CoursesService } from 'src/courses/courses.service';
import { CoursesModule } from 'src/courses/courses.module';
import { CloudflareService } from 'src/cloudflare/cloudflare.service';

@Module({
  imports: [ConfigModule, PrismaModule, SubscriptionModule, CoursesModule],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService, StripeCheckoutService, CoursesService, CloudflareService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}

