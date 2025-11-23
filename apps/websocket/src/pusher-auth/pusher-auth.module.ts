import { Module } from '@nestjs/common';
import { PusherAuthController } from './pusher-auth.controller';
import { PusherAuthService } from './pusher-auth.service';
import { PusherModule } from '../pusher/pusher.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PusherModule, AuthModule],
  controllers: [PusherAuthController],
  providers: [PusherAuthService],
})
export class PusherAuthModule {}

