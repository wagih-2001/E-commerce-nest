import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateCartDto } from './dto/create-cart.dto.js';
import { UpdateCartDto } from './dto/update-cart.dto.js';

import { InjectModel } from '@nestjs/mongoose';
import { Cart, HCartDocument } from '../DB/models/cart.model.js';
import { Model, Types } from 'mongoose';

import { HProductDocument, Product } from '../DB/models/product.model.js';
import { Coupon, HCouponDocument } from '../DB/models/coupon.model.js';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly _cartModel: Model<HCartDocument>,

    @InjectModel(Product.name)
    private readonly _productModel: Model<HProductDocument>,

    @InjectModel(Coupon.name)
    private readonly _couponModel: Model<HCouponDocument>,
  ) {}

  // Calculate cart total and applied coupon
  private async calculateTotalPrice(cart: HCartDocument): Promise<void> {
    // 1. Calculate products total
    let totalPrice = 0;

    for (const item of cart.items) {
      item.subTotal = item.quantity * item.pricePerUnit;
      totalPrice += item.subTotal;
    }

    cart.totalPrice = Number(totalPrice.toFixed(2));

    // 2. Check if coupon is applied
    if (!cart.appliedCoupon) {
      cart.discountAmount = 0;
      cart.finalTotal = cart.totalPrice;
      return;
    }

    // 3. Find applied coupon
    const coupon = await this._couponModel.findById(cart.appliedCoupon);

    // 4. Check if coupon exists
    if (!coupon) {
      cart.appliedCoupon = null;
      cart.discountAmount = 0;
      cart.finalTotal = cart.totalPrice;
      return;
    }

    // 5. Validate coupon
    const now = new Date();

    const isDateInvalid = now < coupon.startDate || now > coupon.expiryDate;

    const isUsageLimitReached =
      coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit;

    const alreadyUsed = (coupon.usedBy ?? []).some(
      (id) => id.toString() === cart.user.toString(),
    );

    if (
      !coupon.isActive ||
      isDateInvalid ||
      isUsageLimitReached ||
      alreadyUsed ||
      cart.items.length === 0
    ) {
      cart.appliedCoupon = null;
      cart.discountAmount = 0;
      cart.finalTotal = cart.totalPrice;
      return;
    }

    // 6. Calculate coupon discount
    const discountAmount = Number(
      ((cart.totalPrice * coupon.discountPercentage) / 100).toFixed(2),
    );

    cart.discountAmount = discountAmount;

    cart.finalTotal = Number((cart.totalPrice - discountAmount).toFixed(2));
  }

  async addToCart(
    createCartDto: CreateCartDto,
    userId: Types.ObjectId,
  ): Promise<HCartDocument> {
    const { productId, quantity } = createCartDto;

    // 1. Check if product exists
    const product = await this._productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Check stock
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. ${product.stock} units available`,
      );
    }

    // 3. Find user's cart
    let cart = await this._cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await this._cartModel.create({
        user: userId,
        items: [],
        totalPrice: 0,
        discountAmount: 0,
        finalTotal: 0,
        appliedCoupon: null,
      });
    }

    // 4. Check if product already exists
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (cartItemIndex > -1) {
      // 5. Calculate new quantity
      const targetNewQuantity = cart.items[cartItemIndex].quantity + quantity;

      // 6. Check combined quantity against stock
      if (targetNewQuantity > product.stock) {
        throw new BadRequestException(
          `Cannot add combined cart total ${targetNewQuantity}. ` +
            `Only ${product.stock} units are available`,
        );
      }

      // 7. Update quantity
      cart.items[cartItemIndex].quantity = targetNewQuantity;
    } else {
      // 8. Calculate product discount
      const discountAmount = (product.price * product.discount) / 100;
      const finalPrice = product.price - discountAmount;

      // 9. Add product to cart
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        pricePerUnit: finalPrice,
        subTotal: finalPrice * quantity,
      });
    }

    // 10. Recalculate prices
    await this.calculateTotalPrice(cart);

    await cart.save();
    await cart.populate('items.product');
    await cart.populate('appliedCoupon');

    return cart;
  }

  async getCart(userId: Types.ObjectId): Promise<HCartDocument> {
    // 1. Find user's cart
    let cart = await this._cartModel.findOne({ user: userId });

    // 2. Create cart if not exists
    if (!cart) {
      cart = new this._cartModel({
        user: userId,
        items: [],
        totalPrice: 0,
        discountAmount: 0,
        finalTotal: 0,
        appliedCoupon: null,
      });
    }

    // 3. Recalculate prices
    await this.calculateTotalPrice(cart);
    await cart.save();

    // 4. Populate relations
    await cart.populate('items.product');
    await cart.populate('appliedCoupon');

    return cart;
  }

  async updateCartItem(
    productId: string,
    updateCartDto: UpdateCartDto,
    userId: Types.ObjectId,
  ): Promise<HCartDocument> {
    const { quantity } = updateCartDto;

    // 1. Validate product ID
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }

    // 2. Find user's cart
    const cart = await this._cartModel.findOne({ user: userId });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // 3. Find product inside cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (cartItemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // 4. Find actual product
    const product = await this._productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 5. Check stock
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Insufficient stock. ${product.stock} units available`,
      );
    }

    // 6. Update quantity
    cart.items[cartItemIndex].quantity = quantity;

    // 7. Recalculate prices
    await this.calculateTotalPrice(cart);

    await cart.save();
    await cart.populate('items.product');
    await cart.populate('appliedCoupon');

    return cart;
  }

  async removeItemsCart(
    userId: Types.ObjectId,
    productId: string,
  ): Promise<HCartDocument> {
    // 1. Validate product ID
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }

    // 2. Find user's cart
    const cart = await this._cartModel.findOne({ user: userId });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    // 3. Find product inside cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (cartItemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // 4. Remove product
    cart.items.splice(cartItemIndex, 1);

    // 5. Recalculate prices
    await this.calculateTotalPrice(cart);

    await cart.save();
    await cart.populate('items.product');
    await cart.populate('appliedCoupon');

    return cart;
  }
}
