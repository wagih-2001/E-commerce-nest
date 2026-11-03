import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptor/transform.interceptor.js';
import { LoggerInterceptor } from './common/interceptor/logger.interceptor.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT ?? 3040);

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggerInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port, '127.0.0.1');

  console.log(`Application is running on: ${await app.getUrl()}`);
}

await bootstrap();
