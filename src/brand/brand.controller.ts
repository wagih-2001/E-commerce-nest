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
import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';

@Controller('brand')
export class BrandController {
  constructor(private readonly _brandService: BrandService) {}

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
    const adminId = request.user?._id as Types.ObjectId;
    const createdBrand = await this._brandService.create(
      adminId,
      createBrandDto,
      file,
    );
    return {
      success: true,
      message: 'Brand created successfully',
      data: createdBrand,
    };
  }

  @Get()
  findAll() {
    return this._brandService.findAll();
  }

  @Get(':id')
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
    return {
      success: true,
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  @Delete('delete-brand/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    return this._brandService.remove(id);
  }
}
