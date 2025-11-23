import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto, LoginResponseDto, RegisterResponseDto } from '../dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Headers('authorization') authorization?: string): Promise<void> {
    const token = authorization?.replace('Bearer ', '');
    if (!token) {
      return;
    }
    await this.authService.logout(token);
  }

  @Delete('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@Headers('authorization') authorization?: string): Promise<void> {
    const token = authorization?.replace('Bearer ', '');
    if (!token) {
      return;
    }
    const user = await this.authService.validateToken(token);
    await this.authService.logoutAll(user.id);
  }
}

