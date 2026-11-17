import { Module } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { ProductController } from './product.controller.js';
import { UserModel } from '../DB/models/user.model.js';
import { BrandModel } from '../DB/models/brand.model.js';
import { CloudinaryService } from '../common/services/cloudinary.js';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../common/services/token.js';
import { AuthModule } from '../auth/auth.module.js';
import { CategoryModel } from '../DB/models/category.model.js';
import { ProductModel } from '../DB/models/product.model.js';
import { CashingModule } from '../cashing/cashing.module.js';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard.js';

@Module({
  imports: [
    UserModel,
    ProductModel,
    CategoryModel,
    BrandModel,
    CashingModule,
    AuthModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    JwtService,
    TokenService,
    CloudinaryService,
    OptionalAuthGuard,
  ],
})
export class ProductModule {}
