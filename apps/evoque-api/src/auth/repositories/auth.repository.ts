import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async create(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: userData,
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateEmailVerification(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  async createSession(sessionData: {
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
  }) {
    return this.prisma.session.create({
      data: sessionData,
    });
  }

  async findSessionByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async invalidateSession(token: string) {
    return this.prisma.session.update({
      where: { token },
      data: { isActive: false },
    });
  }

  async invalidateAllUserSessions(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }
}

