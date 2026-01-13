import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { json, urlencoded } from "express";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	// Enable global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	// Enable trust proxy for correct IP and Protocol detection behind Nginx
	app.set("trust proxy", 1);

	// Increase body parser limit to handle larger payloads (e.g., file uploads, large messages)
	app.use(json({ limit: "10mb" }));
	app.use(urlencoded({ extended: true, limit: "10mb" }));

	app.enableCors({
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);
			// Allow any origin
			callback(null, true);
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

	await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
