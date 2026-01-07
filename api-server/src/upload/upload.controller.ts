import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
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
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = uuid() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', '.doc', '.docx', '.txt'];
        if (allowedTypes.includes(file.mimetype) || allowedTypes.some(type => file.originalname.endsWith(type))) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type') as unknown as Error, false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Return the file URL that can be accessed
    const fileUrl = `http://localhost:3000/uploads/${file.filename}`;

    return {
      url: fileUrl,
      name: file.originalname,
      size: file.size,
      type: file.mimetype.startsWith('image/') ? 'image' : 'file',
    };
  }
}
