import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RegionService } from './region.service';

@Module({
  imports: [ConfigModule],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
