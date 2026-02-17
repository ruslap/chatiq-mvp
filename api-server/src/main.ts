import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { json, urlencoded } from "express";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import { RedisIoAdapter } from "./redis/redis-io.adapter";
import { StructuredLogger } from "./common/structured-logger.service";
import { CorrelationIdMiddleware } from "./common/correlation-id.middleware";
import { RequestMetricsInterceptor } from "./common/request-metrics.interceptor";
import { LicenseService } from "./license/license.service";

async function bootstrap() {
	const logger = new StructuredLogger();
	const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });

	// Set up Redis adapter for Socket.IO (enables multi-instance broadcasting)
	const configService = app.get(ConfigService);
	const redisIoAdapter = new RedisIoAdapter(app, configService);
	await redisIoAdapter.connectToRedis();
	app.useWebSocketAdapter(redisIoAdapter);

	// Enable global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	// Observability: correlation ID + request metrics
	app.use(new CorrelationIdMiddleware().use.bind(new CorrelationIdMiddleware()));
	app.useGlobalInterceptors(new RequestMetricsInterceptor());

	// Enable trust proxy for correct IP and Protocol detection behind Nginx
	app.set("trust proxy", 1);

	// Increase body parser limit to handle larger payloads (e.g., file uploads, large messages)
	app.use(json({ limit: "10mb" }));
	app.use(urlencoded({ extended: true, limit: "10mb" }));

	// CORS: allow origins from env (comma-separated), fall back to permissive in dev
	const allowedOrigins = configService
		.get<string>("CORS_ORIGINS", "")
		.split(",")
		.map(o => o.trim())
		.filter(Boolean);

	app.enableCors({
		origin: (origin, callback) => {
			// Allow requests with no origin (mobile apps, curl, server-to-server)
			if (!origin) return callback(null, true);
			// If no allowlist configured, allow all (dev mode)
			if (allowedOrigins.length === 0) return callback(null, true);
			if (allowedOrigins.includes(origin)) return callback(null, true);
			callback(new Error(`Origin ${origin} not allowed by CORS`));
		},
		credentials: true,
	});

	// Serve uploaded files
	app.use("/uploads", (req: unknown, res: { header: (name: string, value: string) => void }, next: () => void) => {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "GET");
		res.header("Access-Control-Allow-Headers", "Content-Type");
		next();
	});
	app.useStaticAssets(join(__dirname, "..", "..", "uploads"), {
		prefix: "/uploads/",
	});

	// ─── License verification ───────────────────────────────
	const licenseService = app.get(LicenseService);
	const license = licenseService.validateLicense();

	if (!license.valid) {
		logger.error(
			`╔══════════════════════════════════════════════════╗`,
			"License",
		);
		logger.error(
			`║  LICENSE ERROR: ${license.error}`,
			"License",
		);
		logger.error(
			`║  Please provide a valid LICENSE_KEY in .env     ║`,
			"License",
		);
		logger.error(
			`╚══════════════════════════════════════════════════╝`,
			"License",
		);
		process.exit(1);
	}

	logger.log(
		`License OK — ${license.licensee} (${license.plan}) · expires ${license.expiresAt} (${license.daysRemaining}d left)`,
		"License",
	);

	if (license.daysRemaining !== undefined && license.daysRemaining <= 30) {
		logger.warn(
			`⚠️  License expires in ${license.daysRemaining} days! Contact your provider to renew.`,
			"License",
		);
	}

	await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
