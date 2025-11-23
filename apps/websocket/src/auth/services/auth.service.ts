import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { User } from '@generated/prisma';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async validateToken(token: string): Promise<User> {
    const session = await this.authRepository.findSessionByToken(token);
    
    if (!session) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!session.isActive) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return session.user;
  }
}

