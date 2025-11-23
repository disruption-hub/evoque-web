import { Role } from '@generated/prisma';

export class RoleEntity implements Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

