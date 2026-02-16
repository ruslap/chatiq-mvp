import { IoAdapter } from "@nestjs/platform-socket.io";
import { INestApplication, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { ServerOptions } from "socket.io";

export class RedisIoAdapter extends IoAdapter {
	private readonly logger = new Logger(RedisIoAdapter.name);
	private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

	constructor(
		app: INestApplication,
		private readonly configService: ConfigService,
	) {
		super(app);
	}

	async connectToRedis(): Promise<void> {
		const redisUrl = this.configService.get<string>("REDIS_URL", "redis://localhost:6379");

		try {
			const pubClient = createClient({ url: redisUrl });
			const subClient = pubClient.duplicate();

			await Promise.all([pubClient.connect(), subClient.connect()]);

			this.adapterConstructor = createAdapter(pubClient, subClient);
			this.logger.log("Socket.IO Redis adapter connected");
		} catch (error) {
			this.logger.warn(
				`Socket.IO Redis adapter failed to connect, falling back to in-memory: ${error instanceof Error ? error.message : error}`,
			);
		}
	}

	createIOServer(port: number, options?: Partial<ServerOptions>) {
		const server = super.createIOServer(port, options);
		if (this.adapterConstructor) {
			server.adapter(this.adapterConstructor);
		}
		return server;
	}
}
