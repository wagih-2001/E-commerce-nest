import { Module } from '@nestjs/common';

import { CashingService } from './cashing.service.js';
import { RedisCacheInterceptor } from './interceptors/redis-cache.interceptor.js';

@Module({
  providers: [CashingService, RedisCacheInterceptor],
  exports: [CashingService, RedisCacheInterceptor],
})
export class CashingModule {}
