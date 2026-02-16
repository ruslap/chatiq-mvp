import {
	Controller,
	Post,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	Req,
	Body,
	Delete,
	UseGuards,
	Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { v4 as uuid } from "uuid";
import type { Request } from "express";
import * as fs from "fs";
import { PrismaService } from "../prisma/prisma.service";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
];
const ALLOWED_EXTENSIONS = [".doc", ".docx", ".txt", ".pdf"];

const uploadInterceptorOptions = {
	storage: diskStorage({
		destination: (_req: Request, _file: unknown, cb: (error: Error | null, destination: string) => void) => {
			const uploadPath = "./uploads";
			if (!fs.existsSync(uploadPath)) {
				fs.mkdirSync(uploadPath, { recursive: true });
			}
			cb(null, uploadPath);
		},
		filename: (
			_req: Request,
			file: { originalname: string },
			cb: (error: Error | null, filename: string) => void,
		) => {
			const uniqueName = uuid() + extname(file.originalname);
			cb(null, uniqueName);
		},
	}),
	limits: {
		fileSize: MAX_FILE_SIZE,
	},
	fileFilter: (
		_req: Request,
		file: { originalname: string; mimetype: string },
		cb: (error: Error | null, acceptFile: boolean) => void,
	) => {
		const originalName = file.originalname.toLowerCase();
		const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext =>
			originalName.endsWith(ext),
		);
		const isAllowedMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());

		if (isAllowedMimeType || hasAllowedExtension) {
			cb(null, true);
			return;
		}

		cb(new BadRequestException("Invalid file type") as unknown as Error, false);
	},
};

@Controller("upload")
export class UploadController {
	private readonly logger = new Logger(UploadController.name);

	constructor(private readonly prisma: PrismaService) {}

	private buildUploadResponse(
		file: {
			filename: string;
			originalname: string;
			size: number;
			mimetype: string;
		},
		req: Request,
	) {
		if (!file) {
			this.logger.error("Upload failed: No file received");
			throw new BadRequestException("No file uploaded");
		}

		this.logger.log(
			`File uploaded: ${file.originalname} (${file.size} bytes, ${file.mimetype})`,
		);

		let baseUrl = process.env.API_URL;

		if (!baseUrl) {
			const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
			const host = req.headers.host;
			if (host) {
				baseUrl = `${protocol}://${host}`;
			}
		}

		if (!baseUrl) {
			baseUrl = "http://localhost:3000";
		}

		if (!process.env.API_URL && process.env.NODE_ENV === "production") {
			this.logger.warn(`API_URL not set. Using detected baseUrl: ${baseUrl}`);
		}

		const fileUrl = `${baseUrl}/uploads/${file.filename}`;
		this.logger.log(`File URL generated: ${fileUrl}`);

		return {
			url: fileUrl,
			filename: file.filename,
			name: file.originalname,
			size: file.size,
			type: file.mimetype.startsWith("image/") ? "image" : "file",
		};
	}

	private async assertSiteExists(siteId: string): Promise<void> {
		const site = await this.prisma.site.findUnique({
			where: { id: siteId },
			select: { id: true },
		});

		if (!site) {
			throw new BadRequestException("Invalid siteId");
		}
	}

	@Post("public")
	@UseInterceptors(FileInterceptor("file", uploadInterceptorOptions))
	async uploadPublicFile(
		@UploadedFile()
		file: {
			filename: string;
			originalname: string;
			size: number;
			mimetype: string;
		},
		@Body("siteId") siteId: string,
		@Req() req: Request,
	) {
		if (!siteId) {
			throw new BadRequestException("siteId is required");
		}

		await this.assertSiteExists(siteId);
		return this.buildUploadResponse(file, req);
	}

	@Post()
	@UseGuards(AuthGuard("jwt"))
	@UseInterceptors(FileInterceptor("file", uploadInterceptorOptions))
	uploadFile(
		@UploadedFile()
		file: {
			filename: string;
			originalname: string;
			size: number;
			mimetype: string;
		},
		@Req() req: Request,
	) {
		return this.buildUploadResponse(file, req);
	}

	@Post("delete")
	@UseGuards(AuthGuard("jwt"))
	async deleteFile(@Body("url") url: string) {
		if (!url) {
			throw new BadRequestException("URL is required");
		}

		try {
			// Extract filename from URL
			const parts = url.split("/");
			const filename = parts[parts.length - 1];
			const filePath = join(process.cwd(), "uploads", filename);

			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
				this.logger.log(`File deleted: ${filename}`);
				return { success: true };
			} else {
				this.logger.warn(`File not found for deletion: ${filename}`);
				return { success: false, message: "File not found" };
			}
		} catch (error) {
			this.logger.error(`Error deleting file: ${error instanceof Error ? error.message : error}`);
			throw new BadRequestException("Could not delete file");
		}
	}
}
