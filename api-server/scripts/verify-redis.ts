
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyRedis() {
    console.log('🔍 Starting Redis Verification...');

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`Connecting to: ${redisUrl}`);

    const redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
            if (times > 3) {
                console.error('❌ Could not connect after 3 retries.');
                return null; // Stop retrying
            }
            return 200;
        },
    });

    redis.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
    });

    try {
        // 1. Check connection
        await new Promise<void>((resolve, reject) => {
            redis.on('connect', () => {
                console.log('✅ Connection established.');
                resolve();
            });
            // specific timeout for initial connection
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });

        // 2. Write Test
        const testKey = 'chatiq:verify:test-' + Date.now();
        const testValue = 'Hello Redis!';
        console.log(`📝 Testing WRITE (${testKey})...`);
        await redis.set(testKey, testValue, 'EX', 60); // Expire in 60s
        console.log('✅ WRITE successful.');

        // 3. Read Test
        console.log('📖 Testing READ...');
        const result = await redis.get(testKey);
        if (result === testValue) {
            console.log(`✅ READ successful: "${result}" matches.`);
        } else {
            console.error(`❌ READ failed: Expected "${testValue}", got "${result}"`);
        }

        // 4. Delete Test
        console.log('🗑️  Testing DELETE...');
        await redis.del(testKey);
        const deleted = await redis.get(testKey);
        if (deleted === null) {
            console.log('✅ DELETE successful.');
        } else {
            console.error('❌ DELETE failed: Key still exists.');
        }

        console.log('\n🎉 Redis is fully functional!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
    } finally {
        await redis.quit();
    }
}

verifyRedis();
