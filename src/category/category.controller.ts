import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  Request,
  UseGuards,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../common/utils/multer.utils.js';
import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';
import { AdminGuard } from '../common/guards/admin.guard.js';
@Controller('category')
export class CategoryController {
  constructor(private readonly _categoryService: CategoryService) {}

  @Post('create-category')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async createCategory(
    @UploadedFile() file: Express.Multer.File,
    @Request() request: ExpressRequest,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    const userId = request.user._id;

    const createCategory = await this._categoryService.create(
      userId,
      createCategoryDto,
      file,
    );

    return {
      success: true,
      message: 'Category created successfully',
      data: createCategory,
    };
  }

  @Get()
  findAll() {
    return this._categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._categoryService.findOne(id);
  }
  @Patch('update-category/:id')
  @UseGuards(AuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async updateCategory(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const updatedCategory = await this._categoryService.update(
      id,
      updateCategoryDto,
      file,
    );

    return {
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }
  @Delete('delete-category/:id')
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this._categoryService.remove(id);
  }
}
