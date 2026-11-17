import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { TokenService } from '../services/token.js';
import { HUserDocument, User } from '../../DB/models/user.model.js';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly _tokenService: TokenService,

    @InjectModel(User.name)
    private readonly _userModel: Model<HUserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    // No token: continue as Guest
    if (!authHeader) {
      return true;
    }

    // Validate Authorization header
    const [type, token, ...extraParts] = authHeader.trim().split(/\s+/);

    if (
      !type ||
      !token ||
      extraParts.length > 0 ||
      type.toLowerCase() !== 'bearer'
    ) {
      throw new UnauthorizedException(
        'Invalid authorization header format. Use Bearer <token>',
      );
    }

    // Verify Access Token
    const payload = await this._tokenService.verifyAccessToken(token);

    // Find user
    const userDoc = await this._userModel
      .findById(payload.sub)
      .select('-password -confirmEmailOTP -OTPExpiresAt');

    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current database role
    if (payload.role !== userDoc.role) {
      throw new UnauthorizedException('Invalid user role');
    }

    // Attach authenticated user
    request.user = userDoc;

    return true;
  }
}
