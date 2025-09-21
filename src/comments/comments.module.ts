import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsGateway } from './comments.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';
import { JwtStrategy } from '../auth/jwt.strategy';

console.log('JWT Secret in CommentsModule:', jwtConstants.secret ? 'Set' : 'Not set');

@Module({
  imports: [
    PrismaModule, 
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    })
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsGateway, JwtStrategy],
  exports: [CommentsService, CommentsGateway],
})
export class CommentsModule {}
