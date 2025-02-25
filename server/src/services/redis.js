import { createClient } from 'redis';
import { config } from '../config.js';

// 创建 Redis 客户端
const client = createClient({
  url: config.redisUrl
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Connected to Redis'));

// 连接到 Redis
await client.connect();

// 缓存键前缀
const CACHE_PREFIX = 'weekly-schedule:';

// 缓存过期时间（1小时）
const DEFAULT_EXPIRY = 3600;

export const redis = {
  // 获取任务列表缓存
  async getTasksCache(startDate, endDate) {
    const cacheKey = `${CACHE_PREFIX}tasks:${startDate}:${endDate}`;
    const cached = await client.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  },

  // 设置任务列表缓存
  async setTasksCache(startDate, endDate, tasks) {
    const cacheKey = `${CACHE_PREFIX}tasks:${startDate}:${endDate}`;
    await client.setEx(cacheKey, DEFAULT_EXPIRY, JSON.stringify(tasks));
  },

  // 清除指定日期范围的缓存
  async invalidateTasksCache(startDate, endDate) {
    const cacheKey = `${CACHE_PREFIX}tasks:${startDate}:${endDate}`;
    await client.del(cacheKey);
  },

  // 获取单个任务缓存
  async getTaskCache(taskId) {
    const cacheKey = `${CACHE_PREFIX}task:${taskId}`;
    const cached = await client.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  },

  // 设置单个任务缓存
  async setTaskCache(taskId, task) {
    const cacheKey = `${CACHE_PREFIX}task:${taskId}`;
    await client.setEx(cacheKey, DEFAULT_EXPIRY, JSON.stringify(task));
  },

  // 删除单个任务缓存
  async invalidateTaskCache(taskId) {
    const cacheKey = `${CACHE_PREFIX}task:${taskId}`;
    await client.del(cacheKey);
  }
};
