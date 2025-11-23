import { Injectable, OnModuleInit } from '@nestjs/common';
import Pusher from 'pusher';

@Injectable()
export class PusherService implements OnModuleInit {
  private pusher: Pusher;

  constructor() {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER || 'us2';

    if (!appId || !key || !secret) {
      throw new Error(
        'Pusher configuration is missing. Please set PUSHER_APP_ID, PUSHER_KEY, and PUSHER_SECRET environment variables.',
      );
    }

    this.pusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  onModuleInit() {
    // Pusher client is ready
  }

  getPusher(): Pusher {
    return this.pusher;
  }

  async trigger(
    channel: string,
    event: string,
    data: any,
  ): Promise<void> {
    await this.pusher.trigger(channel, event, data);
  }

  async triggerBatch(events: Array<{ channel: string; name: string; data: any }>): Promise<void> {
    await this.pusher.triggerBatch(events);
  }
}

