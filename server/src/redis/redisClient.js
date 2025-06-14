// redisClient.ts
import Redis from "ioredis";
const redis_server_url = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redis_server_url);

export default redis;
