import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // Check if permission with same name already exists
    const existingByName = await this.permissionsRepository.findByName(
      createPermissionDto.name,
    );
    if (existingByName) {
      throw new ConflictException(
        `Permission with name "${createPermissionDto.name}" already exists`,
      );
    }

    // Check if permission with same resource and action already exists
    const existingByResourceAction =
      await this.permissionsRepository.findByResourceAndAction(
        createPermissionDto.resource,
        createPermissionDto.action,
      );
    if (existingByResourceAction) {
      throw new ConflictException(
        `Permission with resource "${createPermissionDto.resource}" and action "${createPermissionDto.action}" already exists`,
      );
    }

    return this.permissionsRepository.create(createPermissionDto);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionsRepository.findAll();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }
    return permission;
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.permissionsRepository.findByResource(resource);
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    // Check if permission exists
    await this.findOne(id);

    // If name is being updated, check for conflicts
    if (updatePermissionDto.name) {
      const existingPermission =
        await this.permissionsRepository.findByName(updatePermissionDto.name);
      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException(
          `Permission with name "${updatePermissionDto.name}" already exists`,
        );
      }
    }

    // If resource and action are being updated, check for conflicts
    if (updatePermissionDto.resource && updatePermissionDto.action) {
      const existingPermission =
        await this.permissionsRepository.findByResourceAndAction(
          updatePermissionDto.resource,
          updatePermissionDto.action,
        );
      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException(
          `Permission with resource "${updatePermissionDto.resource}" and action "${updatePermissionDto.action}" already exists`,
        );
      }
    }

    return this.permissionsRepository.update(id, updatePermissionDto);
  }

  async remove(id: string): Promise<Permission> {
    await this.findOne(id);
    return this.permissionsRepository.remove(id);
  }
}

