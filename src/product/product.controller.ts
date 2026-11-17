import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  UnauthorizedException,
} from '@nestjs/common';

import { ProductService } from './product.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';

import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/utils/multer.utils.js';

import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';

import { CashingService } from '../cashing/cashing.service.js';
import { RedisCacheInterceptor } from '../cashing/interceptors/redis-cache.interceptor.js';
import { CacheResponse } from '../cashing/decorators/cache-response.decorator.js';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard.js';

@Controller('product')
export class ProductController {
  constructor(
    private readonly _productService: ProductService,
    private readonly _cashingService: CashingService,
  ) {}

  // Create Product
  @Post('create-product')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FilesInterceptor('images', 5, multerOptions))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
    @Request() request: ExpressRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const adminId = request.user._id as Types.ObjectId;

    const createdProduct = await this._productService.create(
      adminId,
      createProductDto,
      files,
    );

    // Invalidate product cache after successful creation
    await this._cashingService.delByPattern('http-cache:v1:products:*');

    return {
      success: true,
      message: 'Product created successfully',
      data: createdProduct,
    };
  }

  // Get All Products
  @Get()
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(RedisCacheInterceptor)
  @CacheResponse({
    namespace: 'products',
    ttl: 300,
  })
  findAll() {
    return this._productService.findAll();
  }

  // Get Single Product
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(RedisCacheInterceptor)
  @CacheResponse({
    namespace: 'products',
    ttl: 300,
  })
  findOne(@Param('id') id: string) {
    return this._productService.findOne(id);
  }

  // Update Product
  @Patch('update-product/:id')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FilesInterceptor('images', 5, multerOptions))
  async update(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const updatedProduct = await this._productService.update(
      files,
      id,
      updateProductDto,
    );

    // Invalidate product cache after successful update
    await this._cashingService.delByPattern('http-cache:v1:products:*');

    return {
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  // Delete Product
  @Delete('delete-product/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    const deletedProduct = await this._productService.remove(id);

    // Invalidate product cache after successful deletion
    await this._cashingService.delByPattern('http-cache:v1:products:*');

    return {
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct,
    };
  }
}
