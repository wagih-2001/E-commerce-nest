import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createHash } from 'node:crypto';

import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { CashingService } from '../cashing.service.js';

import {
  CACHE_RESPONSE_KEY,
  CacheResponseOptions,
} from '../decorators/cache-response.decorator.js';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RedisCacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cashingService: CashingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<CacheResponseOptions>(
      CACHE_RESPONSE_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest<Request>();

    // Check if caching is enabled for this endpoint
    if (!options || request.method !== 'GET') {
      return next.handle();
    }

    // Get authenticated user
    const user = request.user as { role?: string } | undefined;

    // Log authenticated user role
    this.logger.debug(`Authenticated user role: ${user?.role ?? 'GUEST'}`);
    // Skip cache for Admin
    if (user?.role === 'ADMIN') {
      this.logger.debug('ADMIN BYPASS: Redis cache skipped');

      return next.handle();
    }

    // Generate cache key
    const cacheKey = this.buildCacheKey(request, options.namespace);

    // Check Redis
    return from(this.cashingService.get<unknown>(cacheKey)).pipe(
      switchMap((cachedData) => {
        // Cache Hit
        if (cachedData !== null) {
          this.logger.debug(`CACHE HIT: ${cacheKey}`);

          return of(cachedData);
        }

        // Cache Miss
        this.logger.debug(`CACHE MISS: ${cacheKey}`);

        return next.handle().pipe(
          tap((response) => {
            void this.cashingService.set(
              cacheKey,
              response,
              options.ttl ?? 300,
            );
          }),
        );
      }),
    );
  }

  private buildCacheKey(request: Request, namespace: string): string {
    const requestUrl = request.originalUrl || request.url;

    const hash = createHash('sha256').update(requestUrl).digest('hex');

    return `http-cache:v1:${namespace}:${hash}`;
  }
}
