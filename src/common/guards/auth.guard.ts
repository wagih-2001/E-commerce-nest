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
export class AuthGuard implements CanActivate {
  constructor(
    private readonly _tokenService: TokenService,

    @InjectModel(User.name)
    private readonly _userModel: Model<HUserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get request
    const request = context.switchToHttp().getRequest();

    // Get Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // Expected format:
    // Bearer <token>

    const [type, token] = authHeader.split(' ');

    // Validate header format
    if (!type || !token || type.toLowerCase() !== 'bearer') {
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

    // User doesn't exist
    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }

    // Make sure token role matches current database role
    if (payload.role !== userDoc.role) {
      throw new UnauthorizedException('Invalid user role');
    }

    // Attach user to request
    request.user = userDoc;

    return true;
  }
}
