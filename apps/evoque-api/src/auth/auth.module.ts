import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, PrismaService],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}

