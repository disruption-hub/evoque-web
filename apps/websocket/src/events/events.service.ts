import { Injectable } from '@nestjs/common';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class EventsService {
  constructor(private readonly pusherService: PusherService) {}

  async triggerEvent(channel: string, event: string, data: any): Promise<void> {
    await this.pusherService.trigger(channel, event, data);
  }

  async triggerBatch(events: Array<{ channel: string; name: string; data: any }>): Promise<void> {
    await this.pusherService.triggerBatch(events);
  }
}

