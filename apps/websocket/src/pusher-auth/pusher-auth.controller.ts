import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PusherAuthService } from './pusher-auth.service';

@Controller('pusher')
export class PusherAuthController {
  constructor(private readonly pusherAuthService: PusherAuthService) {}

  @Post('auth')
  @HttpCode(HttpStatus.OK)
  async authenticate(
    @Body() body: { socket_id: string; channel_name: string },
    @Headers('authorization') authorization?: string,
  ) {
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      throw new BadRequestException('socket_id and channel_name are required');
    }

    const token = authorization?.replace('Bearer ', '');

    const auth = await this.pusherAuthService.authenticateChannel(
      socket_id,
      channel_name,
      token,
    );

    return auth;
  }
}

