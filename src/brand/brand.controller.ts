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
  UploadedFile,
  Request,
  UnauthorizedException,
} from '@nestjs/common';

import { BrandService } from './brand.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';

import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/utils/multer.utils.js';

import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard.js';

import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';

import { CashingService } from '../cashing/cashing.service.js';
import { RedisCacheInterceptor } from '../cashing/interceptors/redis-cache.interceptor.js';
import { CacheResponse } from '../cashing/decorators/cache-response.decorator.js';

@Controller('brand')
export class BrandController {
  constructor(
    private readonly _brandService: BrandService,
    private readonly _cashingService: CashingService,
  ) {}

  @Post('create-brand')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createBrandDto: CreateBrandDto,
    @Request() request: ExpressRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const adminId = request.user._id as Types.ObjectId;

    const createdBrand = await this._brandService.create(
      adminId,
      createBrandDto,
      file,
    );

    await this._cashingService.delByPattern('http-cache:v1:brands:*');

    return {
      success: true,
      message: 'Brand created successfully',
      data: createdBrand,
    };
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(RedisCacheInterceptor)
  @CacheResponse({
    namespace: 'brands',
    ttl: 300,
  })
  findAll() {
    return this._brandService.findAll();
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(RedisCacheInterceptor)
  @CacheResponse({
    namespace: 'brands',
    ttl: 300,
  })
  findOne(@Param('id') id: string) {
    return this._brandService.findOne(id);
  }

  @Patch('update-brand/:id')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async update(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    const updatedBrand = await this._brandService.update(
      id,
      updateBrandDto,
      file,
    );

    await this._cashingService.delByPattern('http-cache:v1:brands:*');

    return {
      success: true,
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  @Delete('delete-brand/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    const deletedBrand = await this._brandService.remove(id);

    await this._cashingService.delByPattern('http-cache:v1:brands:*');

    return deletedBrand;
  }
}
