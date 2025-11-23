import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';

class SessionTokenStrategy extends Strategy {
  name = 'jwt';

  constructor(private authService: AuthService) {
    super();
  }

  authenticate(req: Request): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return this.fail(new UnauthorizedException('Token not provided'), 401);
    }

    const token = authHeader.substring(7);
    
    // Handle async validation
    this.authService
      .validateToken(token)
      .then((user) => {
        this.success(user);
      })
      .catch((error) => {
        this.fail(error, 401);
      });
  }
}

@Injectable()
export class SessionStrategy extends PassportStrategy(SessionTokenStrategy, 'jwt') {
  constructor(authService: AuthService) {
    super(authService);
  }
}

