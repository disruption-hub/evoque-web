import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from './services/roles.service';
import { RolesController } from './controllers/roles.controller';
import { RolesRepository } from './repositories/roles.repository';

@Module({
  controllers: [RolesController],
  providers: [RolesService, RolesRepository, PrismaService],
  exports: [RolesService, RolesRepository],
})
export class RolesModule {}

