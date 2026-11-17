import { Module } from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { ReviewController } from './review.controller.js';
import { UserModel } from '../DB/models/user.model.js';
import { AuthModule } from '../auth/auth.module.js';
import { ReviewModel } from '../DB/models/review.model.js';
import { ProductModel } from '../DB/models/product.model.js';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../common/services/token.js';

@Module({
  imports: [UserModel, ReviewModel, ProductModel, AuthModule],
  controllers: [ReviewController],
  providers: [ReviewService, JwtService, TokenService],
})
export class ReviewModule {}


