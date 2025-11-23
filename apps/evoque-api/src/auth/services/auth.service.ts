import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user with email already exists
    const existingUser = await this.authRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify role exists and is active
    const role = await this.prisma.role.findUnique({
      where: { id: registerDto.roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (!role.isActive) {
      throw new BadRequestException('Cannot assign inactive role');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create user
    const user = await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate token
    const token = this.generateToken();

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.authRepository.createSession({
      userId: user.id,
      token,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.authRepository.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken();

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.authRepository.createSession({
      userId: user.id,
      token,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  async validateToken(token: string) {
    const session = await this.authRepository.findSessionByToken(token);
    if (!session) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!session.isActive) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return session.user;
  }

  async logout(token: string): Promise<void> {
    await this.authRepository.invalidateSession(token);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.invalidateAllUserSessions(userId);
  }
}

