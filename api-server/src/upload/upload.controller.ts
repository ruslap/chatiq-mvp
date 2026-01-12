import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = './uploads';
          // Ensure directory exists
          const fs = require('fs');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          const uniqueName = uuid() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (_req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          '.doc',
          '.docx',
          '.txt',
        ];
        if (
          allowedTypes.includes(file.mimetype) ||
          allowedTypes.some((type) => file.originalname.endsWith(type))
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Invalid file type') as unknown as Error,
            false,
          );
        }
      },
    }),
  )
  uploadFile(
    @UploadedFile()
    file: {
      filename: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Return the file URL that can be accessed
    // 1. Check API_URL from env
    // 2. Fallback to current request protocol + host
    let baseUrl = process.env.API_URL;

    if (!baseUrl && req) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['host'];
      if (host) {
        baseUrl = `${protocol}://${host}`;
      }
    }

    // Final fallback
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }

    if (!process.env.API_URL && process.env.NODE_ENV === 'production') {
      console.warn(`[Upload] API_URL not set. Using detected baseUrl: ${baseUrl}`);
    }

    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      url: fileUrl,
      name: file.originalname,
      size: file.size,
      type: file.mimetype.startsWith('image/') ? 'image' : 'file',
    };
  }
}
