import { config } from 'dotenv';
import { resolve } from 'node:path';

if (process.env.NODE_ENV !== 'production') {
  config({
    path: resolve('./config/dev.env'),
  });
}

export const corsConfig = {
  origin: (
    process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: ['Content-Type', 'Authorization'],
};
