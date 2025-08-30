import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentUserService } from './payment-user.service';
import { PaymentUserController } from './payment-user.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentUserController],
  providers: [PaymentUserService],
  exports: [PaymentUserService],
})
export class PaymentUserModule {}
