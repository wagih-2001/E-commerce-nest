import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { HReviewDocument, Review } from '../DB/models/review.model.js';
import { HProductDocument, Product } from '../DB/models/product.model.js';
import { Model, Types } from 'mongoose';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly _reviewModel: Model<HReviewDocument>,
    @InjectModel(Product.name)
    private readonly _productModel: Model<HProductDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: Types.ObjectId) {
    // 1. Check if the product exists
    const product = await this._productModel.exists({
      _id: createReviewDto.productId,
    });

    if (!product) {
      throw new NotFoundException("Product doesn't exist");
    }

    // 2. Check if the user already reviewed this product
    const existingReview = await this._reviewModel.findOne({
      product: createReviewDto.productId,
      user: userId,
    });

    if (existingReview) {
      throw new ConflictException('You already reviewed this product');
    }

    // 3. Create the new review
    const newReview = await this._reviewModel.create({
      product: new Types.ObjectId(createReviewDto.productId),
      user: userId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });

    // 4. Populate user and product information

    await newReview.populate([
      {
        path: 'user',
        select: 'firstName lastName email -_id',
      },
      {
        path: 'product',
      },
    ]);

    // 5. Return the created review
    return newReview;
  }

  async findAll() {
    return await this._reviewModel.find().populate([
      {
        path: 'user',
        select: 'firstName lastName email -_id',
      },
      {
        path: 'product',
      },
    ]);
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review id');
    }
    const review = await this._reviewModel.findById(id).populate([
      {
        path: 'user',
        select: 'firstName lastName email -_id',
      },
      {
        path: 'product',
      },
    ]);

    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: Types.ObjectId,
  ) {
    // 1. Check if the review id is valid
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review id');
    }

    // 2. Find the review
    const review = await this._reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // 3. Check ownership
    if (review.user.toString() !== userId.toString()) {
      throw new ForbiddenException('You are not the owner of this review');
    }

    // 4. Update rating
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }

    // 5. Update comment
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }

    // 6. Save changes
    await review.save();

    // 7. Populate relations
    await review.populate([
      {
        path: 'user',
        select: 'firstName lastName email -_id',
      },
      {
        path: 'product',
      },
    ]);

    return review;
  }
  async remove(id: string, userId: Types.ObjectId) {
    // 1. Check if the review id is valid
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review id');
    }

    // 2. Find the review
    const review = await this._reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // 3. Check if the current user owns this review
    if (review.user.toString() !== userId.toString()) {
      throw new ForbiddenException('You are not the owner of this review');
    }

    // 4. Delete the review
    await review.deleteOne();

    // 5. Return a success response
    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }
}
