import { Module } from '@nestjs/common';
import { BrandService } from './brand.service.js';
import { BrandController } from './brand.controller.js';
import { UserModel } from '../DB/models/user.model.js';
import { CategoryModel } from '../DB/models/category.model.js';
import { BrandModel } from '../DB/models/brand.model.js';
import { AuthModule } from '../auth/auth.module.js';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../common/services/token.js';
import { CloudinaryService } from '../common/services/cloudinary.js';

@Module({
  imports: [UserModel, CategoryModel, BrandModel, AuthModule],
  controllers: [BrandController],
  providers: [BrandService, JwtService, TokenService, CloudinaryService],
})
export class BrandModule {}
