import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { StringValue } from 'ms';
import { RoleEnum } from '../enums/user.enum.js';

interface JwtPayload {
  sub: Types.ObjectId;
  role: RoleEnum;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Generate Access Token + Refresh Token

  async generateToken(
    userId: Types.ObjectId,
    role: RoleEnum,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      sub: userId,
      role,
    };

    const isUser = role === RoleEnum.USER;

    // =========================
    // Access Token Configuration
    // =========================

    const accessSecret = this.configService.getOrThrow<string>(
      isUser ? 'USER_ACCESS_SECRET' : 'ADMIN_ACCESS_SECRET',
    );

    const accessExpiration = this.configService.getOrThrow<StringValue>(
      isUser ? 'USER_ACCESS_EXPIRATION' : 'ADMIN_ACCESS_EXPIRATION',
    );

    // =========================
    // Refresh Token Configuration
    // =========================

    const refreshSecret = this.configService.getOrThrow<string>(
      isUser ? 'USER_REFRESH_SECRET' : 'ADMIN_REFRESH_SECRET',
    );

    const refreshExpiration = this.configService.getOrThrow<StringValue>(
      isUser ? 'USER_REFRESH_EXPIRATION' : 'ADMIN_REFRESH_EXPIRATION',
    );

    // =========================
    // Generate Access Token
    // =========================

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiration,
    });

    // =========================
    // Generate Refresh Token
    // =========================

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // =========================
  // Verify Access Token
  // =========================

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      /*
       * First decode the token to know the role.
       *
       * We only use decode() to select the correct secret.
       * The token is NOT trusted yet.
       */

      const decoded = this.jwtService.decode(token);

      if (
        !decoded ||
        typeof decoded !== 'object' ||
        !decoded.role ||
        !decoded.sub
      ) {
        throw new UnauthorizedException('Invalid token');
      }

      const role = decoded.role as RoleEnum;

      // Make sure role is valid
      if (role !== RoleEnum.USER && role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException('Invalid token role');
      }

      const isUser = role === RoleEnum.USER;

      // Select Access Token Secret

      const accessSecret = this.configService.getOrThrow<string>(
        isUser ? 'USER_ACCESS_SECRET' : 'ADMIN_ACCESS_SECRET',
      );

      /*
       * Now verify the token using the correct secret.
       *
       * This is the important security step.
       */

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: accessSecret,
      });

      // Validate payload

      if (
        !payload.sub ||
        !payload.role ||
        (payload.role !== RoleEnum.USER && payload.role !== RoleEnum.ADMIN)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // =========================
  // Verify Refresh Token
  // =========================

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      /*
       * Decode only to determine which refresh secret
       * should be used.
       */

      const decoded = this.jwtService.decode(token);

      if (
        !decoded ||
        typeof decoded !== 'object' ||
        !decoded.role ||
        !decoded.sub
      ) {
        throw new UnauthorizedException('Invalid token');
      }

      const role = decoded.role as RoleEnum;

      // Make sure role is valid

      if (role !== RoleEnum.USER && role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException('Invalid token role');
      }

      const isUser = role === RoleEnum.USER;

      // Select Refresh Token Secret

      const refreshSecret = this.configService.getOrThrow<string>(
        isUser ? 'USER_REFRESH_SECRET' : 'ADMIN_REFRESH_SECRET',
      );

      // Verify Refresh Token

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: refreshSecret,
      });

      // Validate payload

      if (
        !payload.sub ||
        !payload.role ||
        (payload.role !== RoleEnum.USER && payload.role !== RoleEnum.ADMIN)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
