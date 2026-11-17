import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { resolve } from 'node:path';
import { Connection } from 'mongoose';
import { AuthModule } from './auth/auth.module.js';
import { MailModule } from './mail/mail.module.js';
import { LoggerMiddleware } from './common/middelware/logger.middelware.js';
import { AuthController } from './auth/auth.controller.js';
import { CategoryModule } from './category/category.module.js';
import { BrandModule } from './brand/brand.module.js';
import { ProductModule } from './product/product.module.js';
import { CartModule } from './cart/cart.module.js';
import { ReviewModule } from './review/review.module.js';
import { CouponModule } from './coupon/coupon.module.js';
import { sign } from 'node:crypto';
import { CashingModule } from './cashing/cashing.module.js';
import { OrderModule } from './order/order.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('./config/dev.env'),
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),

        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('Connected to MongoDB');
          });
        },
      }),
    }),

    AuthModule,
    MailModule,
    CategoryModule,
    BrandModule,
    ProductModule,
    CartModule,
    ReviewModule,
    CouponModule,
    CashingModule,
    OrderModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(AuthController);
  }
}
