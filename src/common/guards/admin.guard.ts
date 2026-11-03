import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { Request } from 'express';
import { RoleEnum } from '../enums/user.enum.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (request.user.role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
