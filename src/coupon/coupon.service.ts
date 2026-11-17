import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';

import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Coupon, HCouponDocument } from '../DB/models/coupon.model.js';

import { Cart, HCartDocument } from '../DB/models/cart.model.js';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly _couponModel: Model<HCouponDocument>,

    @InjectModel(Cart.name)
    private readonly _cartModel: Model<HCartDocument>,
  ) {}

  // CREATE
  async create(createCouponDto: CreateCouponDto, adminId: Types.ObjectId) {
    const { code, startDate, expiryDate } = createCouponDto;

    // 1. Validate dates
    if (new Date(expiryDate) <= new Date(startDate)) {
      throw new BadRequestException('Expiry date must be after start date');
    }

    // 2. Normalize coupon code
    const cleanCode = code.trim().toUpperCase();

    // 3. Check duplicate code
    const existingCoupon = await this._couponModel.findOne({
      code: cleanCode,
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // 4. Create coupon
    try {
      const newCoupon = await this._couponModel.create({
        ...createCouponDto,
        code: cleanCode,
        createdBy: adminId,
      });

      return await newCoupon.populate(
        'createdBy',
        'email firstName lastName -_id',
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Coupon code already exists');
      }

      throw error;
    }
  }

  // VALIDATE COUPON
  async validateCoupon(code: string, userId: Types.ObjectId) {
    // 1. Validate user ID
    if (!userId || !Types.ObjectId.isValid(userId.toString())) {
      throw new BadRequestException('Invalid user ID');
    }

    // 2. Validate coupon code
    if (typeof code !== 'string' || !code.trim()) {
      throw new BadRequestException('Coupon code is required');
    }

    const cleanCoupon = code.trim().toUpperCase();

    // 3. Find coupon
    const coupon = await this._couponModel.findOne({
      code: cleanCoupon,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // 4. Check active status
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    // 5. Check validity dates
    const now = new Date();

    if (now < coupon.startDate) {
      throw new BadRequestException('Coupon is not active yet');
    }

    if (now > coupon.expiryDate) {
      throw new BadRequestException('Coupon is expired');
    }

    // 6. Check usage limit
    if (
      coupon.usageLimit !== undefined &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // 7. Check if user already used coupon
    const alreadyUsed = (coupon.usedBy ?? []).some(
      (id) => id.toString() === userId.toString(),
    );

    if (alreadyUsed) {
      throw new BadRequestException('Coupon already used');
    }

    // 8. Find user's cart
    const cart = await this._cartModel.findOne({
      user: userId,
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // 9. Calculate discount
    const cartTotal = cart.totalPrice;

    const discountAmount = Number(
      ((cartTotal * coupon.discountPercentage) / 100).toFixed(2),
    );

    const finalTotal = Number((cartTotal - discountAmount).toFixed(2));

    // 10. Return validation result
    return {
      valid: true,
      message: 'Coupon is valid',

      coupon: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      },

      pricing: {
        cartTotal,
        discountAmount,
        finalTotal,
      },
    };
  }

  // APPLY COUPON
  async applyCoupon(code: string, userId: Types.ObjectId) {
    // 1. Validate coupon and calculate discount
    const validation = await this.validateCoupon(code, userId);

    // 2. Find user's cart
    const cart = await this._cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // 3. Find coupon
    const cleanCode = code.trim().toUpperCase();

    const coupon = await this._couponModel.findOne({
      code: cleanCode,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // 4. Apply coupon
    cart.appliedCoupon = coupon._id;
    cart.discountAmount = validation.pricing.discountAmount;
    cart.finalTotal = validation.pricing.finalTotal;

    // 5. Save cart
    await cart.save();

    return {
      message: 'Coupon applied to cart successfully',
      cart,
    };
  }

  // REMOVE COUPON FROM CART
  async removeCoupon(userId: Types.ObjectId) {
    // 1. Validate user ID
    if (!userId || !Types.ObjectId.isValid(userId.toString())) {
      throw new BadRequestException('Invalid user ID');
    }

    // 2. Find user's cart
    const cart = await this._cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // 3. Check applied coupon
    if (!cart.appliedCoupon) {
      throw new BadRequestException('No coupon applied to this cart');
    }

    // 4. Remove coupon
    cart.appliedCoupon = null;
    cart.discountAmount = 0;
    cart.finalTotal = cart.totalPrice;

    // 5. Save cart
    await cart.save();

    return {
      message: 'Coupon removed successfully',
      cart,
    };
  }

  // READ ALL
  findAll() {
    return this._couponModel
      .find()
      .populate('createdBy', 'email firstName lastName -_id');
  }

  // READ ONE
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    const coupon = await this._couponModel
      .findById(id)
      .populate('createdBy', 'email firstName lastName -_id');

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  // UPDATE
  async update(id: string, updateCouponDto: UpdateCouponDto) {
    // 1. Validate ID
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    // 2. Find coupon
    const coupon = await this._couponModel.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // 3. Normalize code if provided
    if (updateCouponDto.code !== undefined) {
      const cleanCode = updateCouponDto.code.trim().toUpperCase();

      if (cleanCode !== coupon.code) {
        // Prevent changing code after usage
        if ((coupon.usedBy ?? []).length > 0) {
          throw new BadRequestException(
            'Cannot change coupon code after it has been used',
          );
        }

        // Check duplicate code
        const existingCoupon = await this._couponModel.findOne({
          code: cleanCode,
          _id: { $ne: coupon._id },
        });

        if (existingCoupon) {
          throw new ConflictException('Coupon code already exists');
        }

        coupon.code = cleanCode;
      }
    }

    // 4. Validate dates
    const startDate =
      updateCouponDto.startDate !== undefined
        ? new Date(updateCouponDto.startDate)
        : coupon.startDate;

    const expiryDate =
      updateCouponDto.expiryDate !== undefined
        ? new Date(updateCouponDto.expiryDate)
        : coupon.expiryDate;

    if (expiryDate <= startDate) {
      throw new BadRequestException('Expiry date must be after start date');
    }

    // 5. Validate usage limit
    if (
      updateCouponDto.usageLimit !== undefined &&
      updateCouponDto.usageLimit < coupon.usageCount
    ) {
      throw new BadRequestException(
        'Usage limit cannot be less than current usage count',
      );
    }

    // 6. Update allowed fields
    const { code, ...updateData } = updateCouponDto;

    Object.assign(coupon, updateData);

    // 7. Save
    try {
      await coupon.save();

      return await coupon.populate(
        'createdBy',
        'email firstName lastName -_id',
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Coupon code already exists');
      }

      throw error;
    }
  }

  // DELETE
  async remove(id: string) {
    // 1. Validate ID
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    // 2. Find coupon
    const coupon = await this._couponModel.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // 3. Remove coupon from all carts
    const carts = await this._cartModel.find({
      appliedCoupon: coupon._id,
    });

    for (const cart of carts) {
      cart.appliedCoupon = null;
      cart.discountAmount = 0;
      cart.finalTotal = cart.totalPrice;

      await cart.save();
    }

    // 4. Delete coupon
    await this._couponModel.deleteOne({
      _id: coupon._id,
    });

    return {
      message: 'Coupon deleted successfully',
    };
  }
}
