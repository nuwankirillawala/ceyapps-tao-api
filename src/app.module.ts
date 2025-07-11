import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { RolesModule } from './roles/roles.module';
import { CloudflareModule } from './cloudflare/cloudflare.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, 
    UserModule, 
    AuthModule, 
    CoursesModule, 
    RolesModule,
    CloudflareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
