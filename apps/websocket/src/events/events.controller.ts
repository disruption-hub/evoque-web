import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { TriggerEventDto } from './dto/trigger-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@generated/prisma';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerEvent(
    @Body() triggerEventDto: TriggerEventDto,
    @CurrentUser() user: User,
  ) {
    await this.eventsService.triggerEvent(
      triggerEventDto.channel,
      triggerEventDto.event,
      triggerEventDto.data || {},
    );

    return {
      success: true,
      message: 'Event triggered successfully',
      channel: triggerEventDto.channel,
      event: triggerEventDto.event,
    };
  }

  @Get('channels')
  async getChannels(@CurrentUser() user: User) {
    // Return available channel patterns
    // In a real implementation, you might want to fetch this from a database
    return {
      channels: [
        'public',
        'private-user',
        'presence-user',
      ],
      message: 'Available channel patterns',
    };
  }
}

