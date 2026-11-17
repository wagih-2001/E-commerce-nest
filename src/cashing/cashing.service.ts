import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CashingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CashingService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,

      retryStrategy: (times: number) => {
        return Math.min(times * 500, 5000);
      },
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connection established');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis is ready to receive commands');
    });

    this.redis.on('error', (error: Error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', (delay: number) => {
      this.logger.warn(`Redis reconnecting in ${delay}ms`);
    });

    this.redis.on('end', () => {
      this.logger.warn('Redis connection ended');
    });
  }

  onModuleInit(): void {
    void this.redis
      .connect()
      .then(async () => {
        const result = await this.redis.ping();
        this.logger.log(`Redis PING response: ${result}`);
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Redis initialization failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  // SET
  async set<T>(key: string, value: T, ttl = 300): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);

      if (serializedValue === undefined) {
        return false;
      }

      if (ttl > 0) {
        await this.redis.set(key, serializedValue, 'EX', ttl);
      } else {
        await this.redis.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Redis SET failed for "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return false;
    }
  }

  // GET
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedValue = await this.redis.get(key);

      if (cachedValue === null) {
        return null;
      }

      return JSON.parse(cachedValue) as T;
    } catch (error) {
      this.logger.error(
        `Redis GET failed for "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return null;
    }
  }

  // DELETE ONE KEY
  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(
        `Redis DEL failed for "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return false;
    }
  }

  // DELETE MULTIPLE KEYS BY PATTERN
  async delByPattern(pattern: string): Promise<number> {
    try {
      let cursor = '0';
      let deletedCount = 0;

      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );

        cursor = nextCursor;

        if (keys.length > 0) {
          deletedCount += await this.redis.del(...keys);
        }
      } while (cursor !== '0');

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Redis pattern deletion failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return 0;
    }
  }

  // EXISTS
  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch (error) {
      this.logger.error(
        `Redis EXISTS failed for "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return false;
    }
  }

  // TTL
  async ttl(key: string): Promise<number | null> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(
        `Redis TTL failed for "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.redis.status === 'ready') {
        await this.redis.quit();
      } else {
        this.redis.disconnect();
      }

      this.logger.log('Redis connection shutdown completed');
    } catch (error) {
      this.logger.error(
        `Redis shutdown failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
