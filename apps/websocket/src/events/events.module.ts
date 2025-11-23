import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PusherModule } from '../pusher/pusher.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PusherModule, AuthModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}

