import { Module } from '@nestjs/common';
import { PaymentUserModule } from '../payment-user/payment-user.module';
import { CardsModule } from '../cards/cards.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SubscriptionPlansModule } from '../subscription-plans/subscription-plans.module';

@Module({
  imports: [
    PaymentUserModule,
    CardsModule,
    SubscriptionModule,
    SubscriptionPlansModule,
  ],
  exports: [
    PaymentUserModule,
    CardsModule,
    SubscriptionModule,
    SubscriptionPlansModule,
  ],
})
export class PaymentModule {}
