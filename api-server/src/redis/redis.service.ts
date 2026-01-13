import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	private client: Redis;
	private readonly logger = new Logger(RedisService.name);
	private isConnected = false;

	constructor(private configService: ConfigService) {}

	async onModuleInit() {
		const redisUrl = this.configService.get<string>("REDIS_URL", "redis://localhost:6379");

		this.client = new Redis(redisUrl, {
			retryStrategy: times => {
				if (times > 3) {
					this.logger.warn("Redis connection failed, running without cache");
					return null; // Stop retrying
				}
				return Math.min(times * 200, 2000);
			},
			lazyConnect: true,
		});

		this.client.on("connect", () => {
			this.isConnected = true;
			this.logger.log("Redis connected");
		});

		this.client.on("error", err => {
			this.isConnected = false;
			this.logger.warn(`Redis error: ${err.message}`);
		});

		this.client.on("close", () => {
			this.isConnected = false;
		});

		try {
			await this.client.connect();
		} catch {
			this.logger.warn("Redis not available, running without cache");
		}
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.quit();
		}
	}

	/**
	 * Get value from cache
	 */
	async get<T>(key: string): Promise<T | null> {
		if (!this.isConnected) return null;
		try {
			const value = await this.client.get(key);
			return value ? JSON.parse(value) : null;
		} catch {
			return null;
		}
	}

	/**
	 * Set value in cache with optional TTL (in seconds)
	 */
	async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
		if (!this.isConnected) return;
		try {
			const serialized = JSON.stringify(value);
			if (ttlSeconds) {
				await this.client.setex(key, ttlSeconds, serialized);
			} else {
				await this.client.set(key, serialized);
			}
		} catch {
			// Ignore cache errors
		}
	}

	/**
	 * Delete key from cache
	 */
	async del(key: string): Promise<void> {
		if (!this.isConnected) return;
		try {
			await this.client.del(key);
		} catch {
			// Ignore cache errors
		}
	}

	/**
	 * Delete all keys matching a pattern
	 */
	async delPattern(pattern: string): Promise<void> {
		if (!this.isConnected) return;
		try {
			const keys = await this.client.keys(pattern);
			if (keys.length > 0) {
				await this.client.del(...keys);
			}
		} catch {
			// Ignore cache errors
		}
	}

	/**
	 * Check if Redis is available
	 */
	isAvailable(): boolean {
		return this.isConnected;
	}

	/**
	 * Get raw Redis client for advanced operations
	 */
	getClient(): Redis {
		return this.client;
	}
}
