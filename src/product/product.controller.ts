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
// import { UpdateProductDto } from './dto/update-product.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/utils/multer.utils.js';
import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Controller('product')
export class ProductController {
  constructor(private readonly _productService: ProductService) {}

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

    return {
      success: true,
      message: 'Product created successfully',
      data: createdProduct,
    };
  }
  @Get()
  findAll() {
    return this._productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._productService.findOne(id);
  }

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

    return {
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  }

  @Delete('delete-product/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    const deletedProduct = await this._productService.remove(id);

    return {
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct,
    };
  }
}
