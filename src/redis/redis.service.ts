import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  @Inject('REDIS_CLIENT')
  private redisClient: RedisClientType;

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string | number, ttl?: number) {
    await this.redisClient.set(key, value);

    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }

  async delete(key: string) {
    return await this.redisClient.del(key);
  }

  async deleteKeys(pattern) {
    const data = await this.redisClient.scan(0, {
      MATCH: pattern,
      COUNT: 1000,
    });

    const keys = data[1];
    if (keys.length > 0) {
      await this.delete(keys);
    }
  }
}
