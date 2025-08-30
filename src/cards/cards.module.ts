import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}

