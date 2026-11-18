import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
  UnauthorizedException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import type { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { RoleEnum } from '../common/enums/user.enum.js';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto.js';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create-order')
  @UseGuards(AuthGuard)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() request: ExpressRequest,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    const userId = request.user._id as Types.ObjectId;
    return this.orderService.create(createOrderDto, userId);
  }
  @Post('confirm-order/:id')
  @UseGuards(AuthGuard, AdminGuard)
  confirm(@Param('id') id: string) {
    return this.orderService.confirm(id);
  }

  @Patch('cancel/:id')
  @UseGuards(AuthGuard)
  cancel(@Param('id') id: string, @Request() req: ExpressRequest) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user._id.toString();
    const role = req.user.role as RoleEnum;
    return this.orderService.cancel(id, userId, role);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard)
  findMyOrders(
    @Request() req: ExpressRequest,
    @Query() query: GetOrdersQueryDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.orderService.findMyOrders(
      req.user._id.toString(),
      query.page,
      query.limit,
    );
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  findAllOrders(@Query() query: GetOrdersQueryDto) {
    return this.orderService.findAllOrders(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOrderById(@Param('id') id: string, @Request() req: ExpressRequest) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.orderService.findOrderById(
      id,
      req.user._id.toString(),
      req.user.role as RoleEnum,
    );
  }
}
