import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RolesRepository } from '../repositories/roles.repository';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role with same name already exists
    const existingRole = await this.rolesRepository.findByName(
      createRoleDto.name,
    );
    if (existingRole) {
      throw new ConflictException(`Role with name "${createRoleDto.name}" already exists`);
    }

    return this.rolesRepository.create({
      ...createRoleDto,
      isActive: createRoleDto.isActive ?? true,
    });
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.findAll();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    // Check if role exists
    await this.findOne(id);

    // If name is being updated, check for conflicts
    if (updateRoleDto.name) {
      const existingRole = await this.rolesRepository.findByName(
        updateRoleDto.name,
      );
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException(
          `Role with name "${updateRoleDto.name}" already exists`,
        );
      }
    }

    return this.rolesRepository.update(id, updateRoleDto);
  }

  async remove(id: string): Promise<Role> {
    await this.findOne(id);
    return this.rolesRepository.remove(id);
  }

  async hardDelete(id: string): Promise<Role> {
    await this.findOne(id);
    return this.rolesRepository.hardDelete(id);
  }
}

