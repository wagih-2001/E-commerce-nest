import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import multer from 'multer';

export const multerOptions = {
  storage: multer.memoryStorage(),

  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype.match(/^image\/(jpg|jpeg|png|webp)$/)) {
      callback(null, true);
    } else {
      callback(new BadRequestException('Unsupported File Format'), false);
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
