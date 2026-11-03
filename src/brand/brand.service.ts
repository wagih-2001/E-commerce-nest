import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Brand, HBrandDocument } from '../DB/models/brand.model.js';
import { CloudinaryService } from '../common/services/cloudinary.js';
import { Category, HCategoryDocument } from '../DB/models/category.model.js';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name)
    private readonly _brandModel: Model<HBrandDocument>,
    @InjectModel(Category.name)
    private readonly _categoryModel: Model<HCategoryDocument>,
    private readonly _cloudinaryService: CloudinaryService,
  ) {}

  async create(
    adminId: Types.ObjectId,
    createBrandDto: CreateBrandDto,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image category required');

    const uploadImage = await this._cloudinaryService.uploadImage(
      file.buffer,
      'ecommerce/brands',
    );

    const existingCount = await this._categoryModel.countDocuments({
      _id: { $in: createBrandDto.categories },
    });
    if (existingCount !== createBrandDto.categories.length) {
      throw new BadRequestException('Database integrity issue ');
    }

    const createBrand = await this._brandModel.create({
      ...createBrandDto,
      logo: uploadImage,
      createdBy: adminId,
    });
    await createBrand.populate('categories');
    return createBrand;
  }

  findAll() {
    return this._brandModel.find().populate('categories');
  }

  findOne(id: string) {
    return this._brandModel.findById(id).populate('categories');
  }

  async update(
    id: string,
    updateBrandDto: UpdateBrandDto,
    file?: Express.Multer.File,
  ) {
    // 1. Find brand
    const brand = await this._brandModel.findById(id);

    // 2. Check if brand exists
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // 3. Update categories if provided
    if (updateBrandDto.categories) {
      const existingCount = await this._categoryModel.countDocuments({
        _id: { $in: updateBrandDto.categories },
      });

      if (existingCount !== updateBrandDto.categories.length) {
        throw new BadRequestException('One or more categories do not exist');
      }

      brand.categories = updateBrandDto.categories.map(
        (categoryId) => new Types.ObjectId(categoryId),
      );
    }

    // 4. Update name if provided
    if (updateBrandDto.name !== undefined) {
      brand.name = updateBrandDto.name;
    }

    // 5. Replace image if provided
    if (file) {
      const uploadImage = await this._cloudinaryService.replaceImage(
        file.buffer,
        brand.logo?.public_id,
        'ecommerce/brands',
      );

      brand.logo = uploadImage;
    }

    // 6. Save changes
    await brand.save();

    // 7. Populate categories
    await brand.populate('categories');

    // 8. Return updated brand
    return brand;
  }

  async remove(id: string) {
    // 1. Find brand
    const brand = await this._brandModel.findById(id);

    // 2. Check if brand exists
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // 3. Delete brand logo from Cloudinary
    if (brand.logo?.public_id) {
      await this._cloudinaryService.deleteImage(brand.logo.public_id);
    }

    // 4. Delete brand from MongoDB
    await this._brandModel.findByIdAndDelete(id);

    // 5. Return response
    return {
      success: true,
      message: 'Brand deleted successfully',
    };
  }
}
