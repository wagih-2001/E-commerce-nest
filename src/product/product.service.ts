import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { HProductDocument, Product } from '../DB/models/product.model.js';
import { Model, Types } from 'mongoose';
import { Category, HCategoryDocument } from '../DB/models/category.model.js';
import { Brand, HBrandDocument } from '../DB/models/brand.model.js';
import { CloudinaryService } from '../common/services/cloudinary.js';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly _productModel: Model<HProductDocument>,
    @InjectModel(Category.name)
    private readonly _categoryModel: Model<HCategoryDocument>,
    @InjectModel(Brand.name)
    private readonly _brandModel: Model<HBrandDocument>,
    private readonly _cloudinaryService: CloudinaryService,
  ) {}

  async create(
    adminId: Types.ObjectId,
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    // 1. Check images
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    // 2. Check category exists
    const category = await this._categoryModel.findById(
      createProductDto.category,
    );

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // 3. Check brand exists
    const brand = await this._brandModel.findById(createProductDto.brand);

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    const productId = new Types.ObjectId();

    const productFolder = `ecommerce/products/${productId}`;

    // Upload all images
    const images = files.map(async (file) => {
      return this._cloudinaryService.uploadImage(file.buffer, productFolder);
    });

    const uploadedImages = await Promise.all(images);

    // 5. Create product
    const createProduct = await this._productModel.create({
      _id: productId,
      ...createProductDto,
      images: uploadedImages,
      createdBy: adminId,
    });

    // 6. Populate relations
    await createProduct.populate(['category', 'brand']);

    return createProduct;
  }

  async findAll() {
    return await this._productModel.find().populate(['category', 'brand']);
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product id');
    }
    const product = await this._productModel
      .findById(id)
      .populate(['category', 'brand']);

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    files: Express.Multer.File[],
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    // 1. Check if the product id is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product id');
    }

    // 2. Find the product
    // If the product does not exist, stop the update process
    const product = await this._productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 3. Validate category if it was provided in the update request
    if (updateProductDto.category) {
      const category = await this._categoryModel.findById(
        updateProductDto.category,
      );

      // Category must exist before assigning it to the product
      if (!category) {
        throw new BadRequestException('Category not found');
      }

      // Convert the category string id to ObjectId
      product.category = new Types.ObjectId(updateProductDto.category);
    }

    // 4. Validate brand if it was provided in the update request
    if (updateProductDto.brand) {
      const brand = await this._brandModel.findById(updateProductDto.brand);

      // Brand must exist before assigning it to the product
      if (!brand) {
        throw new BadRequestException('Brand not found');
      }

      // Convert the brand string id to ObjectId
      product.brand = new Types.ObjectId(updateProductDto.brand);
    }

    // 5. Update normal product fields
    // We check !== undefined because this is an update operation.
    // The user may update only one field and leave the others unchanged.

    if (updateProductDto.name !== undefined) {
      product.name = updateProductDto.name;
    }

    if (updateProductDto.description !== undefined) {
      product.description = updateProductDto.description;
    }

    if (updateProductDto.price !== undefined) {
      product.price = updateProductDto.price;
    }

    if (updateProductDto.stock !== undefined) {
      product.stock = updateProductDto.stock;
    }

    if (updateProductDto.discount !== undefined) {
      product.discount = updateProductDto.discount;
    }

    // 6. Prepare old images
    // We keep the old images because if new images are uploaded,
    // we need to delete the old images from Cloudinary later.
    let oldImages = product.images;

    // 7. Replace images only if new images were provided
    if (files && files.length > 0) {
      // Save the current images before replacing them
      oldImages = product.images;

      // Use the product id as the Cloudinary folder name
      const productFolder = `ecommerce/products/${product._id}`;

      // Upload all new images to Cloudinary
      const images = files.map((file) => {
        return this._cloudinaryService.uploadImage(file.buffer, productFolder);
      });

      // Wait until all images are uploaded successfully
      const uploadedImages = await Promise.all(images);

      // Replace the old images with the new images
      product.images = uploadedImages;
    }

    // 8. Save all product changes to MongoDB

    await product.save();

    // 9. Delete old images from Cloudinary
    // We do this AFTER MongoDB save.
    // This way, if saving the product fails,
    // we don't lose the old images.
    if (files && files.length > 0) {
      const deleteImages = oldImages.map((image) => {
        return this._cloudinaryService.deleteImage(image.public_id);
      });

      // Delete all old images in parallel
      await Promise.all(deleteImages);
    }

    await product.populate(['category', 'brand']);

    // 11. Return the updated product
    return product;
  }

  async remove(id: string) {
    // 1. Check product valid id
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product id');
    }

    // 2. Check product exists
    const product = await this._productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 3.Delete images
    await Promise.all(
      product.images.map((image) =>
        this._cloudinaryService.deleteImage(image.public_id),
      ),
    );

    // 4.Delete product folder
    const productFolder = `ecommerce/products/${product._id}`;

    await this._cloudinaryService.deleteFolder(productFolder);

    // 5.Delete product from MongoDB
    await this._productModel.findByIdAndDelete(id);
  }
}
