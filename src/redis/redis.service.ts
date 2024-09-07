import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  @Inject('REDIS_CLIENT')
  private redisClient: Redis;

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

  async deleteKeys(pattern: string) {
    const stream = this.redisClient.scanStream({ match: pattern, count: 1000 });

    const keys: string[] = [];
    for await (const resultKeys of stream) {
      keys.push(...resultKeys);
    }

    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  // 新增哈希表操作
  async hSet(
    hashKey: string,
    fields: { [field: string]: string | number },
    ttl?: number,
  ): Promise<void> {
    await this.redisClient.hset(hashKey, fields);

    if (ttl) {
      // 为每个字段设置过期时间
      // for (const field in fields) {
      //   await this.redisClient.expire(`${hashKey}:${field}`, ttl);
      // }
      await this.redisClient.pexpire(hashKey, ttl);
    }
  }

  async hGet(hashKey: string, field: string): Promise<string | null> {
    return await this.redisClient.hget(hashKey, field);
  }

  async hGetAll(hashKey: string): Promise<{ [key: string]: string }> {
    return await this.redisClient.hgetall(hashKey);
  }

  async hDel(hashKey: string, ...fields: string[]): Promise<number> {
    return await this.redisClient.hdel(hashKey, ...fields);
  }

  async hExists(hashKey: string, field: string): Promise<number> {
    return await this.redisClient.hexists(hashKey, field);
  }

  async hIncrBy(
    hashKey: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return await this.redisClient.hincrby(hashKey, field, increment);
  }
}
