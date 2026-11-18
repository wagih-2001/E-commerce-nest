import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { HOrderDocument, Order } from '../DB/models/order.model.js';
import { Model } from 'mongoose';
import { HProductDocument, Product } from '../DB/models/product.model.js';
import { Coupon, HCouponDocument } from '../DB/models/coupon.model.js';
import { Types } from 'mongoose';
import { OrderStatus } from '../common/enums/order.enum.js';
import { RoleEnum } from '../common/enums/user.enum.js';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly _orderModel: Model<HOrderDocument>,

    @InjectModel(Product.name)
    private readonly _productModel: Model<HProductDocument>,

    @InjectModel(Coupon.name)
    private readonly _couponModel: Model<HCouponDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: Types.ObjectId) {
    // 1. Extract product IDs
    const productIds = createOrderDto.items.map((item) => item.product);

    // 2. Fetch products from database
    const products = await this._productModel.find({
      _id: { $in: productIds },
    });

    // 3. Check if all products exist
    if (products.length !== new Set(productIds).size) {
      throw new NotFoundException('One or more products not found');
    }

    // 4. Create product lookup map
    const productsMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    // 5. Merge duplicate products and calculate quantities
    const quantitiesMap = new Map<string, number>();
    for (const item of createOrderDto.items) {
      const productId = item.product;
      const currentQuantity = quantitiesMap.get(productId) || 0;
      quantitiesMap.set(productId, currentQuantity + item.quantity);
    }

    // 6. Prepare order items and calculate subtotal
    let subtotal = 0;
    const orderItems = [];
    for (const [productId, quantity] of quantitiesMap) {
      const product = productsMap.get(productId);
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check available stock
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}`,
        );
      }

      // Calculate discounted product price
      const discountedPrice =
        product.price - (product.price * product.discount) / 100;

      const finalPrice =
        Math.round((discountedPrice + Number.EPSILON) * 100) / 100;

      // Calculate item subtotal
      const itemSubtotal =
        Math.round((finalPrice * quantity + Number.EPSILON) * 100) / 100;

      subtotal += itemSubtotal;

      // Create product snapshot
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0],
        price: finalPrice,
        quantity,
        subtotal: itemSubtotal,
      });
    }

    // 7. Round subtotal
    subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;

    // 8. Validate coupon if provided
    let couponSnapshot = null;
    let discount = 0;

    if (createOrderDto.couponCode) {
      const couponCode = createOrderDto.couponCode.trim().toUpperCase();

      const coupon = await this._couponModel.findOne({
        code: couponCode,
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      // Check coupon status
      if (!coupon.isActive) {
        throw new BadRequestException('Coupon is inactive');
      }

      // Check coupon dates
      const now = new Date();

      if (now < coupon.startDate || now > coupon.expiryDate) {
        throw new BadRequestException('Coupon is expired or not available yet');
      }

      // Check usage limit
      if (
        coupon.usageLimit !== undefined &&
        coupon.usageCount >= coupon.usageLimit
      ) {
        throw new BadRequestException('Coupon usage limit reached');
      }

      // Check if user already used this coupon
      const alreadyUsed = coupon.usedBy.some(
        (id) => id.toString() === userId.toString(),
      );

      if (alreadyUsed) {
        throw new BadRequestException('You have already used this coupon');
      }

      // Calculate coupon discount
      discount =
        Math.round(((subtotal * coupon.discountPercentage) / 100) * 100) / 100;

      // Create coupon snapshot
      couponSnapshot = {
        coupon: coupon._id,
        code: coupon.code,
        discountAmount: discount,
      };
    }

    // 9. Calculate shipping cost
    const shippingCost = 0;

    // 10. Calculate final total
    const total = Math.max(
      0,
      Math.round((subtotal + shippingCost - discount + Number.EPSILON) * 100) /
        100,
    );

    // 11. Create order
    const order = await this._orderModel.create({
      user: userId,
      items: orderItems,
      shippingAddress: createOrderDto.shippingAddress,
      coupon: couponSnapshot,
      subtotal,
      shippingCost,
      discount,
      total,
      paymentMethod: createOrderDto.paymentMethod,
      notes: createOrderDto.notes,
    });

    // 12. Return created order
    return order;
  }

  async confirm(orderId: string) {
    // 1. Validate order ID
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    // 2. Start MongoDB session
    const session = await this._orderModel.db.startSession();

    let confirmedOrder: HOrderDocument | null = null;

    try {
      // 3. Start transaction
      await session.withTransaction(async () => {
        // 4. Find order
        const order = await this._orderModel.findById(orderId).session(session);

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        // 5. Check order status
        if (order.orderStatus !== OrderStatus.PENDING) {
          throw new BadRequestException('Only pending orders can be confirmed');
        }

        if (order.stockDeductedAt) {
          throw new BadRequestException(
            'Stock has already been deducted for this order',
          );
        }

        // 6. Deduct stock from all products
        for (const item of order.items) {
          const updatedProduct = await this._productModel.findOneAndUpdate(
            {
              _id: item.product,
              stock: { $gte: item.quantity },
            },
            {
              $inc: { stock: -item.quantity },
            },
            {
              new: true,
              session,
            },
          );

          if (!updatedProduct) {
            throw new BadRequestException(
              `Insufficient stock or product unavailable: ${item.name}`,
            );
          }
        }

        // 7. Consume coupon if the order has one
        if (order.coupon) {
          const coupon = await this._couponModel
            .findById(order.coupon.coupon)
            .session(session);

          if (!coupon) {
            throw new NotFoundException('Coupon not found');
          }

          const now = new Date();

          // Build atomic coupon filter
          const couponFilter = {
            _id: coupon._id,
            isActive: true,
            startDate: { $lte: now },
            expiryDate: { $gte: now },
            usedBy: { $ne: order.user },
            ...(coupon.usageLimit !== undefined
              ? { usageCount: { $lt: coupon.usageLimit } }
              : {}),
          };

          // Atomic coupon update
          const updatedCoupon = await this._couponModel.findOneAndUpdate(
            couponFilter,
            {
              $inc: { usageCount: 1 },
              $addToSet: { usedBy: order.user },
            },
            {
              new: true,
              session,
            },
          );

          if (!updatedCoupon) {
            throw new BadRequestException(
              'Coupon is invalid, expired, already used or usage limit reached',
            );
          }
        }

        // 8. Update order status
        confirmedOrder = await this._orderModel.findOneAndUpdate(
          {
            _id: order._id,
            orderStatus: OrderStatus.PENDING,
            stockDeductedAt: null,
          },
          {
            $set: {
              orderStatus: OrderStatus.CONFIRMED,
              confirmedAt: new Date(),
              stockDeductedAt: new Date(),
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!confirmedOrder) {
          throw new BadRequestException('Order could not be confirmed');
        }
      });

      // 9. Return confirmed order
      return confirmedOrder;
    } finally {
      // 10. End session
      await session.endSession();
    }
  }

  async cancel(orderId: string, userId: string, userRole: RoleEnum) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const session = await this._orderModel.db.startSession();

    let cancelledOrder: HOrderDocument | null = null;

    try {
      await session.withTransaction(async () => {
        // 1. Find order
        const order = await this._orderModel.findById(orderId).session(session);

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        // 2. Check ownership
        const isAdmin = userRole === RoleEnum.ADMIN;
        const isOwner = order.user.toString() === userId;

        if (!isAdmin && !isOwner) {
          throw new ForbiddenException(
            'You are not allowed to cancel this order',
          );
        }

        // 3. Check allowed cancellation statuses
        const allowedStatuses = isAdmin
          ? [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING]
          : [OrderStatus.PENDING, OrderStatus.CONFIRMED];

        if (!allowedStatuses.includes(order.orderStatus)) {
          throw new BadRequestException('This order cannot be cancelled');
        }

        // 4. Check whether stock was deducted
        const wasStockDeducted = Boolean(order.stockDeductedAt);

        // Confirmed/Processing orders should have deducted stock
        if (
          [OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(
            order.orderStatus,
          ) &&
          !wasStockDeducted
        ) {
          throw new BadRequestException(
            'Order stock deduction state is inconsistent',
          );
        }

        // 5. Atomically change order status first
        cancelledOrder = await this._orderModel.findOneAndUpdate(
          {
            _id: order._id,
            orderStatus: order.orderStatus,
            stockDeductedAt: order.stockDeductedAt,
          },
          {
            $set: {
              orderStatus: OrderStatus.CANCELLED,
              cancelledAt: new Date(),
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!cancelledOrder) {
          throw new BadRequestException('Order could not be cancelled');
        }

        // 6. Restore product stock if it was deducted
        if (wasStockDeducted) {
          for (const item of order.items) {
            const restoredProduct = await this._productModel.findByIdAndUpdate(
              item.product,
              {
                $inc: {
                  stock: item.quantity,
                },
              },
              {
                new: true,
                session,
              },
            );

            if (!restoredProduct) {
              throw new NotFoundException(`Product not found: ${item.name}`);
            }
          }
        }

        // 7. Restore coupon usage if it was consumed
        if (wasStockDeducted && order.coupon) {
          const restoredCoupon = await this._couponModel.findOneAndUpdate(
            {
              _id: order.coupon.coupon,
              usageCount: { $gt: 0 },
              usedBy: order.user,
            },
            {
              $inc: {
                usageCount: -1,
              },
              $pull: {
                usedBy: order.user,
              },
            },
            {
              new: true,
              session,
            },
          );

          if (!restoredCoupon) {
            throw new BadRequestException('Coupon usage could not be restored');
          }
        }
      });

      return cancelledOrder;
    } finally {
      await session.endSession();
    }
  }

  async findMyOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const filter = {
      user: new Types.ObjectId(userId),
    };

    const [orders, total] = await Promise.all([
      this._orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      this._orderModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 2. Get Order By ID
  async findOrderById(orderId: string, userId: string, userRole: RoleEnum) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const isAdmin = userRole === RoleEnum.ADMIN;
    const filter = isAdmin ? { _id: orderId } : { _id: orderId, user: userId };
    const order = await this._orderModel.findOne(filter);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      success: true,
      data: order,
    };
  }

  // 3. Get All Orders (Admin)
  async findAllOrders(query: GetOrdersQueryDto) {
    const { page = 1, limit = 10, status, fromDate, toDate } = query;

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      throw new BadRequestException(
        'fromDate must be before or equal to toDate',
      );
    }

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    
    if (status) {
      filter.orderStatus = status;
    }

    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    const [orders, total] = await Promise.all([
      this._orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      this._orderModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
