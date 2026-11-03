import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryModel } from '../DB/models/category.model.js';
import { CloudinaryService } from '../common/services/cloudinary.js';
import { InjectModel } from '@nestjs/mongoose';
import { Category, HCategoryDocument } from '../DB/models/category.model.js';
import { Model, Types } from 'mongoose';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly _CategoryModel: Model<HCategoryDocument>,
    private readonly _cloudinaryService: CloudinaryService,
  ) {}
  async create(
    userId: Types.ObjectId,
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image category required');

    const uploadImage = await this._cloudinaryService.uploadImage(
      file.buffer,
      'ecommerce/categories',
    );

    const createCategory = await this._CategoryModel.create({
      ...createCategoryDto,
      logo: uploadImage,
      createdBy: userId,
    });

    return createCategory;
  }

  findAll() {
    return this._CategoryModel.find();
  }

  findOne(id: string) {
    return this._CategoryModel.findById(id);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const category = await this._CategoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Update image if new image exists
    if (file) {
      const newImage = await this._cloudinaryService.replaceImage(
        file.buffer,
        category.logo?.public_id,
        'ecommerce/categories',
      );

      category.logo = newImage;
    }

    // Update text fields
    Object.assign(category, updateCategoryDto);

    await category.save();

    return category;
  }

  async remove(id: string) {
    const category = await this._CategoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.logo?.public_id) {
      await this._cloudinaryService.deleteImage(category.logo.public_id);
    }

    await this._CategoryModel.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
