import { Permission } from '../../../../generated/prisma';

export class PermissionEntity implements Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

