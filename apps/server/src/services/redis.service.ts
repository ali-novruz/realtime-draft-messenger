import { createClient, RedisClientType } from 'redis';

const url = process.env.REDIS_URL;
let redisClient: RedisClientType | null = null;

export const connectRedis = async () => {
    if (!url) {
        console.log('⚠️ REDIS_URL not set - running without Redis (drafts will not persist)');
        return;
    }

    try {
        redisClient = createClient({
            url,
            socket: {
                tls: url.includes('upstash') || url.startsWith('rediss://'),
                rejectUnauthorized: false
            }
        });

        redisClient.on('error', (err) => console.log('Redis Client Error:', err));

        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('✅ Connected to Redis');
        }
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        redisClient = null;
    }
};

export const getRedisClient = () => redisClient;

// Helper to safely get/set with fallback
export const getDraft = async (key: string): Promise<string | null> => {
    if (!redisClient) return null;
    try {
        return await redisClient.get(key);
    } catch {
        return null;
    }
};

export const setDraft = async (key: string, value: string): Promise<void> => {
    if (!redisClient) return;
    try {
        await redisClient.set(key, value, { EX: 300 }); // 5 min expiry
    } catch {
        // Ignore Redis errors
    }
};

export const deleteDraft = async (key: string): Promise<void> => {
    if (!redisClient) return;
    try {
        await redisClient.del(key);
    } catch {
        // Ignore Redis errors
    }
};
