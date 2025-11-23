import { Role } from '@prisma/client';

export class RoleEntity implements Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

