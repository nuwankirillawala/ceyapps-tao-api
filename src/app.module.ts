import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { RolesModule } from './roles/roles.module';
import { CloudflareModule } from './cloudflare/cloudflare.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { EmailModule } from './email/email.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SettingsModule } from './settings/settings.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { ReportingModule } from './reporting/reporting.module';

import { PrismaInterceptor } from './prisma/prisma.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule, 
    UserModule, 
    AuthModule, 
    CoursesModule, 
    RolesModule,
    CloudflareModule,
    AnnouncementsModule,
    EmailModule,
    SchedulerModule,
    SettingsModule,
    SubscriptionPlansModule,
    ReportingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrismaInterceptor,
    },
  ],
})
export class AppModule {}
