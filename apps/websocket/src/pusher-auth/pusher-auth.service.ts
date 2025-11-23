import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PusherService } from '../pusher/pusher.service';
import { AuthService } from '../auth/services/auth.service';
import { User } from '@generated/prisma';

@Injectable()
export class PusherAuthService {
  constructor(
    private readonly pusherService: PusherService,
    private readonly authService: AuthService,
  ) {}

  async authenticateChannel(
    socketId: string,
    channel: string,
    token?: string,
  ): Promise<any> {
    // Validate token if provided
    let user: User | null = null;
    if (token) {
      try {
        user = await this.authService.validateToken(token);
      } catch (error) {
        throw new UnauthorizedException('Invalid authentication token');
      }
    }

    const pusher = this.pusherService.getPusher();

    // Handle private channels
    if (channel.startsWith('private-')) {
      if (!user) {
        throw new UnauthorizedException('Authentication required for private channels');
      }
      return pusher.authorizeChannel(socketId, channel);
    }

    // Handle presence channels
    if (channel.startsWith('presence-')) {
      if (!user) {
        throw new UnauthorizedException('Authentication required for presence channels');
      }
      const presenceData = {
        user_id: user.id,
        user_info: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
      return pusher.authorizeChannel(socketId, channel, presenceData);
    }

    // Public channels don't need authentication
    throw new UnauthorizedException('Public channels do not require authentication');
  }
}

