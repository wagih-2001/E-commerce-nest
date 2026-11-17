import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import { CouponService } from './coupon.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';

import type { Request as ExpressRequest } from 'express';

import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { Types } from 'mongoose';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('create-coupon')
  @UseGuards(AuthGuard, AdminGuard)
  create(
    @Body() createCouponDto: CreateCouponDto,
    @Request() request: ExpressRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized user');
    }

    const adminId = request.user._id;

    return this.couponService.create(createCouponDto, adminId);
  }

  @Post('validate-coupon')
  @UseGuards(AuthGuard)
  validateCoupon(
    @Body('code') code: string,
    @Request() request: ExpressRequest,
  ) {
    const userId = request.user?._id as Types.ObjectId;

    return this.couponService.validateCoupon(code, userId);
  }

  @Post('apply-coupon')
  @UseGuards(AuthGuard)
  applyCoupon(@Body('code') code: string, @Request() request: ExpressRequest) {
    const userId = request.user?._id as Types.ObjectId;

    return this.couponService.applyCoupon(code, userId);
  }

  @Delete('remove-coupon')
  @UseGuards(AuthGuard)
  removeCoupon(@Request() request: ExpressRequest) {
    const userId = request.user?._id as Types.ObjectId;

    return this.couponService.removeCoupon(userId);
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  findAll() {
    return this.couponService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @Patch('update-coupon/:id')
  @UseGuards(AuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(id, updateCouponDto);
  }

  @Delete('delete-coupon/:id')
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }
}
