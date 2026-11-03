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

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly _cartModel: Model<HCartDocument>,
    @InjectModel(Product.name)
    private readonly _productModel: Model<HProductDocument>,
  ) {}
  private async calculateTotalPrice(cart: HCartDocument): Promise<void> {
    let totalPrice = 0;
    for (const item of cart.items) {
      item.subTotal = item.quantity * item.pricePerUnit;
      totalPrice += item.subTotal;
    }
    cart.totalPrice = totalPrice;
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

    // 2. Check if the requested quantity is available in stock
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. ${product.stock} units available`,
      );
    }

    // 3. Check if the user already has a cart
    let cart = await this._cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await this._cartModel.create({
        user: userId,
        items: [],
        totalPrice: 0,
      });
    }

    // 4. Check if the product is already in the cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (cartItemIndex > -1) {
      // 5. Calculate the new total quantity
      const targetNewQuantity = cart.items[cartItemIndex].quantity + quantity;

      // 6. Check if the combined quantity exceeds the available stock
      if (targetNewQuantity > product.stock) {
        throw new BadRequestException(
          `Cannot add combined cart total ${targetNewQuantity}. ` +
            `Only ${product.stock} units are available`,
        );
      }

      // 7. Update the existing cart item quantity
      cart.items[cartItemIndex].quantity = targetNewQuantity;
    } else {
      // 8. Calculate the discount amount
      const discountAmount = (product.price * product.discount) / 100;

      // 9. Calculate the final price after discount
      const finalPrice = product.price - discountAmount;

      // 10. Add the product as a new cart item
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        pricePerUnit: finalPrice,
        subTotal: finalPrice * quantity,
      });
    }

    this.calculateTotalPrice(cart);
    await cart.save();
    await cart.populate('items.product');

    return cart;
  }

  async getCart(userId: Types.ObjectId): Promise<HCartDocument> {
    // 1. Find the cart that belongs to the current user
    let cart = await this._cartModel
      .findOne({ user: userId })
      .populate('items.product');

    // 2. Check if the cart exists
    if (!cart) {
      cart = new this._cartModel({ user: userId, items: [], totalPrice: 0 });
      await cart.save();
    }
    // 3. Return the user's cart
    return cart;
  }

  async updateCartItem(
    productId: string,
    updateCartDto: UpdateCartDto,
    userId: Types.ObjectId,
  ): Promise<HCartDocument> {
    const { quantity } = updateCartDto;

    // 1. Check if product id is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }

    // 2. Find the user's cart
    const cart = await this._cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // 3. Find the product inside the cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (cartItemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // 4. Find the actual product to check the current stock
    const product = await this._productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 5. Check if the new quantity is available in stock
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Insufficient stock. ${product.stock} units available`,
      );
    }

    // 6. Update the quantity
    cart.items[cartItemIndex].quantity = quantity;

    this.calculateTotalPrice(cart);
    await cart.save();
    await cart.populate('items.product');
    return cart;
  }

  async removeItemsCart(
    userId: Types.ObjectId,
    productId: string,
  ): Promise<HCartDocument> {
    // 1. Validate the product id before converting it to ObjectId
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }

    // 2. Find the cart that belongs to the current user
    const cart = await this._cartModel.findOne({
      user: userId,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    // 3. Check if the product exists inside the user's cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    // Changed: Return 404 instead of silently returning the same cart
    // when the requested product is not inside the cart.
    if (cartItemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // 4. Remove the product from the cart
    cart.items.splice(cartItemIndex, 1);

    // 5. Recalculate all item subtotals and the cart total price
    this.calculateTotalPrice(cart);

    await cart.save();
    await cart.populate('items.product');
    return cart;
  }
}
