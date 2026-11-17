import { SetMetadata } from '@nestjs/common';

export const CACHE_RESPONSE_KEY = 'cache_response';

export interface CacheResponseOptions {
  namespace: string;
  ttl?: number;
}

export const CacheResponse = (options: CacheResponseOptions) =>
  SetMetadata(CACHE_RESPONSE_KEY, options);
