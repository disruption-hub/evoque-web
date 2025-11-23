import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStrategy } from './strategies/session.strategy';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, AuthRepository, SessionStrategy, PrismaService],
  exports: [AuthService, AuthRepository, PassportModule],
})
export class AuthModule {}

