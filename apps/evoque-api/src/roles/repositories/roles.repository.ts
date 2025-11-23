import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '@prisma/client';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    return this.prisma.role.create({
      data: createRoleDto,
    });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: {
        isActive: true,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: string): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<Role> {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}

