import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { PublicSettingsController } from './public-settings.controller';
import { WishlistController } from './wishlist.controller';
import { CartController } from './cart.controller';
import { EnrollmentController } from './enrollment.controller';
import { OrdersController } from './orders.controller';
import { PricingController } from './pricing.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudflareModule } from '../cloudflare/cloudflare.module';

@Module({
  imports: [PrismaModule, CloudflareModule],
  controllers: [
    SettingsController, 
    AdminSettingsController, 
    PublicSettingsController, 
    WishlistController, 
    CartController,
    EnrollmentController,
    OrdersController,
    PricingController
  ],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
