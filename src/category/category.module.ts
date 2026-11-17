import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { UserModel } from '../DB/models/user.model.js';
import { CategoryModel } from '../DB/models/category.model.js';
import { CloudinaryService } from '../common/services/cloudinary.js';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../common/services/token.js';
import { CashingModule } from '../cashing/cashing.module.js';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard.js';

@Module({
  imports: [UserModel, CategoryModel, CashingModule],

  controllers: [CategoryController],

  providers: [
    CategoryService,
    TokenService,
    JwtService,
    CloudinaryService,
    OptionalAuthGuard,
  ],
})
export class CategoryModule {}
