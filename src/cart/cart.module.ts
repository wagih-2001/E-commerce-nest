import { Module } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { CartController } from './cart.controller.js';
import { CartModel } from '../DB/models/cart.model.js';
import { ProductModel } from '../DB/models/product.model.js';
import { UserModel } from '../DB/models/user.model.js';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../common/services/token.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [UserModel, ProductModel, CartModel, AuthModule],
  controllers: [CartController],
  providers: [CartService, JwtService, TokenService],
})
export class CartModule {}
