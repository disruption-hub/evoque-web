import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: {
        resource: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { name },
    });
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
    });
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { resource },
    });
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async remove(id: string): Promise<Permission> {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}

