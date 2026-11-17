import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service.js';
import { CouponController } from './coupon.controller.js';
import { UserModel } from '../DB/models/user.model.js';
import { CouponModel } from '../DB/models/coupon.model.js';
import { AuthModule } from '../auth/auth.module.js';
import { TokenService } from '../common/services/token.js';
import { JwtService } from '@nestjs/jwt';
import { CartModel } from '../DB/models/cart.model.js';

@Module({
  imports: [UserModel, CouponModel, CartModel, AuthModule],
  controllers: [CouponController],
  providers: [CouponService, JwtService, TokenService],
})
export class CouponModule {}
