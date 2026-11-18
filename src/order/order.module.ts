import { Module } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { OrderController } from './order.controller.js';
import { OrderModel } from '../DB/models/order.model.js';
import { UserModel } from '../DB/models/user.model.js';
import { ProductModel } from '../DB/models/product.model.js';
import { CouponModel } from '../DB/models/coupon.model.js';
import { AuthModule } from '../auth/auth.module.js';
import { TokenService } from '../common/services/token.js';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [OrderModel, UserModel, ProductModel, CouponModel, AuthModule],
  controllers: [OrderController],
  providers: [OrderService, JwtService, TokenService],
})
export class OrderModule {}
