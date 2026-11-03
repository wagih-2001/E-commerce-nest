import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { CartService } from './cart.service.js';
import { CreateCartDto } from './dto/create-cart.dto.js';
import { UpdateCartDto } from './dto/update-cart.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly _cartService: CartService) {}

  @Post('add-to-cart')
  addToCart(
    @Request() request: ExpressRequest,
    @Body() createCartDto: CreateCartDto,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    const userId = request.user._id;
    return this._cartService.addToCart(createCartDto, userId);
  }

  @Get()
  getCart(@Request() request: ExpressRequest) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    const userId = request.user._id;
    return this._cartService.getCart(userId);
  }

  @Patch('update-cart/:productId')
  updateCartItem(
    @Param('productId') productId: string,
    @Body() updateCartDto: UpdateCartDto,
    @Request() request: ExpressRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    console.log('PRODUCT ID FROM PARAM:', productId);

    const userId = request.user._id;

    return this._cartService.updateCartItem(productId, updateCartDto, userId);
  }

  @Delete('remove-item/:productId')
  removeItemsCart(
    @Request() request: ExpressRequest,
    @Param('productId') productId: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const userId = request.user._id;

    // Changed: Pass the productId as a string to the service.
    // The service validates it before converting it to ObjectId.
    return this._cartService.removeItemsCart(userId, productId);
  }
}
