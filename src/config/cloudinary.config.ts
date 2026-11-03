import { config } from 'dotenv';
import { resolve } from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

config({
  path: resolve('./config/dev.env'),
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
