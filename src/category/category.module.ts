import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { UserModel } from '../DB/models/user.model.js';
import { CloudinaryService } from '../common/services/cloudinary.js';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../common/services/token.js';
import { CategoryModel } from '../DB/models/category.model.js';

@Module({
  imports: [UserModel , CategoryModel],
  controllers: [CategoryController],
  providers: [CategoryService , TokenService, JwtService, CloudinaryService],
})
export class CategoryModule {}
